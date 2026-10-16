import type { RequestHandler } from 'express';
import { deleteMessageById } from '../models/mongoMessage.js';
import AppError from '../errors/AppError.js';

export const deleteMessage: RequestHandler<{ id: string }> = async (
    req,
    res,
    next,
    ) => {
    try {
        const messageId = req.params.id;
        const userId = res.locals.userId;

        if (!userId) {
        return next(new AppError('Unauthorized', 401));
        }

        const result = await deleteMessageById(messageId, userId);
        res.locals.deletedMessage = result;
        return next();
    } catch (err: any) {
        if (err.status === 404) {
        return next(new AppError('Message not found', 404));
        }
        if (err.status === 403) {
        return next(
            new AppError('Forbidden: You can only delete your own messages', 403),
        );
        }
        return next(err);
    }
};
