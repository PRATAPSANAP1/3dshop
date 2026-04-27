import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createAuditLog } from '../middleware/audit';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let razorpay: any = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('WARNING: Razorpay API keys are missing in environment variables.');
}

export const addOrderItems = async (req: Request, res: Response) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice, shopId } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      res.status(400).json({ message: 'No order items' });
      return;
    }

    if (!shippingAddress) {
      res.status(400).json({ message: 'Shipping address is required' });
      return;
    }

    // Prevent duplicate orders within 5 seconds
    const existingOrder = await Order.findOne({
      user: (req.user as any)._id,
      totalPrice: totalPrice,
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (existingOrder) {
      res.status(200).json(existingOrder);
      return;
    }

    if (totalPrice === undefined || totalPrice === null || isNaN(totalPrice)) {
      res.status(400).json({ message: 'Total price is invalid or missing' });
      return;
    }

    // Ensure shopId is present
    let finalShopId = shopId || orderItems[0]?.shopId;

    // Fallback: If shopId is missing, try to find it from the first product
    if (!finalShopId && orderItems[0]?.product) {
      const prod = await Product.findById(orderItems[0].product);
      if (prod) finalShopId = prod.shopId;
    }

    if (!finalShopId) {
      res.status(400).json({ message: 'Missing Shop Identity. Your cart may be from an older version. Please clear cart and try again.' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(finalShopId)) {
      res.status(400).json({ message: 'Invalid Shop ID format: ' + finalShopId });
      return;
    }

    // Normalize shipping address (map legacy pinCode to postalCode)
    const normalizedAddress = {
      ...shippingAddress,
      postalCode: shippingAddress?.postalCode || shippingAddress?.pinCode || shippingAddress?.zipCode || shippingAddress?.zip
    };

    if (!normalizedAddress.postalCode) {
      res.status(400).json({ message: 'Postal Code (PIN Code) is required in your shipping address.' });
      return;
    }

    if (!normalizedAddress.street) {
      res.status(400).json({ message: 'Street address is required.' });
      return;
    }

    if (!normalizedAddress.city) {
      res.status(400).json({ message: 'City is required in your shipping address.' });
      return;
    }

    const order = new Order({
      user: (req.user as any)._id,
      shopId: finalShopId,
      orderItems: orderItems.map((item: any) => ({
        ...item,
        shopId: item.shopId || finalShopId
      })),
      shippingAddress: normalizedAddress,
      paymentMethod,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      totalPrice,
      statusHistory: [{ status: 'Ordered' }]
    });

    const createdOrder = await order.save();

    const io = req.app.get('io');
    if (io) io.emit('new_order', createdOrder);

    await createAuditLog(req.user, 'ORDER_CREATE', 'Order', 'Order created by ' + ((req.user as any)?.name || (req.user as any)?.email), {
      entityId: createdOrder._id.toString(),
      entityName: 'Order ' + createdOrder._id,
      changes: { items: createdOrder.orderItems.length, total: createdOrder.totalPrice }
    });

    res.status(201).json(createdOrder);
  } catch (error: any) {
    console.error('Order Creation Error:', error);
    res.status(500).json({ 
      message: 'Failed to create order', 
      error: error.message // Return message for easier debugging
    });
  }
};

export const createPaymentOrder = async (req: Request, res: Response) => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: 'Payment gateway not configured. Contact admin.' });
  }

  const { amount, currency = 'INR', receipt } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({ message: 'Invalid payment amount, must be at least 100 paise' });
  }

  try {
    const options = {
      amount: amount,
      currency,
      receipt,
      notes: {
        userId: (req.user as any)._id.toString(),
        platform: 'SmartStore'
      }
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({ 
      message: 'Payment gateway error. Please try again later.',
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ status: 'failure', message: 'Missing payment verification fields' });
    }

    // SECURITY: Never use a fallback secret — reject if secret is missing
    if (!RAZORPAY_KEY_SECRET) {
      console.error('CRITICAL: RAZORPAY_KEY_SECRET is missing during payment verification!');
      return res.status(503).json({ status: 'failure', message: 'Payment verification unavailable' });
    }

    // Generate HMAC signature for verification
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(generated_signature, 'hex');
    const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

    if (signatureBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, receivedBuffer)) {
      console.warn(`Payment signature mismatch for order ${orderId}. Possible tampering attempt.`);
      return res.status(400).json({ status: 'failure', message: 'Payment signature verification failed' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Prevent double-payment
    if (order.isPaid) {
      return res.json({ status: 'success', message: 'Payment already confirmed' });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: razorpay_payment_id,
      status: 'Paid',
      update_time: new Date().toISOString(),
      receipt_url: razorpay_order_id,
    };
    await order.save();

    // Notify via Socket
    const io = req.app.get('io');
    if (io) io.to('admin_orders').emit('order_status_updated', order);

    await createAuditLog(req.user, 'PAYMENT_VERIFIED', 'Order', `Payment verified for order ${orderId}`, {
      entityId: orderId,
      entityName: 'Order ' + orderId,
      changes: { razorpay_payment_id, razorpay_order_id, amount: order.totalPrice }
    });

    res.json({ status: 'success' });
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ status: 'failure', message: 'Internal verification error' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  const orders = await Order.find({ user: (req.user as any)._id }).populate('delivery.assignedTo', 'id name mobile email').sort({ createdAt: -1 });
  res.json(orders);
};

export const getOrderById = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').populate('delivery.assignedTo', 'id name mobile email');
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { status, comment } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    order.orderStatus = status;
    order.statusHistory.push({ status, comment, timestamp: new Date() });

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    const io = req.app.get('io');
    if (io) io.to(order._id.toString()).emit('order_status_updated', updatedOrder);

    await createAuditLog(req.user, 'ORDER_STATUS_UPDATE', 'Order', 'Order status updated to ' + status, {
      entityId: order._id.toString(),
      entityName: 'Order ' + order._id,
      changes: { status }
    });

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    // Permission check: only owner can cancel
    if (order.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Constraint check: cannot cancel if delivery is assigned
    if (order.delivery && (order as any).delivery.assignedTo) {
      return res.status(400).json({ message: 'Cannot cancel order once delivery is assigned' });
    }

    // Constraint check: cannot cancel if already delivered or shipped
    if (['Shipped', 'OutForDelivery', 'Delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Order is already in transit or delivered' });
    }

    order.orderStatus = 'Cancelled';
    order.statusHistory.push({ status: 'Cancelled', comment: 'Cancelled by user', timestamp: new Date() });

    const updatedOrder = await order.save();

    await createAuditLog(req.user, 'ORDER_CANCEL', 'Order', 'Order cancelled by user', {
      entityId: order._id.toString(),
      entityName: 'Order ' + order._id,
      changes: { status: 'Cancelled' }
    });

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    // Permission check: only owner can delete
    if (order.user.toString() !== (req.user as any)._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this order' });
    }

    // Constraint check: only cancelled orders can be deleted
    if (order.orderStatus !== 'Cancelled') {
      return res.status(400).json({ message: 'Only cancelled orders can be removed from history' });
    }

    await Order.findByIdAndDelete(req.params.id);

    await createAuditLog(req.user, 'ORDER_DELETE', 'Order', 'Order removed from history by user', {
      entityId: order._id.toString(),
      entityName: 'Order ' + order._id
    });

    res.json({ message: 'Order removed successfully' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const requestReturnOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (order) {
    if (order.orderStatus !== 'Delivered') return res.status(400).json({ message: 'Only delivered orders can be returned' });

    order.isReturnRequested = true;
    order.returnReason = reason;
    order.returnStatus = 'Requested';
    order.statusHistory.push({ status: 'ReturnRequested', comment: reason, timestamp: new Date() });

    const updatedOrder = await order.save();

    await createAuditLog(req.user, 'RETURN_REQUEST', 'Order', 'Return requested for order', {
      entityId: order._id.toString(),
      entityName: 'Order ' + order._id,
      changes: { reason }
    });

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const handleReturnOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, comment } = req.body;

  const order = await Order.findById(id);
  if (order) {
    order.returnStatus = status;
    order.statusHistory.push({ status: 'Return' + status, comment, timestamp: new Date() });

    if (status === 'Refunded') {
      order.orderStatus = 'Returned';
    }

    const updatedOrder = await order.save();

    const io = req.app.get('io');
    if (io) io.to(order._id.toString()).emit('order_status_updated', updatedOrder);

    await createAuditLog(req.user, 'RETURN_HANDLE', 'Order', 'Return status updated to ' + status, {
      entityId: order._id.toString(),
      entityName: 'Order ' + order._id,
      changes: { returnStatus: status, comment }
    });

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  const query = (req.user as any).role === 'superadmin' ? {} : { shopId: (req as any).shopId };
  const orders = await Order.find(query).populate('user', 'id name email').populate('delivery.assignedTo', 'id name mobile email').sort({ createdAt: -1 });
  res.json(orders);
};

export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const query = (req.user as any).role === 'superadmin' ? {} : { shopId: (req as any).shopId };
    const orders = await Order.find(query);

    const totalOrders = orders.length;
    const paidOnline = orders.filter((o: any) => o.isPaid && o.paymentMethod !== 'COD');
    const paidCOD = orders.filter((o: any) => o.paymentMethod === 'COD' && (o.isDelivered || o.orderStatus === 'Delivered'));
    const unpaid = orders.filter((o: any) => !o.isPaid && o.paymentMethod !== 'COD');
    const pendingCOD = orders.filter((o: any) => o.paymentMethod === 'COD' && !o.isDelivered && o.orderStatus !== 'Delivered');

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
    const collectedOnline = paidOnline.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
    const collectedCOD = paidCOD.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
    const pendingAmount = unpaid.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0) + pendingCOD.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

    // Recent payments (last 20)
    const recentPayments = orders
      .filter((o: any) => o.isPaid || (o.paymentMethod === 'COD' && o.isDelivered))
      .sort((a: any, b: any) => (b.paidAt || b.deliveredAt || b.createdAt).getTime() - (a.paidAt || a.deliveredAt || a.createdAt).getTime())
      .slice(0, 20)
      .map((o: any) => ({
        orderId: o._id,
        amount: o.totalPrice,
        method: o.paymentMethod,
        status: o.isPaid ? 'Paid' : 'COD Collected',
        date: o.paidAt || o.deliveredAt || o.createdAt,
        razorpayId: o.paymentResult?.id || null,
        razorpayOrderId: o.paymentResult?.receipt_url || null,
        customerName: null, // populated below
      }));

    // Populate customer names
    const populatedOrders = await Order.find({ _id: { $in: recentPayments.map((p: any) => p.orderId) } }).populate('user', 'name email');
    recentPayments.forEach((p: any) => {
      const o = populatedOrders.find((po: any) => po._id.toString() === p.orderId.toString());
      if (o && o.user) {
        p.customerName = (o.user as any).name || (o.user as any).email;
      }
    });

    res.json({
      summary: {
        totalOrders,
        totalRevenue,
        collectedOnline,
        collectedCOD,
        pendingAmount,
        paidOnlineCount: paidOnline.length,
        paidCODCount: paidCOD.length,
        unpaidCount: unpaid.length + pendingCOD.length,
      },
      recentPayments,
    });
  } catch (error: any) {
    console.error('Payment Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const fetchPaymentDetails = async (req: Request, res: Response) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: 'Razorpay not configured' });
    }

    const { paymentId } = req.params;
    const payment: any = await razorpay.payments.fetch(paymentId as string);
    res.json({
      id: payment.id,
      amount: Number(payment.amount) / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: payment.created_at,
      captured: payment.captured,
    });
  } catch (error: any) {
    console.error('Razorpay fetch error:', error);
    res.status(500).json({ message: 'Could not fetch payment details from Razorpay' });
  }
};

export const updateOrderToDelivered = async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.orderStatus = 'Delivered';
    order.statusHistory.push({ status: 'Delivered', timestamp: new Date() });
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const updateDeliveryDetails = async (req: Request, res: Response) => {
  const { assignedTo, deliveryDate, timeSlot, notes, priority } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    (order as any).delivery = {
      assignedTo,
      assignedAt: new Date(),
      deliveryDate,
      timeSlot,
      status: 'Assigned',
      otp,
      otpVerified: false,
      notes,
      priority: priority || 'Normal'
    };

    order.statusHistory.push({ status: 'DeliveryAssigned', comment: 'Assigned slot: ' + (timeSlot || 'Any time'), timestamp: new Date() });

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('delivery.assignedTo', 'id name mobile email');
    const io = req.app.get('io');
    if (io) io.to(order._id.toString()).emit('order_status_updated', populatedOrder);
    res.json(populatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const verifyDeliveryOtp = async (req: Request, res: Response) => {
  const { otp } = req.body;
  const order = await Order.findById(req.params.id);

  if (order && (order as any).delivery) {
    if ((order as any).delivery.otp === otp) {
      (order as any).delivery.otpVerified = true;
      (order as any).delivery.status = 'Delivered';
      order.orderStatus = 'Delivered';
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.statusHistory.push({ status: 'Delivered', comment: 'OTP Verified & Delivered', timestamp: new Date() });
      const updatedOrder = await order.save();
      const populatedOrder = await Order.findById(updatedOrder._id).populate('delivery.assignedTo', 'id name mobile email');
      const io = req.app.get('io');
      if (io) io.to(order._id.toString()).emit('order_status_updated', populatedOrder);
      res.json(populatedOrder);
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export const updateDeliveryStatus = async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const order = await Order.findById(req.params.id);

  if (order && (order as any).delivery) {
    (order as any).delivery.status = status;
    if (notes) (order as any).delivery.notes = notes;

    const statusMap: Record<string, string> = {
      'OutForDelivery': 'OutForDelivery',
      'Failed': 'FailedDelivery',
      'Rescheduled': 'Rescheduled'
    };

    if (statusMap[status]) {
       order.orderStatus = statusMap[status] as any;
       order.statusHistory.push({ status: order.orderStatus, comment: notes || 'Delivery status: ' + status, timestamp: new Date() });
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('delivery.assignedTo', 'id name mobile email');
    const io = req.app.get('io');
    if (io) io.to(order._id.toString()).emit('order_status_updated', populatedOrder);
    res.json(populatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};
