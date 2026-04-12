import { Request, Response } from 'express';
import Cart from '../models/Cart';

export const getCart = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: (req.user as any)._id }).populate('items.product');
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  const { productId, qty } = req.body;
  try {
    let cart = await Cart.findOne({ user: (req.user as any)._id });
    if (!cart) {
      cart = new Cart({ user: (req.user as any)._id, items: [] });
    }

    const existItem: any = cart.items.find((x: any) => x.product.toString() === productId);

    if (existItem) {
      existItem.qty += qty;
    } else {
      cart.items.push({ product: productId, qty });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ user: (req.user as any)._id }).populate('items.product');
    res.status(201).json(updatedCart);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  const { productId } = req.params;
  try {
    const cart = await Cart.findOne({ user: (req.user as any)._id });
    if (cart) {
      (cart.items as any) = cart.items.filter((x: any) => x.product.toString() !== productId);
      await cart.save();
      const updatedCart = await Cart.findOne({ user: (req.user as any)._id }).populate('items.product');
      return res.json(updatedCart);
    }
    res.status(404).json({ message: 'Cart not found' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCartQty = async (req: Request, res: Response) => {
  const { productId, qty } = req.body;
  try {
    const cart = await Cart.findOne({ user: (req.user as any)._id });
    if (cart) {
      const item: any = cart.items.find((x: any) => x.product.toString() === productId);
      if (item) {
        item.qty = qty;
        await cart.save();
        const updatedCart = await Cart.findOne({ user: (req.user as any)._id }).populate('items.product');
        return res.json(updatedCart);
      }
    }
    res.status(404).json({ message: 'Item not found in cart' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: (req.user as any)._id });
    if (cart) {
      (cart.items as any) = [];
      await cart.save();
      res.json({ message: 'Cart cleared' });
    } else {
       res.status(404).json({ message: 'Cart not found' });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
