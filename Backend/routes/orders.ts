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
  fetchPaymentDetails,
  cancelOrder,
  deleteOrder
} from '../controllers/orderController';
import { protect, admin, staff } from '../middleware/auth';
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

router.route('/:id')
  .get(protect, getOrderById)
  .delete(protect, deleteOrder);

router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/delivery', protect, admin, updateDeliveryDetails);
router.route('/:id/delivery/verify-otp').post(protect, staff, verifyDeliveryOtp);
router.route('/:id/delivery/status').put(protect, staff, updateDeliveryStatus);
router.route('/:id/return').post(protect, requestReturnOrder);
router.route('/:id/return-handle').put(protect, admin, handleReturnOrder);

export default router;
