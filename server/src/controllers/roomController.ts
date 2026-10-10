import type { RequestHandler } from 'express';
import { getRecentMessages } from '../models/mongoMessage.js';

const getRoomMessages: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  const roomId = req.params.id;
  const messages = await getRecentMessages(roomId);
  res.locals.messages = messages;
  return next();
};

export { getRoomMessages };
