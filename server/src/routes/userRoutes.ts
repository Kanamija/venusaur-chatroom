import { Router } from 'express';
import { signup } from '../controllers/userController.js';

const router = Router();

router.post('/signup', signup, (_req, res) => {
  res.status(201).json({
    success: true,
    user: res.locals.user,
  });
});

export default router;
