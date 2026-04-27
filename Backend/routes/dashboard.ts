import express from 'express';
import { getStats } from '../controllers/dashboardController';
import { protect, staff } from '../middleware/auth';

const router = express.Router();

router.get('/stats', protect, staff, getStats);

export default router;
