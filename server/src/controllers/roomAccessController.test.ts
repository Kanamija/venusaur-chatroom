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
const SLOT = 'user_1:Mewtwo';

// In-memory stand-ins for MongoDB (with the unique { userId, roomName } slot)
// and Stripe (which returns the same session for the same idempotency key).
function makeDeps(overrides: Partial<CheckoutDeps> = {}) {
  const pending = new Map<string, PendingCheckoutRecord>();
  const access = new Map<string, string>();
  const sessions = new Map<string, Stripe.Checkout.Session>();
  const byKey = new Map<string, Promise<Stripe.Checkout.Session>>();
  const createCalls: string[] = []; // idempotency keys
  let stripeDelayMs = 5; // Slow enough for a second request to sneak in
  let nextId = 0;
  const slot = (u: string, r: string) => `${u}:${r}`;
  const tick = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const deps: CheckoutDeps = {
    grantRoomAccess: async (u, r, sessionId) => {
      if (!access.has(slot(u, r))) access.set(slot(u, r), sessionId);
    },
    findPendingCheckout: async (u, r) => {
      const rec = pending.get(slot(u, r));
      return rec ? { ...rec } : null;
    },
    claimPendingCheckout: async (u, r, idempotencyKey, expiresAt) => {
      if (pending.has(slot(u, r))) return false; // E11000
      pending.set(slot(u, r), { idempotencyKey, expiresAt });
      return true;
    },
    savePendingCheckoutSession: async (u, r, key, s) => {
      const rec = pending.get(slot(u, r));
      if (rec?.idempotencyKey === key) Object.assign(rec, s);
    },
    deletePendingCheckout: async (u, r, key) => {
      if (pending.get(slot(u, r))?.idempotencyKey === key)
        pending.delete(slot(u, r));
    },
    createStripeSession: (params, key) => {
      createCalls.push(key);
      if (!byKey.has(key)) {
        byKey.set(
          key,
          tick(stripeDelayMs).then(() => {
            const id = `cs_test_${++nextId}`;
            const session = {
              id,
              status: 'open',
              payment_status: 'unpaid',
              url: `https://checkout.stripe.com/c/${id}`,
              expires_at: params.expires_at,
              metadata: params.metadata,
              allowed_payment_method_types: params.allowed_payment_method_types,
            } as unknown as Stripe.Checkout.Session;
            sessions.set(id, session);
            return session;
          }),
        );
      }
      return byKey.get(key)!;
    },
    retrieveStripeSession: async (id) => sessions.get(id)!,
    newIdempotencyKey: () => `checkout:${Math.random()}`,
    now: () => Date.now(),
    sleep: tick,
    ...overrides,
  };
  const setStripeDelay = (ms: number) => {
    stripeDelayMs = ms;
  };
  return { deps, pending, access, sessions, createCalls, setStripeDelay };
}

describe('startOrReuseCheckout', () => {
  it('creates one card-only session with a 30+ minute expiry and stores its key', async () => {
    const { deps, pending, sessions } = makeDeps();

    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { url: 'https://checkout.stripe.com/c/cs_test_1' });
    const session = sessions.get('cs_test_1')!;
    assert.deepEqual(session.allowed_payment_method_types, ['card']);
    assert.ok(session.expires_at * 1000 - Date.now() >= 30 * 60 * 1000);
    assert.equal(pending.get(SLOT)?.stripeSessionId, 'cs_test_1');
  });

  it('reuses the open session on a second click instead of creating another', async () => {
    const { deps, sessions } = makeDeps();
    const first = await startOrReuseCheckout(deps, ARGS);
    const second = await startOrReuseCheckout(deps, ARGS);
    assert.deepEqual(second, first);
    assert.equal(sessions.size, 1);
  });

  it('gives a second request the same session while a slow first request is still waiting on Stripe', async () => {
    const { deps, sessions, createCalls, setStripeDelay } = makeDeps();
    setStripeDelay(50);
    const first = startOrReuseCheckout(deps, ARGS);
    await new Promise((r) => setTimeout(r, 10)); // First request is mid-call
    const second = startOrReuseCheckout(deps, ARGS);

    const [a, b] = await Promise.all([first, second]);

    assert.deepEqual(a, b);
    assert.equal(sessions.size, 1);
    assert.equal(new Set(createCalls).size, 1); // Both used the same key
  });

  it('waits and retries when Stripe says the key is in use by another request (409)', async () => {
    const { deps, sessions } = makeDeps();
    const create = deps.createStripeSession;
    let calls = 0;
    deps.createStripeSession = async (p, k) => {
      if (++calls === 1)
        throw Object.assign(new Error('in use'), { statusCode: 409 });
      return create(p, k);
    };

    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { url: 'https://checkout.stripe.com/c/cs_test_1' });
    assert.equal(sessions.size, 1);
  });

  it('keeps the slot when saving fails, and the retry reuses the same key and session', async () => {
    const { deps, pending, sessions, createCalls } = makeDeps();
    const save = deps.savePendingCheckoutSession;
    deps.savePendingCheckoutSession = async () => {
      throw new Error('db down');
    };
    await assert.rejects(startOrReuseCheckout(deps, ARGS), /db down/);
    assert.ok(pending.has(SLOT)); // Not deleted: Stripe did create a session

    deps.savePendingCheckoutSession = save;
    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { url: 'https://checkout.stripe.com/c/cs_test_1' });
    assert.equal(createCalls[0], createCalls[1]);
    assert.equal(sessions.size, 1);
  });

  it('unlocks instead of selling again when the outstanding session is already paid', async () => {
    const { deps, sessions, access, pending } = makeDeps();
    await startOrReuseCheckout(deps, ARGS);
    // The user paid, but the webhook hasn't arrived yet.
    Object.assign(sessions.get('cs_test_1')!, {
      status: 'complete',
      payment_status: 'paid',
    });

    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { hasAccess: true });
    assert.equal(access.get(SLOT), 'cs_test_1');
    assert.equal(pending.size, 0);
    assert.equal(sessions.size, 1);
  });

  it('replaces an expired session with a new one under a new key', async () => {
    const { deps, sessions, createCalls } = makeDeps();
    await startOrReuseCheckout(deps, ARGS);
    Object.assign(sessions.get('cs_test_1')!, { status: 'expired', url: null });

    const out = await startOrReuseCheckout(deps, ARGS);

    assert.deepEqual(out, { url: 'https://checkout.stripe.com/c/cs_test_2' });
    assert.notEqual(createCalls[0], createCalls[1]);
  });

  it('refuses to return a session that belongs to another user', async () => {
    const { deps } = makeDeps();
    const create = deps.createStripeSession;
    deps.createStripeSession = async (p, k) => ({
      ...(await create(p, k)),
      metadata: { userId: 'someone_else', roomName: 'Mewtwo' },
    });
    await assert.rejects(
      startOrReuseCheckout(deps, ARGS),
      /Internal Server Error/,
    );
  });
});
