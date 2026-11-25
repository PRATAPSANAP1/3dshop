import { Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import Wishlist from '../models/Wishlist';
import { resolveShop } from '../utils/shopResolver';

// Knowledge base of complementary grocery & supermarket associations
export const COMPLEMENTARY_KEYWORDS: Record<string, string[]> = {
  milk: ['bread', 'biscuit', 'cookie', 'butter', 'cereal', 'tea', 'coffee', 'oats', 'rusk', 'jam', 'egg', 'cheese', 'paneer'],
  bread: ['butter', 'jam', 'cheese', 'egg', 'milk', 'spread', 'mayo', 'biscuit', 'toast'],
  biscuit: ['tea', 'coffee', 'milk', 'cookie', 'rusk', 'snack'],
  cookie: ['milk', 'coffee', 'tea', 'ice cream', 'biscuit'],
  tea: ['milk', 'sugar', 'biscuit', 'rusk', 'cookie', 'snack', 'ginger'],
  chai: ['milk', 'sugar', 'biscuit', 'rusk', 'snack'],
  coffee: ['milk', 'sugar', 'cookie', 'biscuit', 'creamer'],
  butter: ['bread', 'jam', 'cheese', 'bun', 'toast', 'milk', 'egg'],
  cheese: ['bread', 'butter', 'pasta', 'pizza', 'crackers', 'sandwich'],
  egg: ['bread', 'butter', 'milk', 'salt', 'pepper', 'oil'],
  chips: ['soda', 'coke', 'cold drink', 'pepsi', 'dip', 'salsa', 'juice', 'biscuit'],
  snack: ['soda', 'cold drink', 'juice', 'tea', 'biscuit'],
  soda: ['chips', 'popcorn', 'snack', 'burger', 'pizza', 'biscuit'],
  coke: ['chips', 'snack', 'burger', 'pizza', 'popcorn'],
  'cold drink': ['chips', 'snack', 'biscuit', 'soda'],
  pasta: ['sauce', 'cheese', 'olive oil', 'oregano', 'seasoning', 'garlic bread'],
  noodle: ['sauce', 'ketchup', 'soup', 'cheese', 'chips'],
  maggi: ['sauce', 'ketchup', 'cheese', 'soup'],
  rice: ['dal', 'lentil', 'ghee', 'oil', 'spices', 'pickle', 'papad'],
  dal: ['rice', 'ghee', 'spices', 'oil', 'atta', 'flour'],
  atta: ['ghee', 'oil', 'salt', 'sugar', 'butter', 'dal'],
  flour: ['sugar', 'butter', 'baking powder', 'yeast', 'milk', 'egg'],
  shampoo: ['conditioner', 'soap', 'body wash', 'hair oil', 'serum'],
  conditioner: ['shampoo', 'hair oil', 'serum'],
  soap: ['shampoo', 'conditioner', 'body wash', 'lotion', 'towel'],
  'body wash': ['lotion', 'loofah', 'shampoo', 'soap'],
  toothpaste: ['toothbrush', 'mouthwash', 'floss'],
  toothbrush: ['toothpaste', 'mouthwash'],
  apple: ['banana', 'orange', 'fruit', 'milk', 'yogurt', 'honey'],
  fruit: ['yogurt', 'milk', 'honey', 'oats', 'juice'],
  chocolate: ['biscuit', 'cookie', 'milk', 'ice cream', 'cake'],
  sauce: ['bread', 'noodle', 'chips', 'pasta', 'cheese']
};

export const getComplementaryKeywordsForName = (productName: string): string[] => {
  if (!productName || typeof productName !== 'string') return [];
  const lower = productName.toLowerCase();
  const keywords = new Set<string>();
  for (const [key, targets] of Object.entries(COMPLEMENTARY_KEYWORDS)) {
    if (lower.includes(key)) {
      targets.forEach(t => keywords.add(t));
    }
  }
  return Array.from(keywords);
};

// --- 1. Apriori & Semantic Recommendations (Frequently Bought Together) ---
export const getFrequentlyBoughtTogether = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    const sourceProduct = await Product.findById(productId).lean();
    if (!sourceProduct) return res.status(404).json({ message: 'Product not found' });

    // Step 1: Find all orders containing this product
    const orders = await Order.find({ 'orderItems.product': productId }).lean();
    const coOccurrenceCount: Record<string, number> = {};
    
    orders.forEach(order => {
      order.orderItems.forEach((item: any) => {
        const id = item.product?.toString();
        if (id && id !== productId) {
          coOccurrenceCount[id] = (coOccurrenceCount[id] || 0) + 1;
        }
      });
    });

    const topCoOrderIds = Object.entries(coOccurrenceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(entry => entry[0]);

    let recommendedProducts: any[] = [];
    if (topCoOrderIds.length > 0) {
      recommendedProducts = await Product.find({ _id: { $in: topCoOrderIds } }).populate('rackId').lean();
    }

    // Step 2: If we need more items, search semantic complementary products (e.g. Milk -> Bread, Biscuit, Butter)
    if (recommendedProducts.length < 4) {
      const keywords = getComplementaryKeywordsForName(sourceProduct.productName);
      const excludeIds = [sourceProduct._id.toString(), ...recommendedProducts.map(p => p._id.toString())];

      if (keywords.length > 0) {
        const regexPattern = keywords.map(kw => `\\b${kw}`).join('|');
        const filter: any = {
          _id: { $nin: excludeIds },
          productName: { $regex: regexPattern, $options: 'i' }
        };
        if (sourceProduct.shopId) filter.shopId = sourceProduct.shopId;

        const complementary = await Product.find(filter)
          .populate('rackId')
          .limit(6 - recommendedProducts.length)
          .lean();

        recommendedProducts.push(...complementary);
      }
    }

    // Step 3: Fallback to same category or popular products in the same store
    if (recommendedProducts.length < 4) {
      const excludeIds = [sourceProduct._id.toString(), ...recommendedProducts.map(p => p._id.toString())];
      const fallbackFilter: any = { _id: { $nin: excludeIds } };
      if (sourceProduct.shopId) fallbackFilter.shopId = sourceProduct.shopId;

      const categoryFallback = await Product.find({ ...fallbackFilter, category: sourceProduct.category })
        .populate('rackId')
        .limit(4 - recommendedProducts.length)
        .lean();

      recommendedProducts.push(...categoryFallback);
    }

    res.json(recommendedProducts);
  } catch (err) {
    console.error('Apriori Error:', err);
    res.status(500).json({ message: 'Error calculating associations' });
  }
};

