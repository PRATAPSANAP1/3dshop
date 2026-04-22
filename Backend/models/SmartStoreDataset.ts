import mongoose from 'mongoose';

const smartStoreDatasetSchema = new mongoose.Schema({
  zoneTraffic: [{ zoneName: String, visitors: Number }],
  trafficOverTime: [{ time: String, visitors: Number }],
  dwellTimes: [{ zoneName: String, seconds: Number }],
  rackPerformance: [{ rackName: String, sales: Number, restocks: Number, lowStockAlerts: Number }],
  categorySales: [{ category: String, sales: Number }],
  zoneRadar: [{ zoneName: String, traffic: Number, dwell: Number, sales: Number }],
  movementMatrix: { type: Map, of: String }, // zone -> nextZone
  aiInsights: [String],
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }
}, {
  timestamps: true
});

const SmartStoreDataset = mongoose.model('SmartStoreDataset', smartStoreDatasetSchema);
export default SmartStoreDataset;
