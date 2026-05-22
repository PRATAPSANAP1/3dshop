import { Request, Response } from 'express';
import GodownStock from '../models/GodownStock';
import Godown from '../models/Godown';

export const getStock = async (req: Request, res: Response) => {
  try {
    const stock = await GodownStock.find({ godownId: req.params.godownId }).populate('productId', 'name sku');
    res.json(stock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllStock = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || (req.user as any).shopId;
    const godowns = await Godown.find({ shopId });
    const godownIds = godowns.map(g => g._id);
    const stock = await GodownStock.find({ godownId: { $in: godownIds } }).populate('productId', 'name sku qrCode price').populate('godownId', 'name');
    res.json(stock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addStock = async (req: Request, res: Response) => {
  try {
    const stock = new GodownStock({
      ...req.body,
      godownId: req.params.godownId,
    });
    const createdStock = await stock.save();
    res.status(201).json(createdStock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const stock = await GodownStock.findByIdAndUpdate(
      req.params.stockId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!stock) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }
    res.json(stock);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
