import { Router } from 'express';
import { verifySession } from '../controllers/sessionController.js';
import { deleteMessage } from '../controllers/messageController.js';

const router = Router();

router.delete('/:id', verifySession, deleteMessage, (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
        data: res.locals.deletedMessage,
    });
});

export default router;
