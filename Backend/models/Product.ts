import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 5 },
  expiryDate: { type: Date },
  rackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rack' },
  shelfNumber: { type: Number },
  columnNumber: { type: Number },
  brand: { type: String },
  size: { type: String },
  variants: [{
    size: { type: String },
    color: { type: String },
    stock: { type: Number },
    price: { type: Number }
  }],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  qrCode: { type: String, unique: true },
  totalRevenue: { type: Number, default: 0 },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;


