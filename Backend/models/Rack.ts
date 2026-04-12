import mongoose from 'mongoose';

const rackSchema = new mongoose.Schema({
  rackName: { type: String, required: true },
  positionX: { type: Number, default: 0 },
  positionY: { type: Number, default: 0 },
  positionZ: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 },
  width: { type: Number, default: 2 },
  height: { type: Number, default: 2 },
  depth: { type: Number, default: 0.5 },
  shelves: { type: Number, default: 4 },
  columns: { type: Number, default: 1 },
  color: { type: String, default: '#3b82f6' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

const Rack = mongoose.model('Rack', rackSchema);
export default Rack;
