import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // unique slug, used in URLs
  displayName: { type: String, required: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  logoUrl: { type: String },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  isActive: { type: Boolean, default: true },
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    gstRate: { type: Number, default: 18 },
    razorpayKeyId: { type: String },
    razorpayKeySecret: { type: String } // Note: encrypted at rest handling needed
  }
}, { timestamps: true });

export default mongoose.model('Shop', shopSchema);
