import { Router } from 'express';
import { getRoomMessages } from '../controllers/roomController.js';
import { verifySession } from '../controllers/sessionController.js';
import {
  createCheckoutSession,
  getRoomAccess,
  requirePremiumRoomAccess,
} from '../controllers/roomAccessController.js';

const router = Router();

// Free rooms stay public; premium rooms require a session and a paid unlock.
router.get(
  '/:id/messages',
  requirePremiumRoomAccess,
  getRoomMessages,
  (_req, res) => {
    res.status(200).json({
      success: true,
      messages: res.locals.messages,
    });
  },
);

router.get('/:id/access', verifySession, getRoomAccess, (_req, res) => {
  res.status(200).json({
    success: true,
    ...res.locals.roomAccess,
  });
});

router.post(
  '/:id/checkout',
  verifySession,
  createCheckoutSession,
  (_req, res) => {
    res.status(200).json({
      success: true,
      ...res.locals.checkout, // { url }, { hasAccess: true } or { paymentProcessing: true }
    });
  },
);

export default router;
