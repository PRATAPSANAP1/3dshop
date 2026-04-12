import { Request, Response } from 'express';
import crypto from 'crypto';
import Product from '../models/Product';
import Notification from '../models/Notification';
import { createAuditLog } from '../middleware/audit';

export const getProductsByRack = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ rackId: req.params.rackId, shopId: req.user._id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ shopId: req.user._id }).populate('rackId');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



export const createProduct = async (req: Request, res: Response) => {
  const { productName, category, price, quantity, minStockLevel, expiryDate, rackId, shelfNumber, columnNumber, brand, size } = req.body;

  try {
    const qrCode = crypto.randomBytes(16).toString('hex');
    const product = new Product({
      productName, category, price, quantity, minStockLevel, expiryDate, rackId, shelfNumber, columnNumber, brand, size, qrCode,
      shopId: req.user._id
    });

    await product.save();

    if (quantity < minStockLevel) {
      await Notification.create({
        type: 'lowStock',
        message: `${productName} is low on stock (${quantity} left)`,
        productId: product._id,
        shopId: (req as any).user._id
      });
    }

    await createAuditLog((req as any).user, 'PRODUCT_CREATE', 'Product', `Created product ${productName}`, {
      entityId: product._id.toString(),
      entityName: productName,
      changes: { qty: quantity, price }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id },
      req.body,
      { new: true }
    );

    if (product && product.quantity < product.minStockLevel) {
      await Notification.findOneAndUpdate(
        { productId: product._id, type: 'lowStock', isRead: false },
        { message: `${product.productName} is low on stock (${product.quantity} left)` },
        { upsert: true, new: true }
      );
    }

    if(product) {
        await createAuditLog((req as any).user, 'PRODUCT_UPDATE', 'Product', `Updated product ${product.productName}`, {
            entityId: product._id.toString(),
            entityName: product.productName,
            changes: req.body
        });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, shopId: (req as any).user._id });
    if(product) {
       await createAuditLog((req as any).user, 'PRODUCT_DELETE', 'Product', `Deleted product ${product.productName}`, {
         entityId: product._id.toString(),
         entityName: product.productName
       });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const scanQR = async (req: Request, res: Response) => {
  const { qrCode, quantityTaken } = req.body;

  try {
    const product = await Product.findOne({ qrCode });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.quantity -= quantityTaken;
    product.totalRevenue += quantityTaken * product.price;
    await product.save();

    if (product.quantity < product.minStockLevel) {
      await Notification.create({
        type: 'lowStock',
        message: `${product.productName} is low on stock (${product.quantity} left)`,
        productId: product._id,
        shopId: product.shopId
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicSearch = async (req: Request, res: Response) => {
  const { query, shopName } = req.query;
  try {
    const User = require('../models/User').default;
    const shop = await User.findOne({ shopName });
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const products = await Product.find({
      shopId: shop._id,
      productName: { $regex: query as string, $options: 'i' }
    }).populate('rackId');
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateStockByQR = async (req: Request, res: Response) => {
  const { qrCode, quantityChange } = req.body;
  try {
    const product = await Product.findOne({ qrCode });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.quantity += Number(quantityChange);
    await product.save();

    await createAuditLog((req as any).user, 'STOCK_UPDATE', 'Product', `Stock manually updated for ${product.productName}`, {
      entityId: product._id.toString(),
      entityName: product.productName,
      changes: { delta: Number(quantityChange), newStock: product.quantity }
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('rackId');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const Review = require('../models/Review').default;
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createReview = async (req: Request, res: Response) => {
  const { rating, comment } = req.body;
  try {
    const Review = require('../models/Review').default;
    const alreadyReviewed = await Review.findOne({
      product: req.params.id,
      user: (req.user as any)._id,
    });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    const review = await Review.create({
      name: (req.user as any).name,
      rating: Number(rating),
      comment,
      user: (req.user as any)._id,
      product: req.params.id,
    });
    // Update product rating & numReviews
    const reviews = await Review.find({ product: req.params.id });
    const avgRating = reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(req.params.id, {
      rating: Math.round(avgRating * 10) / 10,
      numReviews: reviews.length,
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
