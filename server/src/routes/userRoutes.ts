import { Router } from 'express';
import {
  registerUser,
  authenticateUser,
  getCurrentUser,
} from '../controllers/userController.js';
import {
  startSession,
  verifySession,
  endSession,
} from '../controllers/sessionController.js';

const router = Router();

router.post('/signup', registerUser, (_req, res) => {
  res.status(201).json({
    success: true,
    user: res.locals.user,
  });
});

router.post('/login', authenticateUser, startSession, (_req, res) => {
  res.status(200).json({
    success: true,
    user: res.locals.user,
  });
});

router.get('/me', verifySession, getCurrentUser, (_req, res) => {
  res.status(200).json({
    success: true,
    user: res.locals.user,
  });
});

router.post('/logout', endSession, (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
