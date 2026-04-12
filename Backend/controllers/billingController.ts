import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Product from '../models/Product';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ shopId: req.user._id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchInvoice = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query required' });
    }

    const invoices = await Invoice.find({
      shopId: req.user._id,
      invoiceNumber: { $regex: q, $options: 'i' }
    }).sort({ createdAt: -1 }).limit(20);

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      shopId: req.user._id
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  const { items, subtotal, gstAmount, totalAmount, customerName, customerPhone, paymentMethod } = req.body;

  try {
    const count = await Invoice.countDocuments({ shopId: req.user._id });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${dateStr}-${(count + 1).toString().padStart(4, '0')}-${randomSuffix}`;

    const invoice = new Invoice({
      invoiceNumber,
      items,
      subtotal,
      gstAmount,
      totalAmount,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      paymentMethod: paymentMethod || 'cash',
      shopId: req.user._id
    });

    await invoice.save();

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.quantity -= item.quantity;
        product.totalRevenue += item.total;
        await product.save();
      }
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ shopId: req.user._id });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInvoices = invoices.filter(i => new Date(i.createdAt) >= today);

    const stats = {
      total: invoices.reduce((acc, i) => acc + i.totalAmount, 0),
      paid: invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.totalAmount, 0),
      pending: invoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + i.totalAmount, 0),
      totalCount: invoices.length,
      todayCount: todayInvoices.length,
      todayRevenue: todayInvoices.reduce((acc, i) => acc + i.totalAmount, 0),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