// --- 2. Collaborative Filtering (Recommended for You) ---
export const getRecommendationsForUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    // Get user's orders and wishlist to build their profile vector
    const userOrders = await Order.find({ user: userId }).lean();
    const userWishlist = await Wishlist.findOne({ user: userId }).lean();

    const userItemSet = new Set<string>();
    userOrders.forEach(o => o.orderItems.forEach((i: any) => userItemSet.add(i.product.toString())));
    if (userWishlist) {
      userWishlist.products.forEach((p: any) => userItemSet.add(p.toString()));
    }

    if (userItemSet.size === 0) {
      // New user, return globally popular items
      const popular = await Product.find().sort({ popularity: -1 }).limit(10);
      return res.json(popular);
    }

    // Find other users who bought/wishlisted similar items
    const allOrders = await Order.find({ user: { $ne: userId } }).lean();
    const otherUsersMap: Record<string, Set<string>> = {};

    allOrders.forEach(o => {
      const uId = o.user.toString();
      if (!otherUsersMap[uId]) otherUsersMap[uId] = new Set();
      o.orderItems.forEach((i: any) => otherUsersMap[uId].add(i.product.toString()));
    });

    // Calculate Jaccard similarity
    const similarities = [];
    for (const [uId, items] of Object.entries(otherUsersMap)) {
      let intersection = 0;
      items.forEach(item => {
        if (userItemSet.has(item)) intersection++;
      });
      const union = userItemSet.size + items.size - intersection;
      const sim = intersection / union;
      if (sim > 0) similarities.push({ uId, sim, items });
    }

    // Sort by similarity
    similarities.sort((a, b) => b.sim - a.sim);

    // Collect recommendations from top 5 similar users
    const recommendedItemIds = new Set<string>();
    const topSimilar = similarities.slice(0, 5);
    for (const userSim of topSimilar) {
      userSim.items.forEach(item => {
        if (!userItemSet.has(item)) recommendedItemIds.add(item);
      });
    }

    let results = await Product.find({ _id: { $in: Array.from(recommendedItemIds) } }).limit(10);

    // Fallback if not enough CF recommendations
    if (results.length < 4) {
       const extra = await Product.find({ _id: { $nin: Array.from(userItemSet) } }).limit(10 - results.length);
       results = [...results, ...extra];
    }

    res.json(results);
  } catch (err) {
    console.error('CF Error:', err);
    res.status(500).json({ message: 'Error calculating recommendations' });
  }
};

