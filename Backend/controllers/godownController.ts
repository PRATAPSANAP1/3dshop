import { Request, Response } from 'express';
import Godown from '../models/Godown';
import GodownRack from '../models/GodownRack';
import GodownStock from '../models/GodownStock';

export const getGodowns = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || (req.user as any).shopId;
    const godowns = await Godown.find({ shopId });
    res.json(godowns);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createGodown = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || (req.user as any).shopId;
    const godown = new Godown({ ...req.body, shopId });
    await godown.save();
    res.status(201).json(godown);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGodownOverview = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || (req.user as any).shopId;
    
    // Get all godowns for this shop
    const godowns = await Godown.find({ shopId });
    const godownIds = godowns.map(g => g._id);

    // Get all racks in these godowns
    const racksCount = await GodownRack.countDocuments({ godownId: { $in: godownIds } });
    
    // Get all stock (unique products count and low stock count)
    const stockItems = await GodownStock.find({ godownId: { $in: godownIds } });
    const totalProducts = new Set(stockItems.map(s => s.productId.toString())).size;
    const lowStock = stockItems.filter(s => s.quantity <= (s as any).minQuantity || 10).length;

    res.json({
      stats: {
        totalGodowns: godowns.length,
        totalRacks: racksCount,
        totalProducts: totalProducts,
        lowStock: lowStock,
        capacity: 75 // Mocked for now until capacity logic is built
      },
      godowns: godowns,
      recentActivity: [
        { id: 1, action: "Backend connected: Live Godown Overview Active", time: "Just now", type: "creation" }
      ]
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
