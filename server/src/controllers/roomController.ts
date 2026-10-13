import type { RequestHandler } from 'express';
import { getRecentMessages } from '../models/mongoMessage.js';
import { roomNameSchema } from '../schemas/messageSchema.js';
import AppError from '../errors/AppError.js';

const getRoomMessages: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const result = roomNameSchema.safeParse(req.params.id);
  if (!result.success) {
    return next(new AppError('Room not found', 404));
  }
  const messages = await getRecentMessages(result.data);
  res.locals.messages = messages;
  return next();
};

export { getRoomMessages };
