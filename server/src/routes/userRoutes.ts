import { Router } from 'express';
import {
  registerUser,
  authenticateUser,
} from '../controllers/userController.js';

const router = Router();

router.post('/signup', registerUser, (_req, res) => {
  res.status(201).json({
    success: true,
    user: res.locals.user,
  });
});

router.post('/login', authenticateUser, (_req, res) => {
  res.status(200).json({
    success: true,
    user: res.locals.user,
  });
});

export default router;
