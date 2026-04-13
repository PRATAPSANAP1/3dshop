import mongoose, { Schema, Document } from 'mongoose';

export interface IGodownStock extends Document {
  productId: mongoose.Types.ObjectId;
  godownId: mongoose.Types.ObjectId;
  rackId: mongoose.Types.ObjectId;
  shelfLevel: number;
  slotNumber?: string;
  quantity: number;
  unit: string;
  costPrice: number;
  batchNumber?: string;
  manufactureDate?: Date;
  expiryDate: Date;
  minStockLevel: number;
  reorderQuantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const GodownStockSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  godownId: { type: Schema.Types.ObjectId, ref: 'Godown', required: true },
  rackId: { type: Schema.Types.ObjectId, ref: 'GodownRack', required: true },
  shelfLevel: { type: Number, required: true },
  slotNumber: { type: String },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true, default: 'Piece' },
  costPrice: { type: Number, required: true },
  batchNumber: { type: String },
  manufactureDate: { type: Date },
  expiryDate: { type: Date, required: true },
  minStockLevel: { type: Number, default: 10 },
  reorderQuantity: { type: Number, default: 50 },
  status: { 
    type: String, 
    enum: ['In Stock', 'Low Stock', 'Out of Stock'], 
    default: 'In Stock' 
  }
}, { timestamps: true });

export default mongoose.model<IGodownStock>('GodownStock', GodownStockSchema);
