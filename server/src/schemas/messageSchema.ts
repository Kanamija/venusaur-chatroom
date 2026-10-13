import { z } from 'zod';
import { ROOM_NAMES } from '../constants/rooms.js';

export const sendMessageSchema = z.object({
  roomId: z.enum(ROOM_NAMES),
  text: z.string().trim().min(1).max(1000),
});
