import { rateLimit } from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed login attempts. Please try again later.',
  },
});