// --- 3. Customer Segmentation (K-Means) ---
export const getCustomerSegments = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: 'shopper' }).select('_id name email').lean();
    const orders = await Order.find().lean();

    const userStatsMap: Record<string, { totalSpent: number, orderCount: number, name: string, email: string }> = {};
    users.forEach(u => {
      userStatsMap[u._id.toString()] = { totalSpent: 0, orderCount: 0, name: u.name, email: u.email };
    });

    orders.forEach(o => {
      const uId = o.user.toString();
      if (userStatsMap[uId]) {
        userStatsMap[uId].totalSpent += o.totalPrice || 0;
        userStatsMap[uId].orderCount += 1;
      }
    });

    // Extract data points
    const dataPoints = Object.entries(userStatsMap).map(([id, stats]) => ({
      id,
      name: stats.name,
      email: stats.email,
      spend: stats.totalSpent,
      orders: stats.orderCount
    }));

    if (dataPoints.length === 0) return res.json({ clusters: [] });

    // Normalize data for K-Means
    const maxSpend = Math.max(...dataPoints.map(d => d.spend)) || 1;
    const maxOrders = Math.max(...dataPoints.map(d => d.orders)) || 1;

    // Simple K-Means (K=3)
    const k = Math.min(3, dataPoints.length);
    let centroids = dataPoints.slice(0, k).map(d => ({ spend: d.spend / maxSpend, orders: d.orders / maxOrders }));

    let clusters: typeof dataPoints[] = Array.from({ length: k }, () => []);

    for (let iter = 0; iter < 10; iter++) { // 10 iterations max
      clusters = Array.from({ length: k }, () => []);
      
      // Assign points
      dataPoints.forEach(point => {
        const nSpend = point.spend / maxSpend;
        const nOrders = point.orders / maxOrders;
        
        let minDist = Infinity;
        let clusterIdx = 0;

        centroids.forEach((c, idx) => {
          const dist = Math.sqrt(Math.pow(nSpend - c.spend, 2) + Math.pow(nOrders - c.orders, 2));
          if (dist < minDist) {
            minDist = dist;
            clusterIdx = idx;
          }
        });
        clusters[clusterIdx].push(point);
      });

      // Update centroids
      centroids = clusters.map(cluster => {
        if (cluster.length === 0) return { spend: 0, orders: 0 };
        const sumSpend = cluster.reduce((sum, p) => sum + (p.spend / maxSpend), 0);
        const sumOrders = cluster.reduce((sum, p) => sum + (p.orders / maxOrders), 0);
        return { spend: sumSpend / cluster.length, orders: sumOrders / cluster.length };
      });
    }

    // Format output
    const segments = clusters.map((cluster, idx) => {
      // Determine label based on centroid
      const c = centroids[idx];
      let label = "Standard";
      if (c.spend > 0.6 && c.orders > 0.5) label = "VIP (High Value)";
      else if (c.spend < 0.2 && c.orders < 0.2) label = "At Risk (Low Activity)";
      else if (c.orders > 0.5 && c.spend < 0.4) label = "Frequent Buyers (Low Ticket)";

      return {
        id: idx,
        label,
        centroid: { spend: c.spend * maxSpend, orders: c.orders * maxOrders },
        customers: cluster
      };
    });

    res.json({ segments });
  } catch (err) {
    console.error('K-Means Error:', err);
    res.status(500).json({ message: 'Error calculating customer segments' });
  }
};

