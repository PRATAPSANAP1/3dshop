import { Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';

export const getStats = async (req: Request, res: Response) => {
  try {
    const query = (req.user as any).role === 'superadmin' ? {} : { shopId: (req as any).shopId };
    const products = await Product.find(query);
    const orders = await Order.find(query).sort({ createdAt: -1 });

    let lowStockCount = 0;
    let expiringSoonCount = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const categoryMap: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};
    const productRevenueMap: Record<string, { name: string, revenue: number, stock: number }> = {};

    products.forEach(p => {
      if (p.quantity < p.minStockLevel) lowStockCount++;
      productRevenueMap[p._id.toString()] = { name: p.productName, revenue: 0, stock: p.quantity };
      categoryMap[p.category] = 0;
    });

    let totalRevenue = 0;
    let lastMonthRevenue = 0;
    let olderRevenue = 0;

    let totalOrders30 = 0;
    let totalOrders60 = 0;

    orders.forEach(o => {
      // Treat Delivered or Paid as Revenue
      if (o.orderStatus === 'Delivered' || o.isPaid || o.paymentMethod === 'COD') {
        totalRevenue += o.totalPrice;

        if (o.createdAt >= thirtyDaysAgo) {
          lastMonthRevenue += o.totalPrice;
          totalOrders30++;
          const date = o.createdAt.toISOString().slice(0, 10);
          dailyMap[date] = (dailyMap[date] || 0) + o.totalPrice;
        } else if (o.createdAt >= sixtyDaysAgo) {
          olderRevenue += o.totalPrice;
          totalOrders60++;
        }

        // Add to category and product mapping
        o.orderItems.forEach((item: any) => {
          if (item.product && productRevenueMap[item.product.toString()]) {
            const rev = item.price * item.qty;
            productRevenueMap[item.product.toString()].revenue += rev;

            // To find category, we need the product
            const p = products.find(prod => prod._id.toString() === item.product.toString());
            if (p) {
              categoryMap[p.category] = (categoryMap[p.category] || 0) + rev;
            }
          }
        });
      }
    });

    const categoryData = Object.keys(categoryMap)
      .filter(cat => categoryMap[cat] > 0)
      .map(cat => ({ name: cat, value: categoryMap[cat] }));

    const dailyData = Object.keys(dailyMap).sort().map(date => ({
      date,
      revenue: dailyMap[date]
    }));

    const topProducts = Object.values(productRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Dynamic metrics
    const revGrowth = olderRevenue > 0 ? (((lastMonthRevenue - olderRevenue) / olderRevenue) * 100).toFixed(1) : "100.0";
    const ordGrowth = totalOrders60 > 0 ? (((totalOrders30 - totalOrders60) / totalOrders60) * 100).toFixed(1) : "100.0";

    // Health score
    const totalQty = products.reduce((acc, p) => acc + p.quantity, 0);
    const deadStockRatio = totalQty > 0 ? (lowStockCount / products.length) : 0;
    const healthScore = Math.max(0, 100 - (deadStockRatio * 100)).toFixed(1);

    // Suggestion
    const topCat = categoryData.length > 0 ? categoryData.sort((a, b) => b.value - a.value)[0].name : "Standard";
    const suggestion = 'AI analysis based on your ledger detects maximum liquidity driving through the ' + topCat + ' segment. Consider scaling inventory in this sector.';

    res.json({
      totalProducts: products.length,
      totalRevenue,
      lowStock: lowStockCount,
      expiringSoon: expiringSoonCount,
      categoryData,
      dailyData,
      topProducts,
      totalOrders: orders.length,
      dynamicStats: {
        revGrowth: `+${revGrowth}% Growth`,
        ordGrowth: `+${ordGrowth}% Lift`,
        healthScore,
        suggestion
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
