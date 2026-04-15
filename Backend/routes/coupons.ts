import express from 'express';
import { createCoupon, getCoupons, validateCoupon, toggleCouponStatus, deleteCoupon } from '../controllers/couponController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

router.route('/')
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

router.post('/validate', protect, validateCoupon);

router.route('/:id')
  .put(protect, admin, toggleCouponStatus)
  .delete(protect, admin, deleteCoupon);

export default router;
