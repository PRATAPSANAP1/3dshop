import express from 'express';
import { getRacks, createRack, updateRack, deleteRack, getPublicRacks } from '../controllers/rackController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getRacks);
router.post('/', protect, createRack);
router.put('/:id', protect, updateRack);
router.delete('/:id', protect, deleteRack);
router.get('/public/:shopName', getPublicRacks);

export default router;
