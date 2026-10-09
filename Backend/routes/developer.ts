import express from 'express';
import { protect, developer } from '../middleware/auth';
import {
  getSystemStats,
  getAllShopsDev,
  getAllUsersDev,
  updateUserRoleDev,
  assignUserToShop,
  toggleShopStatus,
  deleteShopDev,
  blockUserDev
} from '../controllers/developerController';

const router = express.Router();

router.get('/stats', protect, developer, getSystemStats);
router.get('/shops', protect, developer, getAllShopsDev);
router.get('/users', protect, developer, getAllUsersDev);
router.put('/users/:id/role', protect, developer, updateUserRoleDev);
router.put('/users/:id/shop', protect, developer, assignUserToShop);
router.put('/users/:id/block', protect, developer, blockUserDev);
router.put('/shops/:id/toggle', protect, developer, toggleShopStatus);
router.delete('/shops/:id', protect, developer, deleteShopDev);

export default router;
