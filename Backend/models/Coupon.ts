import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
