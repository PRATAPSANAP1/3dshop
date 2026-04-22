import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShopConfig {
  _id: string;
  name: string;
  displayName: string;
  logoUrl?: string;
  settings?: {
    currency?: string;
    timezone?: string;
    gstRate?: number;
  };
}

interface ShopStore {
  activeShopId: string | null;
  activeShopSlug: string | null;
  shopConfig: ShopConfig | null;
  setActiveShop: (shop: ShopConfig) => void;
  clearShop: () => void;
}

export const useShopStore = create<ShopStore>()(
  persist(
    (set) => ({
      activeShopId: null,
      activeShopSlug: null,
      shopConfig: null,
      setActiveShop: (shop) => set({
        activeShopId: shop._id,
        activeShopSlug: shop.name,
        shopConfig: shop,
      }),
      clearShop: () => set({
        activeShopId: null,
        activeShopSlug: null,
        shopConfig: null,
      }),
    }),
    { name: 'shop-store' }
  )
);
