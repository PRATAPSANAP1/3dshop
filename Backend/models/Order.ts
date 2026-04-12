import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    label: { type: String },
    street: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    state: { type: String },
    country: { type: String, default: 'India' },
    phone: { type: String },
  },
  paymentMethod: { type: String, required: true },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
    receipt_url: { type: String },
  },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },

  orderStatus: {
    type: String,
    required: true,
    enum: ['Ordered', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'FailedDelivery', 'Rescheduled', 'Cancelled', 'Returned'],
    default: 'Ordered'
  },
  statusHistory: [statusHistorySchema],

  isReturnRequested: { type: Boolean, default: false },
  returnReason: { type: String },
  returnStatus: {
    type: String,
    enum: ['None', 'Requested', 'Approved', 'Rejected', 'PickedUp', 'Refunded'],
    default: 'None'
  },
  refundId: { type: String },

  trackingNumber: { type: String },
  deliveryPartner: { type: String },
  estimatedDeliveryDate: { type: Date },

  delivery: {
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },
    deliveryDate: { type: Date },
    timeSlot: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled'],
      default: 'Pending'
    },
    otp: { type: String },
    otpVerified: { type: Boolean, default: false },
    notes: { type: String },
    priority: { type: String, enum: ['Normal', 'Urgent'], default: 'Normal' }
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
