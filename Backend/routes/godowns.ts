import express from 'express';
import { getGodowns, createGodown, getGodownOverview } from '../controllers/godownController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/overview', getGodownOverview);
router.get('/', getGodowns);
router.post('/', createGodown);

export default router;
