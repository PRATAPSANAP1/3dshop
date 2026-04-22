/**
 * One-time migration script: Single-shop → Multi-tenant
 * 
 * What it does:
 * 1. Creates a default Shop document for the existing single shop
 * 2. Sets shopId on every existing product, order, rack, invoice, etc.
 * 3. Sets existing admin users to role: 'admin' with the new shopId
 * 4. Sets existing customer/staff users to role: 'shopper'/'employee'
 * 
 * Usage: npx ts-node scripts/migrate-to-multitenant.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db';

// Import all models
import User from '../models/User';
import Shop from '../models/Shop';
import Product from '../models/Product';
import Order from '../models/Order';
import Rack from '../models/Rack';
import Door from '../models/Door';
import Invoice from '../models/Invoice';
import Notification from '../models/Notification';
import ShopConfig from '../models/ShopConfig';
import Cart from '../models/Cart';
import Wishlist from '../models/Wishlist';
import Coupon from '../models/Coupon';
import AuditLog from '../models/AuditLog';
import SmartStoreDataset from '../models/SmartStoreDataset';
import Review from '../models/Review';

const SHOP_SLUG = 'smartstore';
const SHOP_DISPLAY_NAME = 'SmartStore';

async function migrate() {
  await connectDB();
  console.log('🔄 Starting multi-tenant migration...\n');

  // Step 1: Find the first admin user (they will be the shop owner)
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.error('❌ No admin user found. Create an admin first.');
    process.exit(1);
  }
  console.log(`👤 Found admin owner: ${adminUser.name} (${adminUser.email})`);

  // Step 2: Create the default shop
  let shop = await Shop.findOne({ name: SHOP_SLUG });
  if (!shop) {
    shop = await Shop.create({
      name: SHOP_SLUG,
      displayName: SHOP_DISPLAY_NAME,
      ownerUserId: adminUser._id,
      plan: 'pro',
      isActive: true,
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        gstRate: 18,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
        razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || ''
      }
    });
    console.log(`🏪 Created default shop: "${shop.displayName}" (${shop._id})`);
  } else {
    console.log(`🏪 Default shop already exists: "${shop.displayName}" (${shop._id})`);
  }

  const shopId = shop._id;

  // Step 3: Update users
  // Admin users → keep as admin, set shopId
  const adminResult = await User.updateMany(
    { role: 'admin', shopId: { $in: [null, undefined] } },
    { $set: { shopId } }
  );
  console.log(`✅ Updated ${adminResult.modifiedCount} admin users with shopId`);

  // Staff users → convert to employee
  const staffResult = await User.updateMany(
    { role: 'staff' },
    { $set: { role: 'employee', shopId, employeePermissions: ['VIEW_ORDERS', 'VIEW_PRODUCTS', 'UPDATE_DELIVERY_STATUS'] } }
  );
  console.log(`✅ Converted ${staffResult.modifiedCount} staff → employee`);

  // Customer users → convert to shopper  
  const customerResult = await User.updateMany(
    { role: 'customer' },
    { $set: { role: 'shopper' } }
  );
  console.log(`✅ Converted ${customerResult.modifiedCount} customer → shopper`);

  // Step 4: Update all shop-scoped collections with shopId
  const collections = [
    { model: Product, name: 'Products' },
    { model: Order, name: 'Orders' },
    { model: Rack, name: 'Racks' },
    { model: Door, name: 'Doors' },
    { model: Invoice, name: 'Invoices' },
    { model: Notification, name: 'Notifications' },
    { model: Cart, name: 'Carts' },
    { model: Wishlist, name: 'Wishlists' },
    { model: Coupon, name: 'Coupons' },
    { model: AuditLog, name: 'AuditLogs' },
    { model: SmartStoreDataset, name: 'SmartStoreDatasets' },
    { model: Review, name: 'Reviews' },
  ];

  for (const { model, name } of collections) {
    try {
      // Update documents that have shopId pointing to the old admin user ID
      const r1 = await (model as any).updateMany(
        { shopId: adminUser._id },
        { $set: { shopId } }
      );
      // Also update documents with null/missing shopId
      const r2 = await (model as any).updateMany(
        { shopId: { $in: [null, undefined] } },
        { $set: { shopId } }
      );
      console.log(`✅ ${name}: ${r1.modifiedCount + r2.modifiedCount} docs updated`);
    } catch (err: any) {
      console.warn(`⚠️  ${name}: ${err.message}`);
    }
  }

  // Step 5: Update ShopConfig separately (it uses a different collection name)
  try {
    const scResult = await ShopConfig.updateMany(
      { shopId: adminUser._id },
      { $set: { shopId } }
    );
    const scResult2 = await ShopConfig.updateMany(
      { shopId: { $in: [null, undefined] } },
      { $set: { shopId } }
    );
    console.log(`✅ ShopConfig: ${scResult.modifiedCount + scResult2.modifiedCount} docs updated`);
  } catch (err: any) {
    console.warn(`⚠️  ShopConfig: ${err.message}`);
  }

  console.log('\n🎉 Migration complete!');
  console.log(`   Shop ID: ${shopId}`);
  console.log(`   Shop Slug: ${SHOP_SLUG}`);
  console.log(`   Owner: ${adminUser.email}`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
