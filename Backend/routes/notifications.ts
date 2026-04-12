import express from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);

export default router;
