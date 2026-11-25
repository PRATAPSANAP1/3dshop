import mongoose from 'mongoose';
import Shop from '../models/Shop';
import User from '../models/User';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export interface ResolvedShop {
  shopId: mongoose.Types.ObjectId;
  name: string;
  displayName: string;
}

/**
 * Resolves a shopName or slug to the corresponding shopId and metadata.
 * Searches modern multi-tenant Shop collection first, then falls back to legacy User.shopName.
 */
export async function resolveShop(shopIdentifier: string | string[] | undefined): Promise<ResolvedShop | null> {
  if (!shopIdentifier) {
    return null;
  }

  const idStr = Array.isArray(shopIdentifier) ? shopIdentifier[0] : shopIdentifier;
  if (!idStr || idStr === 'null' || idStr === 'undefined') {
    return null;
  }

  const trimmed = idStr.trim();
  const regex = new RegExp(`^${escapeRegex(trimmed)}$`, 'i');

  // 1. Try finding by Shop slug/name or displayName
  let shop = await Shop.findOne({
    $or: [{ name: regex }, { displayName: regex }],
    isActive: { $ne: false }
  });

  // 2. If valid ObjectId, try finding by Shop _id
  if (!shop && mongoose.Types.ObjectId.isValid(trimmed)) {
    shop = await Shop.findOne({ _id: new mongoose.Types.ObjectId(trimmed), isActive: { $ne: false } });
  }

  if (shop) {
    return {
      shopId: shop._id as mongoose.Types.ObjectId,
      name: shop.name,
      displayName: shop.displayName || shop.name,
    };
  }

  // 3. Fallback to legacy User model with shopName
  const user = await User.findOne({ shopName: regex });
  if (user) {
    const rawShopId = user.shopId || user._id;
    const shopId = typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId)
      ? new mongoose.Types.ObjectId(rawShopId)
      : (rawShopId as mongoose.Types.ObjectId);

    return {
      shopId,
      name: user.shopName || trimmed,
      displayName: user.shopName || trimmed,
    };
  }

  return null;
}

/**
 * Returns a list of all distinct available shop slugs/names across Shop and User collections.
 */
export async function getAllShopNames(): Promise<string[]> {
  const shopNames = new Set<string>();

  // Fetch from Shop collection
  const shops = await Shop.find({ isActive: { $ne: false } }, 'name displayName');
  for (const s of shops) {
    if (s.name && s.name.trim()) {
      shopNames.add(s.name.trim());
    }
  }

  // Fetch from legacy User collection
  const users = await User.find(
    { shopName: { $exists: true, $ne: null, $nin: ['', 'null', 'undefined'] } },
    'shopName'
  );
  for (const u of users) {
    if (u.shopName && u.shopName.trim()) {
      shopNames.add(u.shopName.trim());
    }
  }

  return Array.from(shopNames);
}
