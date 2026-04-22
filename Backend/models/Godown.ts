import mongoose, { Schema, Document } from 'mongoose';

export interface IGodown extends Document {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone?: string;
  managerName?: string;
  capacity?: number;
  shopId: mongoose.Types.ObjectId;
}

const GodownSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  phone: { type: String },
  managerName: { type: String },
  capacity: { type: Number },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true }
}, { timestamps: true });

export default mongoose.model<IGodown>('Godown', GodownSchema);
