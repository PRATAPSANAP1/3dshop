import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Text, Plane, Environment, ContactShadows, Line } from '@react-three/drei';
import * as THREE from 'three';
import API from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Package, AlertCircle, X, ShoppingCart, Heart, Store, ChevronRight, QrCode, Route, Footprints, CheckCircle2, ListOrdered, Plus, Trash2, Sparkles, Check, Layers } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProductBoxMesh } from '@/components/3d/ProductBoxMesh';
import {
  AttractiveRackFrame3D,
  CreamTileFloor3D,
  GoogleMapsRoute3D,
  StoreDimensionsOverlay3D,
  StoreInteriorDecor3D,
} from '@/components/3d/StoreNavigation3D';

interface ShopConfig {
  width: number;
  depth: number;
  totalFloors?: number;
}

interface Door {
  _id: string;
  positionX: number;
  positionZ: number;
  width?: number;
  height?: number;
  rotation?: number;
  floor?: number;
  doorType: 'entry' | 'exit';
}

interface Rack {
  _id: string;
  rackName: string;
  positionX: number;
  positionY?: number;
  positionZ: number;
  width?: number;
  height?: number;
  rotation?: number;
  shelves?: number;
  columns?: number;
  floor?: number;
  color?: string;
}

interface Product {
  _id: string;
  productName: string;
  quantity: number;
  price: number;
  category: string;
  shelfNumber?: number;
  columnNumber?: number;
  size?: string;
  weight?: string;
  color?: string;
  brand?: string;
  expiryDate?: string;
  imageUrl?: string;
  image?: string;
  floor?: number;
  rackId?: Rack;
}

const BouncingArrow = ({ height, rackName }: any) => {
  const ref = useRef<any>();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = height / 2 + 1.2 + Math.sin(clock.getElapsedTime() * 3) * 0.25;
    }
  });
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshBasicMaterial color="#EA580C" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshBasicMaterial color="#EA580C" />
      </mesh>
      <Text position={[0, 1.1, 0]} fontSize={0.25} color="#EA580C" fontWeight="bold" anchorX="center" anchorY="bottom">
        {rackName}
      </Text>
    </group>
  );
};

const SupermarketRack = ({ rack, products, isHighlighted, highlightedProductId, setSelectedProduct, searchActive, clickedProductId }: any) => {
  const width = rack.width || 2;
  const height = rack.height || 3;
  const depth = 0.4;
  const shelves = rack.shelves || 4;
  const columns = rack.columns || 3;
  const shelfHeight = height / shelves;
  const columnWidth = width / columns;

  return (
    <group position={[rack.positionX, rack.positionY || 0, rack.positionZ]} rotation={[0, (rack.rotation || 0) * Math.PI / 180, 0]}>
      <AttractiveRackFrame3D
        width={width}
        height={height}
        depth={depth}
        shelves={shelves}
        rackName={rack.rackName}
        color={rack.color || '#EA580C'}
        dimmed={searchActive && !isHighlighted}
        isHighlighted={isHighlighted}
      />

      {products.map((product: Product, index: number) => {
        const shelfIndex = (product.shelfNumber || 1) - 1;
        const columnIndex = (product.columnNumber || 1) - 1;
        if (shelfIndex >= shelves || shelfIndex < 0 || columnIndex >= columns || columnIndex < 0) return null;

        const productX = -width / 2 + columnWidth * (columnIndex + 0.5);
        const productY = -height / 2 + shelfHeight * (shelfIndex + 0.5);
        const productSize = [columnWidth * 0.72, shelfHeight * 0.62, 0.24] as [number, number, number];
        const productColors = ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
        const isProductHighlighted = highlightedProductId === product._id;
        const isClicked = clickedProductId === product._id;
        const productColor = isProductHighlighted ? '#22c55e' : isClicked ? '#f59e0b' : productColors[index % productColors.length];
        const shouldDim = searchActive && !isProductHighlighted && !isClicked;

        return (
          <ProductBoxMesh
            key={product._id}
            product={product}
            position={[productX, productY, 0.06]}
            size={productSize}
            accentColor={productColor}
            glow={isProductHighlighted || isClicked}
            dimmed={shouldDim}
            onClick={() => setSelectedProduct(product)}
          />
        );
      })}

      {isHighlighted && <BouncingArrow height={height} rackName={rack.rackName} />}
    </group>
  );
};

