import express from 'express';
import { protect, admin } from '../middleware/auth';
import { getAuditLogs, getAuditStats } from '../controllers/auditLogController';

const router = express.Router();

router.get('/', protect, admin, getAuditLogs);
router.get('/stats', protect, admin, getAuditStats);

export default router;
