import express from 'express';
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createPaymentOrder,
  verifyPayment,
  requestReturnOrder,
  handleReturnOrder,
  updateDeliveryDetails,
  verifyDeliveryOtp,
  updateDeliveryStatus,
  getPaymentStats,
  fetchPaymentDetails
} from '../controllers/orderController';
import { protect, admin } from '../middleware/auth';
import { paymentLimiter } from '../middleware/security';

const router = express.Router();

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getAllOrders);

router.route('/mine').get(protect, getMyOrders);
router.route('/pay').post(protect, paymentLimiter, createPaymentOrder);
router.route('/verify').post(protect, paymentLimiter, verifyPayment);

// Admin payment management
router.route('/payments/stats').get(protect, admin, getPaymentStats);
router.route('/payments/:paymentId').get(protect, admin, fetchPaymentDetails);

router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/delivery').put(protect, admin, updateDeliveryDetails);
router.route('/:id/delivery/verify-otp').post(protect, admin, verifyDeliveryOtp);
router.route('/:id/delivery/status').put(protect, admin, updateDeliveryStatus);
router.route('/:id/return').post(protect, requestReturnOrder);
router.route('/:id/return-handle').put(protect, admin, handleReturnOrder);

export default router;
