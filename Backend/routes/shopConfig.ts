import express from 'express';
import { getShopConfig, saveShopConfig, getPublicConfig, getShopsList } from '../controllers/shopConfigController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getShopConfig);
router.post('/', protect, saveShopConfig);
router.get('/public/shops/list', getShopsList);
router.get('/public/:shopName', getPublicConfig);

export default router;
