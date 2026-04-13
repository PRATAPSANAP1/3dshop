import mongoose, { Schema, Document } from 'mongoose';

export interface IStockTransfer extends Document {
  productId: mongoose.Types.ObjectId;
  fromType: 'Godown' | 'Store';
  toType: 'Godown' | 'Store';
  fromLocation: {
    godownId?: mongoose.Types.ObjectId;
    rackId?: mongoose.Types.ObjectId;
    shelfLevel?: number;
  };
  toLocation: {
    godownId?: mongoose.Types.ObjectId;
    rackId?: mongoose.Types.ObjectId;
    shelfLevel?: number;
  };
  quantity: number;
  transferDate: Date;
  transferredBy: mongoose.Types.ObjectId;
  status: 'Completed' | 'Pending' | 'Cancelled';
  referenceNumber?: string;
  notes?: string;
}

const StockTransferSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  fromType: { type: String, enum: ['Godown', 'Store'], required: true },
  toType: { type: String, enum: ['Godown', 'Store'], required: true },
  fromLocation: {
    godownId: { type: Schema.Types.ObjectId, ref: 'Godown' },
    rackId: { type: Schema.Types.ObjectId, ref: 'GodownRack' },
    shelfLevel: { type: Number }
  },
  toLocation: {
    godownId: { type: Schema.Types.ObjectId, ref: 'Godown' },
    rackId: { type: Schema.Types.ObjectId, ref: 'GodownRack' },
    shelfLevel: { type: Number }
  },
  quantity: { type: Number, required: true },
  transferDate: { type: Date, default: Date.now },
  transferredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Completed' },
  referenceNumber: { type: String },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
