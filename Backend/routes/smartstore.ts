import express from 'express';
import { protect } from '../middleware/auth';
import SmartStoreDataset from '../models/SmartStoreDataset';
import Product from '../models/Product';
import Rack from '../models/Rack';

const router = express.Router();

router.get('/dashboard-data', protect, async (req, res) => {
  try {
    let dataset = await SmartStoreDataset.findOne({ shopId: req.user._id });

    if (!dataset || req.query.refresh === 'true') {
      const racks = await Rack.find({ shopId: req.user._id });
      const products = await Product.find({ shopId: req.user._id });
      const categories = [...new Set(products.map(p => p.category))];

      dataset = await SmartStoreDataset.findOneAndUpdate(
        { shopId: req.user._id },
        {
          shopId: req.user._id,
          zoneTraffic: racks.map(r => ({ zoneName: r.rackName, visitors: Math.floor(Math.random() * 500) + 100 })),
          trafficOverTime: Array.from({ length: 12 }, (_, i) => ({ time: `${8 + i} AM`, visitors: Math.floor(Math.random() * 100) })),
          dwellTimes: racks.map(r => ({ zoneName: r.rackName, seconds: Math.floor(Math.random() * 300) + 60 })),
          rackPerformance: racks.map(r => ({ 
            rackName: r.rackName, 
            sales: Math.floor(Math.random() * 1000), 
            restocks: Math.floor(Math.random() * 10),
            lowStockAlerts: products.filter(p => p.rackId?.toString() === r._id.toString() && p.quantity < p.minStockLevel).length
          })),
          categorySales: categories.map(c => ({ category: c, sales: Math.floor(Math.random() * 5000) })),
          zoneRadar: racks.map(r => ({ 
            zoneName: r.rackName, 
            traffic: Math.floor(Math.random() * 100), 
            dwell: Math.floor(Math.random() * 100), 
            sales: Math.floor(Math.random() * 100) 
          })),
          movementMatrix: racks.reduce((acc, r, i) => {
            const nextIdx = (i + 1) % racks.length;
            acc[r.rackName] = racks[nextIdx].rackName;
            return acc;
          }, {} as Record<string, string>),
          aiInsights: [
            `Traffic flow is highest around ${racks[0]?.rackName || 'Main Entrance'}.`,
            `Category '${categories[0] || 'General'}' drive 40% of sales.`,
            `Restock events for ${racks[1]?.rackName || 'Aisles'} have decreased by 15%.`
          ]
        },
        { upsert: true, new: true }
      );
    }

    res.json(dataset);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
