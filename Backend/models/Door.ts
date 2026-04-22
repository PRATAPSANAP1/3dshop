import mongoose from 'mongoose';

const doorSchema = new mongoose.Schema({
  doorType: { type: String, enum: ['entry', 'exit'], required: true },
  positionX: { type: Number, default: 0 },
  positionZ: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 },
  width: { type: Number, default: 1.5 },
  height: { type: Number, default: 2.5 },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }
}, {
  timestamps: true
});

const Door = mongoose.model('Door', doorSchema);
export default Door;
