import type { ErrorRequestHandler } from 'express';
import AppError from './AppError.js';

// Global Express error handler
export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message =
    isAppError && statusCode < 500 ? err.message : 'Internal Server Error';

  // Log error information on the server
  console.error('Message:', err instanceof Error ? err.message : err);

  if (isAppError && err.log) {
    console.error('Log:', err.log);
  }

  if (isAppError && err.cause) {
    console.error('Cause:', err.cause);
  }

  // Send error response to client
  res.status(statusCode).json({
    success: false,
    message,
  });
};
