import mongoose, { Schema, Document } from 'mongoose';

export interface IGodownRack extends Document {
  godownId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  zone: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  shelvesCount: number;
  shelfGap: number;
  maxWeightPerShelf: number;
  color: string;
  status: 'Active' | 'Inactive';
}

const GodownRackSchema: Schema = new Schema({
  godownId: { type: Schema.Types.ObjectId, ref: 'Godown', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  zone: { type: String, required: true },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  dimensions: {
    width: { type: Number, default: 1.2 },
    height: { type: Number, default: 2.0 },
    depth: { type: Number, default: 0.6 }
  },
  shelvesCount: { type: Number, default: 4 },
  shelfGap: { type: Number, default: 40 },
  maxWeightPerShelf: { type: Number, default: 50 },
  color: { type: String, default: '#EA580C' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model<IGodownRack>('GodownRack', GodownRackSchema);
