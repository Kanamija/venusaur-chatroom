import type { RequestHandler } from 'express';
import { roomNameSchema } from '../schemas/messageSchema.js';
import { getPremiumRoomPriceId, isPremiumRoom } from '../constants/rooms.js';
import { hasRoomAccess } from '../models/mongoRoomAccess.js';
import { findSession } from '../models/sessionModel.js';
import { getStripe } from '../stripe/stripeClient.js';
import AppError from '../errors/AppError.js';

// userCanAccessRoom() — Free rooms are open to everyone; premium rooms need a RoomAccess row.
export async function userCanAccessRoom(
  userId: string | undefined,
  roomName: string,
): Promise<boolean> {
  if (!isPremiumRoom(roomName)) return true;
  if (!userId) return false;
  return hasRoomAccess(userId, roomName);
}

// requirePremiumRoomAccess() — Free rooms pass straight through (unchanged behavior).
// Premium rooms require a valid session cookie and a paid unlock.
export const requirePremiumRoomAccess: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const roomName = req.params.id;
  if (!isPremiumRoom(roomName)) return next();

  const sessionId = req.cookies?.sessionId;
  const userId =
    typeof sessionId === 'string' ? await findSession(sessionId) : null;
  if (!userId) {
    throw new AppError('Unauthorized', 401, {
      log: 'roomAccessController.requirePremiumRoomAccess: No valid session',
    });
  }

  if (!(await hasRoomAccess(userId, roomName))) {
    throw new AppError(
      'This room is premium. Unlock it to read messages.',
      403,
    );
  }

  res.locals.userId = userId;
  return next();
};

// getRoomAccess() — { hasAccess, isPremium } for the logged-in user (runs after verifySession).
export const getRoomAccess: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const result = roomNameSchema.safeParse(req.params.id);
  if (!result.success) return next(new AppError('Room not found', 404));

  const roomName = result.data;
  res.locals.roomAccess = {
    isPremium: isPremiumRoom(roomName),
    hasAccess: await userCanAccessRoom(res.locals.userId, roomName),
  };
  return next();
};

// createCheckoutSession() — Start a Stripe-hosted Checkout for a premium room (runs after verifySession).
export const createCheckoutSession: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const result = roomNameSchema.safeParse(req.params.id);
  if (!result.success) return next(new AppError('Room not found', 404));

  const roomName = result.data;
  if (!isPremiumRoom(roomName)) {
    return next(new AppError('This room is free', 400));
  }

  const userId: string = res.locals.userId;
  if (await hasRoomAccess(userId, roomName)) {
    return next(new AppError('You already have access to this room', 409));
  }

  const priceId = getPremiumRoomPriceId(roomName);
  if (!priceId) {
    return next(
      new AppError('Internal Server Error', 500, {
        log: `roomAccessController.createCheckoutSession: No Stripe price configured for ${roomName}`,
      }),
    );
  }

  // In production the built client is served by this server, so fall back to our own origin.
  const clientUrl = (
    process.env.CLIENT_URL?.trim() || `${req.protocol}://${req.get('host')}`
  ).replace(/\/+$/, '');
  const room = encodeURIComponent(roomName);

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: userId,
    metadata: { userId, roomName },
    success_url: `${clientUrl}/?checkout=success&room=${room}`,
    cancel_url: `${clientUrl}/?checkout=cancelled&room=${room}`,
  });

  if (!session.url) {
    return next(
      new AppError('Internal Server Error', 500, {
        log: 'roomAccessController.createCheckoutSession: Stripe returned no URL',
      }),
    );
  }

  res.locals.checkoutUrl = session.url;
  return next();
};
