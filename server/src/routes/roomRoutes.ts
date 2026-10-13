import { Router } from 'express';
import { getRoomMessages } from '../controllers/roomController.js';

const router = Router();

router.get('/:id/messages', getRoomMessages, (_req, res) => {
  res.status(200).json({
    success: true,
    messages: res.locals.messages,
  });
});

export default router;
