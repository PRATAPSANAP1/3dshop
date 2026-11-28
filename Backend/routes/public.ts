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

// CORS-safe Image Proxy for 3D WebGL Product Box Textures
router.get('/image-proxy', async (req: Request, res: Response) => {
  try {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
      return res.status(400).json({ error: 'Valid http/https url required' });
    }
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return res.status(403).json({ error: 'Blocked host' });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(rawUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': '3DShop-ImageProxy/1.0' }
    });
    clearTimeout(timer);

    if (!response.ok) {
      return res.status(response.status).end();
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(415).json({ error: 'Not an image' });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch {
    res.status(502).end();
  }
});

export default router;

