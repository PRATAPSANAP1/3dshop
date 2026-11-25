import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import csv from 'csv-parser';

import Product from '../models/Product';
import Notification from '../models/Notification';
import { createAuditLog } from '../middleware/audit';
import { resolveShop } from '../utils/shopResolver';

export const getProductsByRack = async (req: Request, res: Response) => {
  try {
    const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
    const filter: any = { rackId: req.params.rackId };
    if (rawShopId) {
      filter.shopId = (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId))
        ? new mongoose.Types.ObjectId(rawShopId)
        : rawShopId;
    }
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
    const query: any = {};
    if (rawShopId) {
      query.shopId = (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId))
        ? new mongoose.Types.ObjectId(rawShopId)
        : rawShopId;
    }
    const products = await Product.find(query).populate('rackId');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { productName, category, price, quantity, minStockLevel, expiryDate, rackId, shelfNumber, columnNumber, brand, size, imageUrl, image, floor } = req.body;

  try {
    const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
    if (!rawShopId) return res.status(400).json({ message: 'Shop ID is required' });

    const shopId = (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId))
      ? new mongoose.Types.ObjectId(rawShopId)
      : rawShopId;

    const qrCode = crypto.randomBytes(16).toString('hex');
    const product = new Product({
      productName, category, price, quantity, minStockLevel, expiryDate, rackId, shelfNumber, columnNumber, brand, size, qrCode,
      imageUrl: imageUrl || image || '',
      image: imageUrl || image || '',
      floor: Number(floor) || 1,
      shopId
    });

    await product.save();

    if (quantity < minStockLevel) {
      await Notification.create({
        type: 'lowStock',
        message: `${productName} is low on stock (${quantity} left)`,
        productId: product._id,
        shopId
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
    const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
    const filter: any = { _id: req.params.id };
    if (rawShopId) {
      filter.shopId = (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId))
        ? new mongoose.Types.ObjectId(rawShopId)
        : rawShopId;
    }

    const product = await Product.findOneAndUpdate(
      filter,
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
    const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
    const filter: any = { _id: req.params.id };
    if (rawShopId) {
      filter.shopId = (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId))
        ? new mongoose.Types.ObjectId(rawShopId)
        : rawShopId;
    }

    const product = await Product.findOneAndDelete(filter);
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
    if (!shopName) {
      return res.status(400).json({ message: 'Shop name required' });
    }
    const resolved = await resolveShop(shopName as string);
    if (!resolved) return res.status(404).json({ message: 'Shop not found' });

    const filter: any = { shopId: resolved.shopId };
    if (query) {
      filter.productName = { $regex: query as string, $options: 'i' };
    }

    const products = await Product.find(filter).populate('rackId');
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

export const importProducts = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
  const shopId = (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId))
    ? new mongoose.Types.ObjectId(rawShopId)
    : rawShopId;
  const results: any[] = [];
  const errors: string[] = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const createdProducts = [];
        for (const item of results) {
          try {
            // Basic validation
            if (!item.productName || !item.price || !item.quantity) {
              errors.push(`Missing required fields for: ${item.productName || 'Unknown Product'}`);
              continue;
            }

            const qrCode = crypto.randomBytes(16).toString('hex');
            const product = new Product({
              productName: item.productName,
              category: item.category || 'General',
              price: Number(item.price),
              quantity: Number(item.quantity),
              minStockLevel: Number(item.minStockLevel || 5),
              brand: item.brand || '',
              size: item.size || '',
              qrCode,
              shopId
            });

            await product.save();
            createdProducts.push(product);

            // Audit log for each
            await createAuditLog((req as any).user, 'PRODUCT_CREATE', 'Product', `Imported product ${item.productName}`, {
              entityId: product._id.toString(),
              entityName: item.productName,
              changes: { isImported: true }
            });
          } catch (err: any) {
            errors.push(`Failed to import ${item.productName}: ${err.message}`);
          }
        }

        // Clean up file
        fs.unlinkSync(req.file!.path);

        res.json({
          message: `Successfully imported ${createdProducts.length} products`,
          count: createdProducts.length,
          errors: errors.length > 0 ? errors : null
        });
      } catch (error) {
        res.status(500).json({ message: 'Error processing CSV data' });
      }
    });
};
