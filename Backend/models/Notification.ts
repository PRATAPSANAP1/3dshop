import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['lowStock', 'expiring', 'outOfStock'], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
