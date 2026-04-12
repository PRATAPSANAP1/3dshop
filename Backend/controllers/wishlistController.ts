import { Request, Response } from 'express';
import Wishlist from '../models/Wishlist';

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
  try {
    let list = await Wishlist.findOne({ user: (req.user as any)._id });
    if (!list) {
      list = new Wishlist({ user: (req.user as any)._id, products: [] });
    }

    if (list.products.includes(productId)) {
        return res.status(400).json({ message: 'Product already in wishlist' });
    }

    list.products.push(productId);
    await list.save();
    const updatedWishlist = await Wishlist.findOne({ user: (req.user as any)._id }).populate('products');
    res.status(201).json(updatedWishlist);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
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