interface CustomerSearchProps {
  isQRMode?: boolean;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ isQRMode = false }) => {
  const [shopName, setShopName] = useState('');
  const [shopSelected, setShopSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [shopConfig, setShopConfig] = useState<ShopConfig>({ width: 30, depth: 20 });
  const [doors, setDoors] = useState<Door[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [rackProducts, setRackProducts] = useState<Record<string, Product[]>>({});
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showArrow, setShowArrow] = useState(false);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);
  const [clickedLegendRackId, setClickedLegendRackId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [shopSuggestions, setShopSuggestions] = useState<string[]>([]);
  const [allShopNames, setAllShopNames] = useState<string[]>([]);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [webglLost, setWebglLost] = useState(false);

  const [shoppingList, setShoppingList] = useState<Product[]>([]);
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(new Set());
  const [showShoppingListPanel, setShowShoppingListPanel] = useState(false);
  const [activeRouteStepIndex, setActiveRouteStepIndex] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState<{ sourceProduct: Product; items: any[] } | null>(null);
  const [modalSuggestions, setModalSuggestions] = useState<any[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchSuggestionsForProduct = useCallback(async (product: Product, showFloatingBanner: boolean = true) => {
    try {
      setLoadingSuggestions(true);
      const shopParam = shopName ? `&shopName=${encodeURIComponent(shopName)}` : '';
      const { data } = await API.get(`/public/suggestions?productId=${product._id}&productName=${encodeURIComponent(product.productName)}${shopParam}&limit=4`);
      if (Array.isArray(data) && data.length > 0) {
        setModalSuggestions(data);
        if (showFloatingBanner) {
          setActiveSuggestion({ sourceProduct: product, items: data });
        }
      } else {
        setModalSuggestions([]);
      }
    } catch (err) {
      console.warn("Failed to fetch suggestions", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [shopName]);

  const availableFloors = useMemo(() => {
    const set = new Set<number>([1]);
    const configuredFloors = Number(shopConfig?.totalFloors) || 1;
    for (let fl = 1; fl <= configuredFloors; fl++) {
      set.add(fl);
    }
    racks.forEach(r => set.add(Number(r.floor) || 1));
    doors.forEach(d => set.add(Number(d.floor) || 1));
    allProducts.forEach(p => {
      if (p.floor) set.add(Number(p.floor));
      if (p.rackId?.floor) set.add(Number(p.rackId.floor));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [racks, doors, allProducts, shopConfig?.totalFloors]);

  const currentFloorRacks = useMemo(() => {
    return racks.filter(r => (Number(r.floor) || 1) === selectedFloor);
  }, [racks, selectedFloor]);

  const currentFloorDoors = useMemo(() => {
    return doors.filter(d => (Number(d.floor) || 1) === selectedFloor);
  }, [doors, selectedFloor]);

  const toggleShoppingListItem = (product: Product) => {
    setShoppingList(prev => {
      const exists = prev.some(p => p._id === product._id);
      if (exists) {
        return prev.filter(p => p._id !== product._id);
      } else {
        fetchSuggestionsForProduct(product, true);
        return [...prev, product];
      }
    });
  };

  const removeFromShoppingList = (productId: string) => {
    setShoppingList(prev => prev.filter(p => p._id !== productId));
    setCompletedItemIds(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const toggleItemCompleted = (productId: string) => {
    setCompletedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const optimizedRoute = useMemo(() => {
    if (shoppingList.length === 0) return [];

    const entryDoor = doors.find(d => d.doorType === 'entry') || { positionX: 0, positionZ: (shopConfig.depth || 20) / 2 };

    const itemsWithPos = shoppingList.map(prod => {
      let x = 0;
      let z = 0;
      let rackName = 'Store Floor';

      if (prod.rackId && typeof prod.rackId === 'object' && prod.rackId.positionX !== undefined) {
        x = prod.rackId.positionX;
        z = prod.rackId.positionZ;
        rackName = prod.rackId.rackName || 'Rack';
      } else {
        const foundRack = racks.find(r => {
          const prods = rackProducts[r._id] || [];
          return prods.some(p => p._id === prod._id);
        });
        if (foundRack) {
          x = foundRack.positionX;
          z = foundRack.positionZ;
          rackName = foundRack.rackName;
        }
      }
      return { product: prod, x, z, rackName };
    });

    const route: typeof itemsWithPos = [];
    const remaining = [...itemsWithPos];
    let currPos = { x: entryDoor.positionX, z: entryDoor.positionZ };

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dx = remaining[i].x - currPos.x;
        const dz = remaining[i].z - currPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const nextItem = remaining.splice(nearestIdx, 1)[0];
      route.push(nextItem);
      currPos = { x: nextItem.x, z: nextItem.z };
    }

    return route;
  }, [shoppingList, doors, racks, rackProducts, shopConfig]);

  const stepDistances = useMemo(() => {
    if (optimizedRoute.length === 0) return [];
    const entryDoor = doors.find(d => d.doorType === 'entry') || { positionX: 0, positionZ: (shopConfig.depth || 20) / 2 };
    let prevX = entryDoor.positionX;
    let prevZ = entryDoor.positionZ;

    return optimizedRoute.map(step => {
      const dx = step.x - prevX;
      const dz = step.z - prevZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      prevX = step.x;
      prevZ = step.z;
      return dist.toFixed(1);
    });
  }, [optimizedRoute, doors, shopConfig]);

  const routePoints = useMemo(() => {
    if (optimizedRoute.length === 0) return [];
    const floorSteps = optimizedRoute.filter(step => (Number(step.product.floor || step.product.rackId?.floor) || 1) === selectedFloor);
    if (floorSteps.length === 0) return [];

    const entryDoor = currentFloorDoors.find(d => d.doorType === 'entry') || doors.find(d => d.doorType === 'entry') || { positionX: 0, positionZ: (shopConfig.depth || 20) / 2 };
    const exitDoor = currentFloorDoors.find(d => d.doorType === 'exit') || doors.find(d => d.doorType === 'exit') || { positionX: 0, positionZ: -(shopConfig.depth || 20) / 2 };

    const pts: [number, number, number][] = [
      [entryDoor.positionX, 0.2, entryDoor.positionZ]
    ];

    floorSteps.forEach(step => {
      pts.push([step.x, 0.5, step.z]);
    });

    pts.push([exitDoor.positionX, 0.2, exitDoor.positionZ]);
    return pts;
  }, [optimizedRoute, doors, currentFloorDoors, selectedFloor, shopConfig]);

  const routeStopLabels = useMemo(() => {
    if (optimizedRoute.length === 0) return [];
    const floorSteps = optimizedRoute.filter(step => (Number(step.product.floor || step.product.rackId?.floor) || 1) === selectedFloor);
    return [
      { label: 'START' },
      ...floorSteps.map(s => ({ label: s.product.productName.slice(0, 14) })),
      { label: 'EXIT / PAY' }
    ];
  }, [optimizedRoute, selectedFloor]);

  const totalRouteDistance = useMemo(() => {
    if (routePoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const dx = routePoints[i + 1][0] - routePoints[i][0];
      const dz = routePoints[i + 1][2] - routePoints[i][2];
      total += Math.hypot(dx, dz);
    }
    return total;
  }, [routePoints]);
  
  const navigate = useNavigate();
  const params = useParams<{ shopName?: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = async (product: Product) => {
    if (!user) { navigate('/login'); return; }
    try {
      await API.post('/cart/add', { productId: product._id, qty: 1 });
      toast({ title: 'Added to Cart', description: `${product.productName} added successfully` });
      fetchSuggestionsForProduct(product, true);
    } catch {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not add to cart' });
    }
  };

  const handleAddToWishlist = async (product: Product) => {
    if (!user) { navigate('/login'); return; }
    try {
      await API.post('/wishlist/add', { productId: product._id });
      toast({ title: 'Saved to Wishlist', description: `${product.productName} added to wishlist` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not add to wishlist' });
    }
  };

  const initRef = useRef(false);

  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    const urlShop = params.shopName || searchParams.get('shop') || searchParams.get('shopName');
    if (urlShop && urlShop !== 'null' && urlShop !== 'undefined') {
      setShopName(urlShop);
      loadShopData(urlShop);
      return () => window.removeEventListener('resize', handleResize);
    }

    setIsLoading(true);
    API.get('/shop-config/public/shops/list')
      .then(({ data }) => {
        const validShops = (Array.isArray(data) ? data : []).filter(
          (s): s is string => typeof s === 'string' && s.trim() !== '' && s !== 'null' && s !== 'undefined'
        );
        setAllShopNames(validShops);

        let initialShop = '';
        if (user?.role === 'shopper' && user.preferredShops && user.preferredShops.length > 0) {
          const pref = user.preferredShops.find(s => typeof s === 'string' && s.trim() !== '' && s !== 'null' && s !== 'undefined');
          if (pref) initialShop = pref;
        }

        if (!initialShop && user?.shopName && user.role !== 'shopper' && user.shopName !== 'null' && user.shopName !== 'undefined') {
          initialShop = user.shopName;
        }

        if (!initialShop && validShops.length > 0) {
          initialShop = validShops[0];
        }

        if (initialShop) {
          setShopName(initialShop);
          loadShopData(initialShop);
        } else {
          setIsLoading(false);
          toast({ variant: 'destructive', title: 'No stores found', description: 'No active stores found in the system.' });
        }
      })
      .catch(() => {
        setIsLoading(false);
        toast({ variant: 'destructive', title: 'Connection Error', description: 'Please ensure the backend is active.' });
      });

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadShopData = async (name: string) => {
    if (!name || typeof name !== 'string' || name === 'null' || name === 'undefined' || !name.trim()) {
      setIsLoading(false);
      return;
    }

    setDoors([]);
    setRacks([]);
    setRackProducts({});
    setAllProducts([]);
    setIsLoading(true);

    try {

      const [configRes, doorsRes, racksRes] = await Promise.all([
        API.get(`/shop-config/public/${name}`),
        API.get(`/doors/public/${name}`),
        API.get(`/public/racks/${name}`)
      ]);
      
      if (configRes.data) {
        setShopConfig({
          width: configRes.data.width || 30,
          depth: configRes.data.depth || 20,
          totalFloors: configRes.data.totalFloors || 1
        });
      }
      setDoors(doorsRes.data || []);
      const racksList = racksRes.data || [];
      setRacks(racksList);

      const productsMap: Record<string, Product[]> = {};
      const allProductsList: Product[] = [];
      racksList.forEach((rack: Rack) => {
        productsMap[rack._id] = [];
      });

      const rackPromises = racksList.map((rack: Rack) => 
        API.get(`/public/products/rack/${rack._id}`)
          .then(res => ({ rackId: rack._id, data: res.data }))
      );

      const rackResults = await Promise.allSettled(rackPromises);
      rackResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          productsMap[result.value.rackId] = result.value.data;
          allProductsList.push(...result.value.data);
        } else {
          console.error("Rack API Error:", result.reason);
        }
      });

      setRackProducts(productsMap);
      setAllProducts(allProductsList);
      setShopSelected(true);
      
      setIsLoading(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load shop environment.' });
      setIsLoading(false);
    }
  };

  const autoLoadShop = async (name: string) => {
    await loadShopData(name);
  };

  const handleShopNameInput = (value: string) => {
    setShopName(value);
  };

  const handleShopSelect = async () => {
    if (!shopName) return;
    await loadShopData(shopName);
  };

  const handleProductClick = (product: Product) => {
    const prodFloor = Number(product.floor || product.rackId?.floor) || 1;
    if (prodFloor !== selectedFloor) {
      setSelectedFloor(prodFloor);
      toast({
        title: `🏢 Switched to Floor ${prodFloor}`,
        description: `${product.productName} is located on Floor ${prodFloor} (${product.rackId?.rackName || 'Rack'})`
      });
    }
    setSelectedProduct(product);
    setClickedProductId(product._id);
    fetchSuggestionsForProduct(product, false);
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      setFoundProduct(null);
      setNotFound(false);
      setShowArrow(false);
      return;
    }
    try {
      const { data } = await API.get(`/public/search?query=${searchQuery}&shopName=${shopName}`);
      if (data.length > 0) {
        const prod = data[0];
        setFoundProduct(prod);
        setNotFound(false);
        setShowArrow(true);
        setFilteredProducts([]);
        const prodFloor = Number(prod.floor || prod.rackId?.floor) || 1;
        if (prodFloor !== selectedFloor) {
          setSelectedFloor(prodFloor);
          toast({
            title: `🏢 Switched to Floor ${prodFloor}`,
            description: `${prod.productName} is located on Floor ${prodFloor} (${prod.rackId?.rackName || 'Rack'})`
          });
        }
        fetchSuggestionsForProduct(prod, true);
        setTimeout(() => setShowArrow(false), 20000);
      } else {
        setFoundProduct(null);
        setNotFound(true);
        setShowArrow(false);
      }
    } catch (error) {
      setNotFound(true);
      setShowArrow(false);
    }
  };

  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const shopParam = shopName ? `&shopName=${encodeURIComponent(shopName)}` : '';
        const firstMatch = allProducts.find(p => p.productName.toLowerCase().includes(q.toLowerCase()));
        const idParam = firstMatch ? `&productId=${firstMatch._id}` : '';
        const { data } = await API.get(
          `/public/suggestions?productName=${encodeURIComponent(firstMatch?.productName || q)}${idParam}${shopParam}&limit=4`
        );
        if (Array.isArray(data)) {
          setSearchSuggestions(data);
        }
      } catch {
        setSearchSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, shopName, allProducts]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setNotFound(false);
    setShowAllProducts(true);
    if (value.trim()) {
      const filtered = allProducts.filter(p =>
        p.productName.toLowerCase().includes(value.toLowerCase()) ||
        p.category.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      // Show all products when input is empty but focused
      setFilteredProducts(allProducts);
      setFoundProduct(null);
      setShowArrow(false);
    }
  };

  const handleSearchBlur = () => {
    // Delay so click on dropdown item registers first
    setTimeout(() => {
      setShowAllProducts(false);
      if (!searchQuery) setFilteredProducts([]);
    }, 200);
  };

  return (
    <div className="relative flex flex-col overflow-hidden bg-slate-50 h-full w-full">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md rounded-3xl"
            style={{ pointerEvents: 'none' }}
          >
            {/* Skeleton store layout */}
            <div className="w-full max-w-md px-8 space-y-5">
              {/* Header skeleton */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-lg bg-slate-200 animate-pulse" />
                  <div className="h-3 w-20 rounded-lg bg-slate-100 animate-pulse" />
                </div>
              </div>
              {/* Rack skeletons */}
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="h-20 rounded-2xl bg-slate-200 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
                    <div className="h-3 w-3/4 rounded-lg bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
                  </div>
                ))}
              </div>
              {/* Bottom bar skeleton */}
              <div className="flex gap-3">
                <div className="h-10 flex-1 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-10 w-24 rounded-xl bg-slate-100 animate-pulse" />
              </div>
              {/* Loading label */}
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                Loading store...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-50 bg-white shadow-sm border-b border-slate-100 shrink-0"
        style={{ padding: isMobile ? '8px 12px' : '14px 24px' }}
      >
        <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
          <div className="relative">
            {isQRMode || params.shopName ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800">
                <QrCode size={16} className="text-orange-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">In-Store 3D Navigator</span>
                <span className="text-[10px] font-bold text-slate-300">| {shopName}</span>
              </div>
            ) : (
              <button
                onClick={() => setShowShopDropdown(!showShopDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100/50 hover:bg-orange-100 transition-all group"
              >
                <Store size={16} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">{shopName || 'Select Store'}</span>
                <ChevronRight size={14} className={`transition-transform duration-300 ${showShopDropdown ? 'rotate-90' : ''}`} />
              </button>
            )}
            <AnimatePresence>
              {showShopDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-[70] overflow-hidden"
                >
                  <div className="p-2 border-b border-slate-50">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-2">Active Neighborhoods</p>
                  </div>
                  {(user?.role === 'shopper' ? (user.preferredShops || []) : allShopNames).map((name) => (
                    <button
                      key={name}
                      onClick={() => { setShopName(name); autoLoadShop(name); setShowShopDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left ${shopName === name ? 'text-orange-600' : 'text-slate-600'}`}
                    >
                      <div className={`h-2 w-2 rounded-full ${shopName === name ? 'bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.5)]' : 'bg-slate-200'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div />
        </div>

        <div className="relative flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isMobile ? "Search products..." : "Search for a product to locate on the map..."}
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => { setShowAllProducts(true); setFilteredProducts(searchQuery.trim() ? filteredProducts : allProducts); }}
              onBlur={handleSearchBlur}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all shadow-inner"
            />
            <AnimatePresence>
              {showAllProducts && filteredProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 overflow-hidden z-[60] shadow-lg"
                  style={{ maxHeight: '320px', overflowY: 'auto' }}
                >
                  {searchQuery === '' && (
                    <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All Products ({filteredProducts.length})</p>
                    </div>
                  )}
                  {filteredProducts.map((product, idx) => {
                    const inRoute = shoppingList.some(p => p._id === product._id);
                    return (
                      <div
                        key={product._id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(product.productName);
                          setFilteredProducts([]);
                          setShowAllProducts(false);
                          const prodFloor = Number(product.floor || product.rackId?.floor) || 1;
                          if (prodFloor !== selectedFloor) {
                            setSelectedFloor(prodFloor);
                            toast({
                              title: `🏢 Switched to Floor ${prodFloor}`,
                              description: `${product.productName} is on Floor ${prodFloor} (${product.rackId?.rackName || 'Rack'})`
                            });
                          }
                          setTimeout(() => handleSearch(), 50);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50/60 transition-colors text-left cursor-pointer"
                        style={{ borderBottom: idx < filteredProducts.length - 1 ? '1px solid #f8fafc' : 'none' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {product.imageUrl || product.image ? (
                            <img
                              src={product.imageUrl || product.image}
                              alt={product.productName}
                              className="h-9 w-9 rounded-lg object-cover shrink-0 border border-slate-100 bg-white"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                              <Package size={14} className="text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{product.productName}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{product.category} • ₹{product.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-wider rounded border border-orange-100">
                            Floor {product.floor || product.rackId?.floor || 1}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded">
                            {product.rackId?.rackName || 'Store'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShoppingListItem(product);
                              toast({ title: inRoute ? 'Removed from Route' : '✓ Added to Shortest Path Route', description: `${product.productName}` });
                            }}
                            className={`h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${
                              inRoute
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm active:scale-95'
                            }`}
                          >
                            <Plus size={11} className={inRoute ? 'rotate-45' : ''} />
                            {inRoute ? 'In Route' : 'Add Route'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {searchQuery.trim().length >= 2 && searchSuggestions.length > 0 && (
                    <div className="border-t-2 border-orange-100 bg-gradient-to-b from-orange-50/70 to-amber-50/30 p-3">
                      <div className="flex items-center gap-1.5 mb-2 px-1">
                        <Sparkles size={12} className="text-orange-500" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-orange-600">
                          Recommended With "{searchQuery.trim()}" — Add to Route
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {searchSuggestions.map((sug: any) => {
                          const sugInRoute = shoppingList.some(p => p._id === sug._id);
                          return (
                            <div
                              key={`search-sug-${sug._id}`}
                              onMouseDown={(e) => e.preventDefault()}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-orange-100 shadow-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {sug.imageUrl || sug.image ? (
                                  <img
                                    src={sug.imageUrl || sug.image}
                                    alt={sug.productName}
                                    className="h-7 w-7 rounded-lg object-cover shrink-0 border border-orange-100"
                                  />
                                ) : (
                                  <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                    <Package size={12} className="text-orange-400" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{sug.productName}</p>
                                  <p className="text-[9px] font-bold text-orange-600 truncate">
                                    ₹{sug.price} • Floor {sug.floor || sug.rackId?.floor || 1}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleShoppingListItem(sug);
                                  toast({
                                    title: sugInRoute ? 'Removed from Route' : '✓ Added Recommended Item to Route',
                                    description: `${sug.productName}`,
                                  });
                                }}
                                className={`h-6 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 transition-all ${
                                  sugInRoute
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                              >
                                <Plus size={9} className={sugInRoute ? 'rotate-45' : ''} />
                                {sugInRoute ? 'In Route' : 'Route'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            disabled={isLoading}
            className="h-12 px-5 sm:px-6 rounded-2xl border-none text-white font-black text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 hover:border-slate-200 hover:shadow-orange-500/30 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)' }}
          >
            <Search size={16} />
            {!isMobile && <span>Find</span>}
          </motion.button>
        </div>
      </motion.div>

      <div className={`relative overflow-hidden w-full ${isMobile ? 'h-[75vh]' : 'flex-1 min-h-[500px]'}`} style={{ margin: 0 }}>
        {/* Floating Store Floor Switcher Bar */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/80 shadow-lg">
          <div className="flex items-center gap-1.5 px-2 text-slate-500">
            <Layers size={13} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Store Floor</span>
          </div>
          {availableFloors.map(fl => {
            const isActive = selectedFloor === fl;
            const floorRackCount = racks.filter(r => (Number(r.floor) || 1) === fl).length;
            return (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>🏢 {fl === 1 ? 'Floor 1 (Ground)' : `Floor ${fl}`}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded ${isActive ? 'bg-black/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {floorRackCount}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-5 py-3 bg-rose-500 text-white rounded-2xl shadow-sm shadow-rose-500/30 text-sm font-bold"
            >
              <AlertCircle size={16} /> Product not found in store
            </motion.div>
          )}
          {foundProduct && showArrow && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-5 py-3 bg-emerald-500 text-white rounded-2xl shadow-sm shadow-emerald-500/30 text-sm font-bold"
            >
              <MapPin size={16} /> Found in <span className="font-black italic">{foundProduct.rackId?.rackName}</span> (Floor {foundProduct.floor || foundProduct.rackId?.floor || 1})
            </motion.div>
          )}
        </AnimatePresence>

        {!isMobile && currentFloorRacks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-slate-100/80 max-h-[280px] overflow-y-auto"
          >
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              Floor {selectedFloor} Racks ({currentFloorRacks.length})
            </p>
            <div className="space-y-2">
              {currentFloorRacks.map((rack, i) => (
                <div 
                  key={rack._id} 
                  className="flex items-center gap-2.5 group cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                  onClick={() => {
                    setClickedLegendRackId(rack._id);
                    setTimeout(() => {
                      setClickedLegendRackId(current => current === rack._id ? null : current);
                    }, 5000);
                  }}
                >
                  <div
                    className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm ring-2 ring-white group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: rack.color || ['#EA580C', '#10B981', '#8B5CF6', '#06B6D4', '#F43F5E', '#F59E0B'][i % 6] }}
                  />
                  <span className={`text-[11px] font-bold truncate transition-colors ${clickedLegendRackId === rack._id ? 'text-primary' : 'text-slate-600'}`}>{rack.rackName}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

          <Canvas
            shadows={!isMobile}
            frameloop={shoppingList.length > 0 || showArrow ? 'always' : 'demand'}
            performance={{ min: 0.5 }}
            camera={{
              position: isMobile ? [0, 22, 22] : [0, 13, 19],
              fov: isMobile ? 55 : 46
            }}
            style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ede7dc 100%)' }}
            gl={{ 
              antialias: false, 
              powerPreference: 'default', 
              failIfMajorPerformanceCaveat: false, 
              stencil: false,
              alpha: false,
              depth: true
            }}
            dpr={isMobile ? 1 : [1, 1.1]}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                console.warn('WebGL context lost — showing recovery UI');
                setWebglLost(true);
              });
              canvas.addEventListener('webglcontextrestored', () => {
                console.info('WebGL context restored');
                setWebglLost(false);
              });
            }}
          >
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#ffffff', '#e7dfd3', 0.65]} />
            <directionalLight position={[12, 22, 14]} intensity={1.05} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
            <pointLight position={[0, 4.2, 0]} intensity={0.4} color="#fffbeb" />

            {/* Warm cream/ivory ceramic tile showroom floor */}
            <CreamTileFloor3D
              width={shopConfig?.width || 30}
              depth={shopConfig?.depth || 20}
            />

            <StoreDimensionsOverlay3D
              width={shopConfig?.width || 30}
              depth={shopConfig?.depth || 20}
              floor={selectedFloor}
            />
            <StoreInteriorDecor3D
              width={shopConfig?.width || 30}
              depth={shopConfig?.depth || 20}
              shopName={shopName || 'SOHO'}
              exitPosition={
                (() => {
                  const ex = currentFloorDoors.find(d => d.doorType === 'exit') || doors.find(d => d.doorType === 'exit');
                  return ex ? [ex.positionX, ex.positionZ] : undefined;
                })()
              }
            />
            <ContactShadows frames={1} resolution={isMobile ? 256 : 512} scale={shopConfig?.width || 30} blur={2} opacity={0.14} far={10} color="#0f172a" />

            {currentFloorDoors.map((door) => {
              const dWidth = door.width || 1.8;
              const dHeight = door.height || 2.6;
              const dColor = door.doorType === 'entry' ? '#10b981' : '#f43f5e';
              return (
                <group key={door._id} position={[door.positionX, 0, door.positionZ]} rotation={[0, (door.rotation || 0) * Math.PI / 180, 0]}>
                  {/* Floor welcome/exit zone mat */}
                  <Plane args={[dWidth + 0.6, 1.2]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                    <meshBasicMaterial color={dColor} transparent opacity={0.28} />
                  </Plane>
                  {/* Door side pillars */}
                  <Box args={[0.14, dHeight, 0.22]} position={[-dWidth / 2, dHeight / 2, 0]}>
                    <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
                  </Box>
                  <Box args={[0.14, dHeight, 0.22]} position={[dWidth / 2, dHeight / 2, 0]}>
                    <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
                  </Box>
                  {/* Glowing overhead portal header */}
                  <Box args={[dWidth + 0.3, 0.35, 0.24]} position={[0, dHeight + 0.15, 0]}>
                    <meshStandardMaterial color={dColor} emissive={dColor} emissiveIntensity={0.6} />
                  </Box>
                  {/* Glass door leaf */}
                  <Box args={[dWidth - 0.1, dHeight - 0.1, 0.06]} position={[0, dHeight / 2, 0]}>
                    <meshStandardMaterial color={dColor} transparent opacity={0.25} />
                  </Box>
                  <Text
                    position={[0, dHeight + 0.55, 0]}
                    fontSize={0.3}
                    color="white"
                    outlineWidth={0.02}
                    outlineColor="#0f172a"
                    fontWeight="bold"
                    anchorY="bottom"
                  >
                    {door.doorType === 'entry' ? 'ENTRANCE' : 'EXIT / CHECKOUT'}
                  </Text>
                </group>
              );
            })}

            {currentFloorRacks.map((rack) => (
              <SupermarketRack
                key={rack._id}
                rack={rack}
                products={rackProducts[rack._id] || []}
                isHighlighted={(showArrow && foundProduct && foundProduct.rackId?._id === rack._id) || clickedLegendRackId === rack._id}
                highlightedProductId={foundProduct?._id}
                setSelectedProduct={handleProductClick}
                searchActive={showArrow}
                clickedProductId={clickedProductId}
              />
            ))}

            <GoogleMapsRoute3D
              points={routePoints}
              activeStepIndex={activeRouteStepIndex}
              stopLabels={routeStopLabels}
            />

            <OrbitControls
              maxPolarAngle={Math.PI / 2.1}
              minDistance={5}
              maxDistance={40}
              target={[0, 0, 0]}
              enableDamping
              dampingFactor={0.05}
            />
            <Environment preset="apartment" />
          </Canvas>

        {/* WebGL Context Lost Recovery */}
        {webglLost && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 text-center max-w-xs shadow-xl">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                <AlertCircle size={28} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">3D View Interrupted</h3>
              <p className="text-sm text-slate-500 mb-5">The 3D renderer lost context. This can happen with heavy GPU usage.</p>
              <button
                onClick={() => setWebglLost(false)}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 mb-2"
              >
                Dismiss
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full h-10 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs uppercase tracking-widest hover:bg-orange-100 transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>
        )}
        {/* Google Maps-style Live Dimensions & Route HUD */}
        <div className="absolute bottom-6 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          {shoppingList.length > 0 && totalRouteDistance > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-sky-200 rounded-2xl px-4 py-3 shadow-xl text-slate-900 max-w-xs"
            >
              <div className="flex items-center gap-2 text-sky-600 text-[10px] font-black uppercase tracking-widest mb-1">
                <Route size={13} />
                <span>Google Maps Route • Floor {selectedFloor}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900">{totalRouteDistance.toFixed(1)} m</span>
                <span className="text-xs font-bold text-emerald-600">
                  (~{Math.max(5, Math.round(totalRouteDistance / 1.2))}s walk)
                </span>
              </div>
              {optimizedRoute[activeRouteStepIndex] && (
                <p className="text-[10px] font-bold text-slate-500 mt-1 truncate">
                  Next: <span className="text-orange-600">{optimizedRoute[activeRouteStepIndex].product.productName}</span> ({optimizedRoute[activeRouteStepIndex].rackName})
                </p>
              )}
            </motion.div>
          )}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-600 uppercase tracking-wider w-fit shadow-sm">
            📐 Floor {selectedFloor}: {shopConfig?.width || 30}m × {shopConfig?.depth || 20}m
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-sm"
            onClick={() => { setSelectedProduct(null); setClickedProductId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
              style={{ width: isMobile ? '92vw' : '380px', maxWidth: '420px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setSelectedProduct(null); setClickedProductId(null); }}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
              >
                <X size={14} />
              </button>

              <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white">
                {(selectedProduct.imageUrl || selectedProduct.image) && (
                  <div className="relative w-full h-48 bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm mb-4 group">
                    <img
                      src={selectedProduct.imageUrl || selectedProduct.image}
                      alt={selectedProduct.productName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <span>🏢 Floor {selectedProduct.floor || selectedProduct.rackId?.floor || 1}</span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-emerald-500/90 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-black shadow-sm">
                      ₹{selectedProduct.price}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {!(selectedProduct.imageUrl || selectedProduct.image) && (
                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm shadow-orange-100 flex items-center justify-center shrink-0 border border-orange-100/50">
                      <Package size={24} className="text-orange-500" />
                    </div>
                  )}
                  <div className="min-w-0 pt-1">
                    <h3 className="text-lg font-black text-slate-900 leading-tight pr-8 tracking-tight">{selectedProduct.productName}</h3>
                    {!(selectedProduct.imageUrl || selectedProduct.image) && (
                      <p className="text-2xl font-black text-orange-600 italic mt-1">₹{selectedProduct.price}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100/60">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                    <p className="text-sm font-bold text-slate-800">{selectedProduct.category}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100/60">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                    <p className={`text-sm font-bold ${selectedProduct.quantity < 5 ? 'text-rose-500' : 'text-slate-800'}`}>{selectedProduct.quantity} units</p>
                  </div>
                  <div className="col-span-2 bg-orange-50/60 rounded-xl p-3.5 border border-orange-100/50 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <MapPin size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Store Location</p>
                      <p className="text-sm font-bold text-slate-800">
                        Floor {selectedProduct.floor || selectedProduct.rackId?.floor || 1} • {selectedProduct.rackId?.rackName || 'Rack'} • Shelf {selectedProduct.shelfNumber || 1}
                      </p>
                    </div>
                  </div>
                  {selectedProduct.brand && (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100/60">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Brand</p>
                      <p className="text-sm font-bold text-slate-800">{selectedProduct.brand}</p>
                    </div>
                  )}
                  {selectedProduct.size && (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100/60">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Size</p>
                      <p className="text-sm font-bold text-slate-800">{selectedProduct.size}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      toggleShoppingListItem(selectedProduct);
                      toast({ title: '✓ Added to In-Store Shopping List', description: `${selectedProduct.productName} added to shortest path route` });
                    }}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:from-orange-600 hover:to-amber-700 transition-all active:scale-95 shadow-md"
                  >
                    <Route size={16} />
                    {shoppingList.some(p => p._id === selectedProduct._id) ? '✓ Added to Route' : '+ Add to Shortest Path Route'}
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAddToCart(selectedProduct)}
                      className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                    <button
                      onClick={() => handleAddToWishlist(selectedProduct)}
                      className="h-14 w-14 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center active:scale-95"
                    >
                      <Heart size={20} />
                    </button>
                  </div>
                </div>

                {modalSuggestions.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Sparkles size={14} className="text-orange-500 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                        Frequently Paired Together
                      </p>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {modalSuggestions.map((sug) => {
                        const inRoute = shoppingList.some(p => p._id === sug._id);
                        return (
                          <div
                            key={sug._id}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-orange-50/50 border border-orange-100/70 hover:bg-orange-50 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {sug.imageUrl ? (
                                <img src={sug.imageUrl} alt={sug.productName} className="h-10 w-10 rounded-xl object-cover shrink-0 border border-orange-100" />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-orange-100">
                                  <Package size={16} className="text-orange-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">{sug.productName}</p>
                                <p className="text-[9px] font-bold text-orange-600 truncate">
                                  ₹{sug.price} • Floor {sug.floor || sug.rackId?.floor || 1} • {sug.rackId?.rackName || 'Rack'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => {
                                  toggleShoppingListItem(sug);
                                  toast({
                                    title: inRoute ? 'Removed from Route' : '✓ Added to Shortest Path Route',
                                    description: `${sug.productName}`
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                  inRoute
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm active:scale-95'
                                }`}
                              >
                                <Plus size={10} className={inRoute ? 'rotate-45' : ''} />
                                {inRoute ? 'In Route' : 'Route'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(sug)}
                                className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center active:scale-95 shadow-sm"
                                title="Add to Cart"
                              >
                                <ShoppingCart size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Smart Suggestion Drawer */}
      <AnimatePresence>
        {activeSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[75] w-[95vw] max-w-xl bg-white/95 backdrop-blur-2xl border-2 border-orange-300 rounded-[2rem] shadow-2xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Added {activeSuggestion.sourceProduct.productName}! Suggested Next:
                  </h4>
                  <p className="text-[9px] font-bold text-orange-600">
                    Frequently bought together — add to your route or cart
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSuggestion(null)}
                className="h-7 w-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeSuggestion.items.slice(0, 4).map((sug: any) => {
                const inRoute = shoppingList.some(p => p._id === sug._id);
                return (
                  <div
                    key={sug._id}
                    className="flex items-center justify-between p-2.5 bg-orange-50/50 hover:bg-orange-50/90 rounded-2xl border border-orange-100 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {sug.imageUrl ? (
                        <img src={sug.imageUrl} alt={sug.productName} className="h-10 w-10 rounded-xl object-cover shrink-0 border border-orange-100" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-orange-100">
                          <Package size={16} className="text-orange-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{sug.productName}</p>
                        <p className="text-[10px] font-bold text-orange-600 mt-0.5">
                          ₹{sug.price} • Floor {sug.floor || sug.rackId?.floor || 1}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleShoppingListItem(sug);
                          toast({
                            title: inRoute ? 'Removed from Route' : '✓ Added to Shortest Path Route',
                            description: `${sug.productName}`
                          });
                        }}
                        className={`h-7 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                          inRoute
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm active:scale-95'
                        }`}
                      >
                        <Plus size={10} className={inRoute ? 'rotate-45' : ''} />
                        {inRoute ? 'In' : 'Route'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(sug)}
                        className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center active:scale-95 shadow-sm"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Shortest Route Button & Panel */}
      <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-3 max-w-sm w-full pointer-events-none">
        {/* Route Drawer Panel */}
        <AnimatePresence>
          {showShoppingListPanel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2rem] shadow-2xl p-5 pointer-events-auto flex flex-col max-h-[75vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
                    <Route size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Shortest Shopping Path</h3>
                    <p className="text-[10px] font-bold text-sky-600">
                      {totalRouteDistance > 0
                        ? `Total: ${totalRouteDistance.toFixed(1)} m • ~${Math.max(5, Math.round(totalRouteDistance / 1.2))}s walk`
                        : 'Entry Gate → Items → Exit Gate'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShoppingListPanel(false)}
                  className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Waypoint steps */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {/* Entry door */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 font-black text-xs">
                    🚪
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-wider">Start: Entry Gate</p>
                    <p className="text-[9px] font-bold text-emerald-600">Enter store floor</p>
                  </div>
                </div>

                {/* Optimized item stops */}
                {optimizedRoute.map((step, idx) => {
                  const isCompleted = completedItemIds.has(step.product._id);
                  const isCurrentTarget = idx === activeRouteStepIndex && !isCompleted;

                  return (
                    <div
                      key={`route-step-${step.product._id}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : isCurrentTarget
                          ? 'bg-orange-50 border-orange-200 shadow-sm ring-2 ring-orange-400/30'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        setActiveRouteStepIndex(idx);
                        setFoundProduct(step.product);
                        setShowArrow(true);
                        const stepFloor = Number(step.product.floor || step.product.rackId?.floor) || 1;
                        if (stepFloor !== selectedFloor) {
                          setSelectedFloor(stepFloor);
                          toast({
                            title: `🏢 Switched to Floor ${stepFloor}`,
                            description: `${step.product.productName} is on Floor ${stepFloor}`
                          });
                        }
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemCompleted(step.product._id);
                        }}
                        className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 hover:border-orange-500'
                        }`}
                      >
                        {isCompleted && <Check size={14} strokeWidth={3} />}
                      </button>

                      {step.product.imageUrl || step.product.image ? (
                        <img
                          src={step.product.imageUrl || step.product.image}
                          alt={step.product.productName}
                          className="h-9 w-9 rounded-lg object-cover shrink-0 border border-slate-100 bg-white"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                          <Package size={14} className="text-slate-400" />
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Stop {idx + 1}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100">
                            Floor {step.product.floor || step.product.rackId?.floor || 1}
                          </span>
                          <p className={`text-xs font-black truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {step.product.productName}
                          </p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                          <span>{step.rackName} • Shelf {step.product.shelfNumber || 1}</span>
                          {stepDistances[idx] !== undefined && (
                            <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100/60">
                              {stepDistances[idx]}m away
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromShoppingList(step.product._id);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}

                {/* Exit door */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800">
                  <div className="h-7 w-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 font-black text-xs">
                    🏁
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-wider">Finish: Exit Gate</p>
                    <p className="text-[9px] font-bold text-rose-600">Proceed to checkout counter</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {completedItemIds.size} of {shoppingList.length} items collected
                </span>
                <button
                  onClick={() => {
                    setShoppingList([]);
                    setCompletedItemIds(new Set());
                    setShowShoppingListPanel(false);
                  }}
                  className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest"
                >
                  Clear Route
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Route Trigger Button */}
        <button
          onClick={() => setShowShoppingListPanel(!showShoppingListPanel)}
          className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 border border-slate-700"
        >
          <Route size={18} className="text-orange-500 animate-pulse" />
          <span>Shortest Path Route ({shoppingList.length})</span>
          {shoppingList.length > 0 && (
            <span className="h-5 px-2 rounded-full bg-orange-500 text-white font-black text-[10px] flex items-center justify-center">
              {shoppingList.length}
            </span>
          )}
        </button>
      </div>

    </div>
  );
};

export default CustomerSearch;
