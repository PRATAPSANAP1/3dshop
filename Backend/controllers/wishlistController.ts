import { Request, Response } from 'express';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const list = await Wishlist.findOne({ user: (req.user as any)._id }).populate('products');
    if (!list) {
      return res.json({ products: [] });
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  const { productId } = req.body;
  
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid Product ID' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Atomic update: creates if missing, adds product if not already present
    // No shopId needed as products are self-contained
    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { user: (req.user as any)._id },
      { $addToSet: { products: productId as any } },
      { upsert: true, new: true }
    ).populate('products');

    res.status(201).json(updatedWishlist);
  } catch (err: any) {
    console.error('[WISHLIST_ADD_ERROR]:', err);
    res.status(500).json({ 
      message: 'Internal server error while adding to wishlist',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  const { productId } = req.params;
  try {
    const list = await Wishlist.findOne({ user: (req.user as any)._id });
    if (list) {
      list.products = list.products.filter((x: any) => x.toString() !== productId);
      await list.save();
      const updatedWishlist = await Wishlist.findOne({ user: (req.user as any)._id }).populate('products');
      return res.json(updatedWishlist);
    }
    res.status(404).json({ message: 'Wishlist not found' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
