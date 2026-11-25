import express, { Request, Response } from 'express';
const router = express.Router();
import Product from '../models/Product';
import Rack from '../models/Rack';
import ShopConfig from '../models/ShopConfig';
import User from '../models/User';
import { resolveShop } from '../utils/shopResolver';
import { getSmartProductSuggestions, getFrequentlyBoughtTogether } from '../controllers/mlController';

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, shopName } = req.query;
    let filter: any = {};
    if (query) {
      filter.productName = { $regex: query, $options: 'i' };
    }

    if (shopName) {
      const resolved = await resolveShop(shopName as string);
      if (resolved) {
        filter.shopId = resolved.shopId;
      }
    }

    const products = await Product.find(filter).populate('rackId');
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const products = await Product.find().populate('rackId');
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/catalog', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter: any = {};
    if (category) filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    const products = await Product.find(filter).populate('rackId');
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/racks/:shopName', async (req: Request, res: Response) => {
  try {
    const resolved = await resolveShop(req.params.shopName);
    if (!resolved) return res.status(404).json({ error: 'Shop not found' });

    const racks = await Rack.find({ shopId: resolved.shopId });
    res.json(racks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/racks', async (req: Request, res: Response) => {
  try {
    const racks = await Rack.find();
    res.json(racks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/rack/:rackId', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ rackId: req.params.rackId });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shop', async (req: Request, res: Response) => {
  try {
    const shop = await ShopConfig.findOne();
    res.json(shop || { roomWidth: 20, roomDepth: 20, roomHeight: 3 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Smart Product Suggestions (Apriori & Complementary Engine)
router.get('/suggestions', getSmartProductSuggestions);
router.post('/suggestions', getSmartProductSuggestions);
router.get('/suggestions/product/:productId', getFrequentlyBoughtTogether);

export default router;

