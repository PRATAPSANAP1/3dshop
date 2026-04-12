import mongoose from 'mongoose';

const shopConfigSchema = new mongoose.Schema({
  width: { type: Number, default: 20 },
  depth: { type: Number, default: 20 },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
}, {
  timestamps: true
});

const ShopConfig = mongoose.model('ShopConfig', shopConfigSchema, 'shops');
export default ShopConfig;