// --- 4. Next Product Prediction (Markov Chain & Semantic Fallback) ---
export const predictNextProduct = async (req: Request, res: Response) => {
  try {
    const { currentProductId, productName, shopName } = req.body;
    if (!currentProductId && !productName) return res.status(400).json({ message: 'Current product ID or Name required' });

    let product: any = null;
    if (currentProductId) {
      product = await Product.findById(currentProductId).populate('rackId').lean();
    }

    // Since we don't track session views, we'll look at sequences in Orders
    if (currentProductId) {
      const orders = await Order.find({ 'orderItems.product': currentProductId }).lean();
      const nextProductCounts: Record<string, number> = {};

      orders.forEach(order => {
        const items = order.orderItems;
        const idx = items.findIndex((i: any) => i.product.toString() === currentProductId);
        if (idx !== -1 && idx < items.length - 1) {
          const nextId = items[idx + 1].product.toString();
          nextProductCounts[nextId] = (nextProductCounts[nextId] || 0) + 1;
        }
      });

      const mostLikelyNextId = Object.entries(nextProductCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      if (mostLikelyNextId) {
        const predictedProduct = await Product.findById(mostLikelyNextId).populate('rackId');
        return res.json({ predictedProduct, reason: 'Frequently bought next in past orders' });
      }
    }

    // Fallback: Smart semantic complementary prediction (e.g. Milk -> Bread or Biscuit)
    const name = product?.productName || productName || '';
    const keywords = getComplementaryKeywordsForName(name);

    if (keywords.length > 0) {
      const regexPattern = keywords.map(kw => `\\b${kw}`).join('|');
      const filter: any = {
        productName: { $regex: regexPattern, $options: 'i' }
      };
      if (product?._id) filter._id = { $ne: product._id };
      if (product?.shopId) filter.shopId = product.shopId;

      const complementary = await Product.findOne(filter).populate('rackId');
      if (complementary) {
        return res.json({ 
          predictedProduct: complementary, 
          reason: `Customers who buy ${name.split(' ')[0]} usually get this next` 
        });
      }
    }

    const fallbackFilter: any = {};
    if (product?._id) fallbackFilter._id = { $ne: product._id };
    if (product?.category) fallbackFilter.category = product.category;
    if (product?.shopId) fallbackFilter.shopId = product.shopId;

    const fallback = await Product.findOne(fallbackFilter).populate('rackId');
    res.json({ predictedProduct: fallback, reason: 'Recommended complementary item' });
  } catch (err) {
    console.error('Markov Error:', err);
    res.status(500).json({ message: 'Error predicting next product' });
  }
};

// --- 5. Universal Smart Product Suggestion System ---
export const getSmartProductSuggestions = async (req: Request, res: Response) => {
  try {
    const { productId, productName, productIds, shopName, limit = 6 } = { ...req.query, ...req.body };
    const numLimit = Math.min(Number(limit) || 6, 20);

    let targetShopId: any = null;
    if (shopName) {
      const resolved = await resolveShop(shopName as string);
      if (resolved) targetShopId = resolved.shopId;
    }

    const sourceIds: string[] = [];
    if (productId && typeof productId === 'string') sourceIds.push(productId);
    if (Array.isArray(productIds)) {
      sourceIds.push(...productIds.map(String));
    } else if (typeof productIds === 'string' && productIds.trim()) {
      sourceIds.push(...productIds.split(',').map(s => s.trim()));
    }

    let sourceProducts: any[] = [];
    if (sourceIds.length > 0) {
      sourceProducts = await Product.find({ _id: { $in: sourceIds } }).lean();
    }

    if (sourceProducts.length === 0 && productName && typeof productName === 'string') {
      sourceProducts.push({ productName, category: 'General' });
    }

    const targetKeywords = new Set<string>();
    const sourceCategories = new Set<string>();
    const excludeIds = new Set<string>(sourceProducts.filter(p => p._id).map(p => p._id.toString()));

    if (!targetShopId && sourceProducts.length > 0 && sourceProducts[0].shopId) {
      targetShopId = sourceProducts[0].shopId;
    }

    sourceProducts.forEach(prod => {
      if (prod.productName) {
        getComplementaryKeywordsForName(prod.productName).forEach(kw => targetKeywords.add(kw));
      }
      if (prod.category) {
        sourceCategories.add(prod.category.toLowerCase());
      }
    });

    // Check orders for co-occurrence (Apriori)
    const coOccurrenceCount: Record<string, number> = {};
    if (sourceIds.length > 0) {
      const orders = await Order.find({ 'orderItems.product': { $in: sourceIds } }).lean();
      orders.forEach(order => {
        order.orderItems.forEach((item: any) => {
          const id = item.product?.toString();
          if (id && !excludeIds.has(id)) {
            coOccurrenceCount[id] = (coOccurrenceCount[id] || 0) + 1;
          }
        });
      });
    }

    const baseFilter: any = {};
    if (targetShopId) baseFilter.shopId = targetShopId;
    if (excludeIds.size > 0) baseFilter._id = { $nin: Array.from(excludeIds) };

    // Find keyword matches
    let keywordCandidates: any[] = [];
    if (targetKeywords.size > 0) {
      const regexPattern = Array.from(targetKeywords).map(kw => `\\b${kw}`).join('|');
      keywordCandidates = await Product.find({
        ...baseFilter,
        productName: { $regex: regexPattern, $options: 'i' }
      }).populate('rackId').lean();
    }

    // Find co-ordered products
    const coOrderIds = Object.keys(coOccurrenceCount);
    let coOrderCandidates: any[] = [];
    if (coOrderIds.length > 0) {
      coOrderCandidates = await Product.find({
        ...baseFilter,
        _id: { $in: coOrderIds }
      }).populate('rackId').lean();
    }

    // Combine candidates
    const candidateMap = new Map<string, any>();
    [...keywordCandidates, ...coOrderCandidates].forEach(p => {
      candidateMap.set(p._id.toString(), p);
    });

    // Additional popular products in store if needed
    if (candidateMap.size < numLimit) {
      const additional = await Product.find(baseFilter)
        .populate('rackId')
        .sort({ rating: -1, quantity: -1 })
        .limit(numLimit * 2)
        .lean();
      additional.forEach(p => {
        if (!candidateMap.has(p._id.toString())) {
          candidateMap.set(p._id.toString(), p);
        }
      });
    }

    const scoredList = Array.from(candidateMap.values()).map(product => {
      let score = 0;
      let reason = 'Frequently paired together';
      const pNameLower = (product.productName || '').toLowerCase();

      let matchesKw = false;
      for (const kw of targetKeywords) {
        if (pNameLower.includes(kw)) {
          matchesKw = true;
          score += 60;
          if (sourceProducts.length > 0 && sourceProducts[0].productName) {
            reason = `Goes great with ${sourceProducts[0].productName.split(' ')[0]}`;
          } else {
            reason = `Frequently paired with your items`;
          }
          break;
        }
      }

      const coCount = coOccurrenceCount[product._id.toString()] || 0;
      if (coCount > 0) {
        score += coCount * 25;
        reason = `Often bought together (${coCount} orders)`;
      }

      const pCatLower = (product.category || '').toLowerCase();
      if (sourceCategories.has('dairy') && (pCatLower.includes('bakery') || pCatLower.includes('snack'))) {
        score += 20;
      } else if (sourceCategories.has('bakery') && (pCatLower.includes('dairy') || pCatLower.includes('spread'))) {
        score += 20;
      }

      if (product.quantity > 0) score += 10;
      score += (product.rating || 0) * 2;

      return {
        ...product,
        suggestionScore: score,
        suggestionReason: reason
      };
    });

    scoredList.sort((a, b) => b.suggestionScore - a.suggestionScore);
    const results = scoredList.slice(0, numLimit);

    res.json(results);
  } catch (err: any) {
    console.error('Smart suggestions error:', err);
    res.status(500).json({ message: 'Error fetching suggestions', error: err.message });
  }
};
