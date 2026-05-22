import { Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import Wishlist from '../models/Wishlist';

// --- 1. Apriori Simulation (Frequently Bought Together) ---
export const getFrequentlyBoughtTogether = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    // Find all orders containing this product
    const orders = await Order.find({ 'orderItems.product': productId }).lean();
    
    const coOccurrenceCount: Record<string, number> = {};
    
    orders.forEach(order => {
      order.orderItems.forEach((item: any) => {
        const id = item.product.toString();
        if (id !== productId) {
          coOccurrenceCount[id] = (coOccurrenceCount[id] || 0) + 1;
        }
      });
    });

    // Sort by frequency and get top 4
    const topIds = Object.entries(coOccurrenceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => entry[0]);

    if (topIds.length === 0) {
      // Fallback to random products in same category
      const product = await Product.findById(productId);
      if (product) {
        const fallback = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(4);
        return res.json(fallback);
      }
      return res.json([]);
    }

    const recommendedProducts = await Product.find({ _id: { $in: topIds } });
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

// --- 4. Next Product Prediction (Markov Chain Simulation) ---
export const predictNextProduct = async (req: Request, res: Response) => {
  try {
    const { currentProductId } = req.body;
    if (!currentProductId) return res.status(400).json({ message: 'Current product ID required' });

    // Since we don't track session views, we'll look at sequences in Orders
    const orders = await Order.find({ 'orderItems.product': currentProductId }).lean();
    
    const nextProductCounts: Record<string, number> = {};

    orders.forEach(order => {
      const items = order.orderItems;
      const idx = items.findIndex((i: any) => i.product.toString() === currentProductId);
      // If found and there is a next item in the array
      if (idx !== -1 && idx < items.length - 1) {
        const nextId = items[idx + 1].product.toString();
        nextProductCounts[nextId] = (nextProductCounts[nextId] || 0) + 1;
      }
    });

    const mostLikelyNextId = Object.entries(nextProductCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (!mostLikelyNextId) {
       // Fallback to Frequently bought together (Apriori fallback)
       const product = await Product.findById(currentProductId);
       const fallback = await Product.findOne({ category: product?.category, _id: { $ne: currentProductId } });
       return res.json({ predictedProduct: fallback });
    }

    const predictedProduct = await Product.findById(mostLikelyNextId);
    res.json({ predictedProduct });
  } catch (err) {
    console.error('Markov Error:', err);
    res.status(500).json({ message: 'Error predicting next product' });
  }
};
