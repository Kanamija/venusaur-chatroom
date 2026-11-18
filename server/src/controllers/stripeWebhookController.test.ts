import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import {
  createStripeWebhookHandler,
  type StripeWebhookDeps,
} from './stripeWebhookController.js';

function makeEvent(overrides: Partial<Stripe.Checkout.Session> = {}) {
  return {
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_1',
        payment_status: 'paid',
        client_reference_id: 'user_1',
        metadata: { userId: 'user_1', roomName: 'Mewtwo' },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

// In-memory stand-ins for the two Mongo collections.
function makeDeps(
  event: Stripe.Event,
  overrides: Partial<StripeWebhookDeps> = {},
) {
  const processed = new Set<string>();
  const access = new Map<string, string>();
  const clearedSessions: string[] = [];
  const deps: StripeWebhookDeps = {
    getWebhookSecret: () => 'whsec_test',
    constructEvent: () => event,
    markEventProcessed: async (eventId) => {
      if (processed.has(eventId)) return false;
      processed.add(eventId);
      return true;
    },
    grantRoomAccess: async (userId, roomName, sessionId) => {
      const key = `${userId}:${roomName}`;
      if (!access.has(key)) access.set(key, sessionId);
    },
    clearPendingCheckout: async (sessionId) => {
      clearedSessions.push(sessionId);
    },
    ...overrides,
  };
  return { deps, processed, access, clearedSessions };
}

async function callHandler(deps: StripeWebhookDeps, signature = 't=1,v1=abc') {
  const req = {
    headers: { 'stripe-signature': signature },
    body: Buffer.from('{}'),
  } as unknown as Request;
  const result: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  } as unknown as Response;
  await createStripeWebhookHandler(deps)(req, res, () => {});
  return result;
}

describe('Stripe webhook handler', () => {
  it('unlocks the room on a paid checkout.session.completed', async () => {
    const { deps, access } = makeDeps(makeEvent());
    const res = await callHandler(deps);
    assert.equal(res.status, 200);
    assert.equal(access.get('user_1:Mewtwo'), 'cs_test_1');
  });

  it('unlocks the room when a delayed payment succeeds later', async () => {
    const completedUnpaid = makeDeps(makeEvent({ payment_status: 'unpaid' }));
    assert.equal((await callHandler(completedUnpaid.deps)).status, 200);
    assert.equal(completedUnpaid.access.size, 0);

    const asyncSucceeded = {
      ...makeEvent(),
      id: 'evt_async_1',
      type: 'checkout.session.async_payment_succeeded',
    } as unknown as Stripe.Event;
    const { deps, access } = makeDeps(asyncSucceeded);
    const res = await callHandler(deps);
    assert.equal(res.status, 200);
    assert.equal(access.get('user_1:Mewtwo'), 'cs_test_1');
  });

  it('processes a duplicate delivery only once', async () => {
    const { deps, access } = makeDeps(makeEvent());
    const first = await callHandler(deps);
    const second = await callHandler(deps);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.deepEqual(second.body, { received: true, duplicate: true });
    // Exactly one persisted entitlement, still tied to the original session.
    assert.equal(access.size, 1);
    assert.equal(access.get('user_1:Mewtwo'), 'cs_test_1');
  });

  it('rejects a bad signature with 400', async () => {
    const { deps, access } = makeDeps(makeEvent(), {
      constructEvent: () => {
        throw new Error('No signatures found matching the expected signature');
      },
    });
    const res = await callHandler(deps);
    assert.equal(res.status, 400);
    assert.equal(access.size, 0);
  });

  it('returns 500 when the webhook secret is not configured', async () => {
    const { deps } = makeDeps(makeEvent(), {
      getWebhookSecret: () => undefined,
    });
    const res = await callHandler(deps);
    assert.equal(res.status, 500);
  });

  it('ignores unpaid sessions and other event types', async () => {
    const unpaid = makeDeps(makeEvent({ payment_status: 'unpaid' }));
    assert.equal((await callHandler(unpaid.deps)).status, 200);
    assert.equal(unpaid.access.size, 0);

    const other = makeDeps({
      id: 'evt_2',
      type: 'payment_intent.created',
      data: { object: {} },
    } as unknown as Stripe.Event);
    assert.equal((await callHandler(other.deps)).status, 200);
    assert.equal(other.access.size, 0);
  });

  it('does not mark the event processed when granting access fails, so Stripe retries', async () => {
    const { deps, processed } = makeDeps(makeEvent(), {
      grantRoomAccess: async () => {
        throw new Error('db down');
      },
    });
    const res = await callHandler(deps);
    assert.equal(res.status, 500);
    assert.equal(processed.has('evt_test_1'), false);
  });

  it('unlocks the room on retry after recording the event failed', async () => {
    const { deps, access } = makeDeps(makeEvent());
    let failOnce = true;
    const flaky: StripeWebhookDeps = {
      ...deps,
      markEventProcessed: async (id, type) => {
        if (failOnce) {
          failOnce = false;
          throw new Error('db blip');
        }
        return deps.markEventProcessed(id, type);
      },
    };
    const first = await callHandler(flaky);
    assert.equal(first.status, 500);
    const retry = await callHandler(flaky);
    assert.equal(retry.status, 200);
    assert.notDeepEqual(retry.body, { received: true, duplicate: true });
    assert.equal(access.size, 1);
  });

  it('clears the pending checkout after unlocking, and still succeeds if that fails', async () => {
    const ok = makeDeps(makeEvent());
    assert.equal((await callHandler(ok.deps)).status, 200);
    assert.deepEqual(ok.clearedSessions, ['cs_test_1']);

    const failing = makeDeps(makeEvent(), {
      clearPendingCheckout: async () => {
        throw new Error('db blip');
      },
    });
    assert.equal((await callHandler(failing.deps)).status, 200);
    assert.equal(failing.access.size, 1);
  });

  it('frees the checkout slot when a delayed payment fails, so the user can try again', async () => {
    const event = makeEvent({ payment_status: 'unpaid' });
    (event as { type: string }).type = 'checkout.session.async_payment_failed';
    const { deps, access, clearedSessions } = makeDeps(event);
    const res = await callHandler(deps);
    assert.equal(res.status, 200);
    assert.deepEqual(clearedSessions, ['cs_test_1']);
    assert.equal(access.size, 0);
  });
});
