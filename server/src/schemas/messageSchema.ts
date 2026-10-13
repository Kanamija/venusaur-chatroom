import { z } from 'zod';
import { ROOM_NAMES } from '../constants/rooms.js';

export const roomNameSchema = z.enum(ROOM_NAMES);

export const sendMessageSchema = z.object({
  roomId: roomNameSchema,
  text: z.string().trim().min(1).max(1000),
});
