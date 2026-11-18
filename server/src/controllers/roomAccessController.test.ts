import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type Stripe from 'stripe';
import {
  startOrReuseCheckout,
  type CheckoutDeps,
} from './roomAccessController.js';
import type { PendingCheckoutRecord } from '../models/mongoPendingCheckout.js';

const ARGS = {
  userId: 'user_1',
  roomName: 'Mewtwo',
  priceId: 'price_test',
  clientUrl: 'http://localhost:5173',
};

// In-memory stand-ins for MongoDB (with the unique { userId, roomName } slot) and Stripe.
function makeDeps(overrides: Partial<CheckoutDeps> = {}) {
  const pending = new Map<string, PendingCheckoutRecord>();
  const access = new Map<string, string>();
  const sessions = new Map<string, Stripe.Checkout.Session>();
  const createCalls: string[] = []; // idempotency keys
  let nextId = 0;
  const key = (u: string, r: string) => `${u}:${r}`;
  const tick = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const deps: CheckoutDeps = {
    hasRoomAccess: async (u, r) => access.has(key(u, r)),
    grantRoomAccess: async (u, r, sessionId) => {
      if (!access.has(key(u, r))) access.set(key(u, r), sessionId);
    },
    findPendingCheckout: async (u, r) => {
      const rec = pending.get(key(u, r));
      return rec ? { ...rec } : null;
    },
    claimPendingCheckout: async (u, r, claimId, expiresAt) => {
      if (pending.has(key(u, r))) return false; // E11000
      pending.set(key(u, r), { claimId, status: 'creating', expiresAt });
      return true;
    },
    savePendingCheckoutSession: async (u, r, claimId, s) => {
      const rec = pending.get(key(u, r));
      if (rec?.claimId === claimId)
        Object.assign(rec, { status: 'open', ...s });
    },
    deletePendingCheckout: async (u, r, claimId) => {
      if (pending.get(key(u, r))?.claimId === claimId)
        pending.delete(key(u, r));
    },
    createStripeSession: async (params, idempotencyKey) => {
      createCalls.push(idempotencyKey);
      await tick(5); // Stripe is slow enough for a second request to sneak in
      const id = `cs_test_${++nextId}`;
      const session = {
        id,
        status: 'open',
        payment_status: 'unpaid',
        url: `https://checkout.stripe.com/c/${id}`,
        expires_at: params.expires_at,
      } as Stripe.Checkout.Session;
      sessions.set(id, session);
      return session;
    },
    retrieveStripeSession: async (id) => sessions.get(id)!,
    newClaimId: () => `claim_${Math.random()}`,
    now: () => Date.now(),
    sleep: tick,
    ...overrides,
  };
  return { deps, pending, access, sessions, createCalls };
}

describe('startOrReuseCheckout', () => {
  it('creates one session with a 30+ minute expiry and an idempotency key', async () => {
    const { deps, createCalls, pending } = makeDeps();
    let params: Stripe.Checkout.SessionCreateParams | undefined;
    const create = deps.createStripeSession;
    deps.createStripeSession = async (p, k) => {
      params = p;
      return create(p, k);
    };

    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { url: 'https://checkout.stripe.com/c/cs_test_1' });
    assert.equal(createCalls.length, 1);
    assert.match(createCalls[0], /^checkout:user_1:Mewtwo:claim_/);
    assert.ok(params!.expires_at! * 1000 - Date.now() >= 30 * 60 * 1000);
    assert.equal(pending.get('user_1:Mewtwo')?.stripeSessionId, 'cs_test_1');
  });

  it('reuses the open session on a second click instead of creating another', async () => {
    const { deps, createCalls } = makeDeps();
    const first = await startOrReuseCheckout(deps, ARGS);
    const second = await startOrReuseCheckout(deps, ARGS);
    assert.deepEqual(second, first);
    assert.equal(createCalls.length, 1);
  });

  it('gives two concurrent requests the same session (only one is created)', async () => {
    const { deps, createCalls } = makeDeps();
    const [a, b] = await Promise.all([
      startOrReuseCheckout(deps, ARGS),
      startOrReuseCheckout(deps, ARGS),
    ]);
    assert.deepEqual(a, b);
    assert.equal(createCalls.length, 1);
  });

  it('unlocks instead of selling again when the outstanding session is already paid', async () => {
    const { deps, sessions, access, pending, createCalls } = makeDeps();
    await startOrReuseCheckout(deps, ARGS);
    // The user paid, but the webhook hasn't arrived yet.
    Object.assign(sessions.get('cs_test_1')!, {
      status: 'complete',
      payment_status: 'paid',
    });

    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { hasAccess: true });
    assert.equal(access.get('user_1:Mewtwo'), 'cs_test_1');
    assert.equal(pending.size, 0);
    assert.equal(createCalls.length, 1);
  });

  it('replaces an expired session with a new one', async () => {
    const { deps, sessions, createCalls } = makeDeps();
    await startOrReuseCheckout(deps, ARGS);
    Object.assign(sessions.get('cs_test_1')!, { status: 'expired', url: null });

    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { url: 'https://checkout.stripe.com/c/cs_test_2' });
    assert.equal(createCalls.length, 2);
  });

  it('frees the slot when Stripe fails, so the next click can retry', async () => {
    const { deps, pending } = makeDeps({
      createStripeSession: async () => {
        throw new Error('stripe down');
      },
    });
    await assert.rejects(startOrReuseCheckout(deps, ARGS), /stripe down/);
    assert.equal(pending.size, 0);
  });
});
