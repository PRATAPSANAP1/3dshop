import express from 'express';
import { getDoors, createDoor, deleteDoor, getPublicDoors } from '../controllers/doorController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getDoors);
router.post('/', protect, createDoor);
router.delete('/:id', protect, deleteDoor);
router.get('/public/:shopName', getPublicDoors);

export default router;
