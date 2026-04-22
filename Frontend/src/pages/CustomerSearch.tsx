import React, { useState, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Text, Plane, Environment, ContactShadows } from '@react-three/drei';
import API from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Package, AlertCircle, X, ShoppingCart, Heart, Store, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ShopConfig {
  width: number;
  depth: number;
}

interface Door {
  _id: string;
  positionX: number;
  positionZ: number;
  width?: number;
  height?: number;
  rotation?: number;
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
  rackId?: Rack;
}

const GlowBox = ({ args, color, glow, dimmed }: any) => {
  const ref = useRef<any>();
  useFrame(({ clock }) => {
    if (ref.current && glow) {
      ref.current.emissiveIntensity = 1.5 + Math.sin(clock.getElapsedTime() * 4) * 1.0;
    }
  });
  return (
    <Box args={args} castShadow>
      <meshStandardMaterial ref={ref} color={glow ? '#22c55e' : dimmed ? '#1e293b' : color} emissive={glow ? '#22c55e' : color} emissiveIntensity={glow ? 1.5 : dimmed ? 0 : 0.2} transparent opacity={dimmed ? 0.15 : 1} />
    </Box>
  );
};

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
  const depth = 0.3;
  const shelves = rack.shelves || 4;
  const columns = rack.columns || 3;
  const shelfHeight = height / shelves;
  const columnWidth = width / columns;

  return (
    <group position={[rack.positionX, rack.positionY || 0, rack.positionZ]} rotation={[0, (rack.rotation || 0) * Math.PI / 180, 0]}>
      <Box args={[width, height, depth]} castShadow>
        <meshStandardMaterial color="#f1f5f9" transparent opacity={searchActive && !isHighlighted ? 0.04 : 0.08} depthWrite={false} />
      </Box>

      <group position={[0, height / 2 + 0.3, 0.16]}>
        <Box args={[width * 0.9, 0.4, 0.05]}>
          <meshStandardMaterial color={searchActive && !isHighlighted ? '#334155' : rack.color || '#EA580C'} emissive={searchActive && !isHighlighted ? '#000' : rack.color || '#EA580C'} emissiveIntensity={searchActive && !isHighlighted ? 0 : 0.3} />
        </Box>
        <Text position={[0, 0, 0.03]} fontSize={0.2} color={searchActive && !isHighlighted ? '#475569' : '#000000'} fontWeight="900" anchorX="center" anchorY="middle">
          {rack.rackName.toUpperCase()}
        </Text>
      </group>

      {Array.from({ length: shelves }).map((_, shelfIndex) => {
        const shelfY = -height / 2 + shelfHeight * (shelfIndex + 0.5);
        return (
          <group key={`shelf-${shelfIndex}`}>
            <Plane args={[width, depth]} position={[0, shelfY - shelfHeight / 2, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#cbd5e1" transparent opacity={0.1} depthWrite={false} />
            </Plane>
          </group>
        );
      })}

      {products.map((product: Product, index: number) => {
        const shelfIndex = (product.shelfNumber || 1) - 1;
        const columnIndex = (product.columnNumber || 1) - 1;
        if (shelfIndex >= shelves || shelfIndex < 0 || columnIndex >= columns || columnIndex < 0) return null;

        const productX = -width / 2 + columnWidth * (columnIndex + 0.5);
        const productY = -height / 2 + shelfHeight * (shelfIndex + 0.5);
        const productSize = [columnWidth * 0.7, shelfHeight * 0.6, 0.2] as [number, number, number];
        const productColors = ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
        const isProductHighlighted = highlightedProductId === product._id;
        const isClicked = clickedProductId === product._id;
        const productColor = isProductHighlighted ? '#22c55e' : isClicked ? '#f59e0b' : productColors[index % productColors.length];
        const shouldDim = searchActive && !isProductHighlighted && !isClicked;

        return (
          <group key={product._id} position={[productX, productY, 0.15]} onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}>
            <GlowBox args={productSize} color={productColor} glow={isProductHighlighted || isClicked} dimmed={shouldDim} />
            <Text position={[0, productSize[1] / 2 + 0.08, 0.12]} fontSize={0.12} color="white" fontWeight="bold" anchorX="center" anchorY="bottom" maxWidth={productSize[0]}>
              {product.productName}
            </Text>
          </group>
        );
      })}

      {isHighlighted && <BouncingArrow height={height} rackName={rack.rackName} />}
    </group>
  );
};

const CustomerSearch: React.FC = () => {
  const [shopName, setShopName] = useState('');
  const [shopSelected, setShopSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [shopConfig, setShopConfig] = useState<ShopConfig>({ width: 30, depth: 20 });
  const [doors, setDoors] = useState<Door[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [rackProducts, setRackProducts] = useState<Record<string, Product[]>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showArrow, setShowArrow] = useState(false);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [shopSuggestions, setShopSuggestions] = useState<string[]>([]);
  const [allShopNames, setAllShopNames] = useState<string[]>([]);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [view2D, setView2D] = useState(false);
  const [webglLost, setWebglLost] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = async (product: Product) => {
    if (!user) { navigate('/login'); return; }
    try {
      await API.post('/cart/add', { productId: product._id, qty: 1 });
      toast({ title: '✓ Added to Cart', description: `${product.productName} added successfully` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not add to cart' });
    }
  };

  const handleAddToWishlist = async (product: Product) => {
    if (!user) { navigate('/login'); return; }
    try {
      await API.post('/wishlist/add', { productId: product._id });
      toast({ title: '✓ Saved to Wishlist', description: `${product.productName} added to wishlist` });
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

    setIsLoading(true);
    API.get('/shop-config/public/shops/list')
      .then(({ data }) => {
        setAllShopNames(data);
        if (data && data.length > 0) {
          setShopName(data[0]);
          loadShopData(data[0]);
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
          depth: configRes.data.depth || 20
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
    setSelectedProduct(product);
    setClickedProductId(product._id);
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
        setFoundProduct(data[0]);
        setNotFound(false);
        setShowArrow(true);
        setFilteredProducts([]);
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
            <button
              onClick={() => setShowShopDropdown(!showShopDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100/50 hover:bg-orange-100 transition-all group"
            >
              <Store size={16} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">{shopName || 'Select Store'}</span>
              <ChevronRight size={14} className={`transition-transform duration-300 ${showShopDropdown ? 'rotate-90' : ''}`} />
            </button>
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
                  {allShopNames.map((name) => (
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

          <button
            onClick={() => setView2D(!view2D)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-500 border border-slate-200/60 hover:bg-slate-100 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            {view2D ? (
              <><Package size={14} /> 3D View</>
            ) : (
              <><MapPin size={14} /> 2D Map</>
            )}
          </button>
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
                  {filteredProducts.map((product, idx) => (
                    <button
                      key={product._id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchQuery(product.productName);
                        setFilteredProducts([]);
                        setShowAllProducts(false);
                        setTimeout(() => handleSearch(), 50);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50/60 transition-colors text-left"
                      style={{ borderBottom: idx < filteredProducts.length - 1 ? '1px solid #f8fafc' : 'none' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{product.productName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{product.category}{[product.brand, product.size].filter(Boolean).map(text => ` • ${text}`).join('')}</p>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg shrink-0 ml-2">
                        {product.rackId?.rackName || 'Store'}
                      </div>
                    </button>
                  ))}
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

      <div className="flex-1 relative overflow-hidden" style={{ margin: 0 }}>
        <AnimatePresence>
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-5 py-3 bg-rose-500 text-white rounded-2xl shadow-sm shadow-rose-500/30 text-sm font-bold"
            >
              <AlertCircle size={16} /> Product not found in store
            </motion.div>
          )}
          {foundProduct && showArrow && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-5 py-3 bg-emerald-500 text-white rounded-2xl shadow-sm shadow-emerald-500/30 text-sm font-bold"
            >
              <MapPin size={16} /> Found in <span className="font-black italic">{foundProduct.rackId?.rackName}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isMobile && racks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-slate-100/80 max-h-[280px] overflow-y-auto"
          >
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Rack Legend</p>
            <div className="space-y-2">
              {racks.map((rack, i) => (
                <div key={rack._id} className="flex items-center gap-2.5 group">
                  <div
                    className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm ring-2 ring-white group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: rack.color || ['#EA580C', '#10B981', '#8B5CF6', '#06B6D4', '#F43F5E', '#F59E0B'][i % 6] }}
                  />
                  <span className="text-[11px] font-bold text-slate-600 truncate">{rack.rackName}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view2D ? (
          <div className="absolute inset-0 bg-white p-6 sm:p-10 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-sm">
                  <Store size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic text-slate-900 tracking-tight uppercase">{shopName} <span className="text-orange-500 not-italic">Map</span></h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">2D Floor Plan Overview</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {racks.map((rack, idx) => (
                  <motion.div
                    key={rack._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-300 hover:shadow-md cursor-pointer ${
                      foundProduct?.rackId?._id === rack._id && showArrow 
                      ? 'border-orange-500 bg-orange-50/60 scale-105 shadow-lg shadow-orange-200/30' 
                      : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-white'
                    }`}
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl mb-3 sm:mb-4 shadow-sm ring-4 ring-white" 
                         style={{ backgroundColor: rack.color || ['#EA580C', '#10B981', '#8B5CF6', '#06B6D4', '#F43F5E', '#F59E0B'][idx % 6] }} />
                    <p className="font-black italic text-slate-900 text-sm sm:text-base mb-1">{rack.rackName.toUpperCase()}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rackProducts[rack._id]?.length || 0} Products</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Canvas
            shadows={!isMobile}
            frameloop="demand"
            camera={{
              position: isMobile ? [0, 30, 25] : [0, 20, 20],
              fov: isMobile ? 55 : 45
            }}
            style={{ background: '#0f172a' }}
            gl={{ antialias: !isMobile, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
            dpr={[1, isMobile ? 1 : 1.5]}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                console.warn('WebGL context lost — will show recovery UI');
                setWebglLost(true);
              });
              canvas.addEventListener('webglcontextrestored', () => {
                console.info('WebGL context restored');
                setWebglLost(false);
              });
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[15, 20, 10]} intensity={0.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
            <pointLight position={[(shopConfig?.width || 30) / 2, 10, (shopConfig?.depth || 20) / 2]} intensity={0.4} color="#EA580C" />

            <Plane args={[shopConfig?.width || 30, shopConfig?.depth || 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.8} />
            </Plane>

            <gridHelper args={[Math.max(shopConfig?.width || 30, shopConfig?.depth || 20), 20, '#334155', '#1e293b']} position={[0, 0.01, 0]} />
            <ContactShadows frames={1} resolution={isMobile ? 256 : 512} scale={shopConfig?.width || 30} blur={2} opacity={0.15} far={10} color="#000000" />

            <Box args={[shopConfig?.width || 30, 4, 0.3]} position={[0, 2, -(shopConfig?.depth || 20) / 2]}>
              <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
            </Box>
            <Box args={[shopConfig?.width || 30, 4, 0.3]} position={[0, 2, (shopConfig?.depth || 20) / 2]}>
              <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
            </Box>
            <Box args={[0.3, 4, shopConfig?.depth || 20]} position={[-(shopConfig?.width || 30) / 2, 2, 0]}>
              <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
            </Box>
            <Box args={[0.3, 4, shopConfig?.depth || 20]} position={[(shopConfig?.width || 30) / 2, 2, 0]}>
              <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
            </Box>

            {doors.map((door) => (
              <group key={door._id} position={[door.positionX, (door.height || 2.5) / 2, door.positionZ]} rotation={[0, (door.rotation || 0) * Math.PI / 180, 0]}>
                <Box args={[door.width || 1.5, door.height || 2.5, 0.15]}>
                  <meshStandardMaterial color={door.doorType === 'entry' ? '#10b981' : '#ef4444'} transparent opacity={0.6} />
                </Box>
                <Text
                  position={[0, (door.height || 2.5) / 2 + 0.5, 0]}
                  fontSize={0.3}
                  color="white"
                  fontWeight="bold"
                  anchorY="bottom"
                >
                  {door.doorType === 'entry' ? 'ENTRANCE' : 'EXIT'}
                </Text>
              </group>
            ))}

            {racks.map((rack) => (
              <SupermarketRack
                key={rack._id}
                rack={rack}
                products={rackProducts[rack._id] || []}
                isHighlighted={showArrow && foundProduct && foundProduct.rackId?._id === rack._id}
                highlightedProductId={foundProduct?._id}
                setSelectedProduct={handleProductClick}
                searchActive={showArrow}
                clickedProductId={clickedProductId}
              />
            ))}

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
        )}

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
                onClick={() => { setWebglLost(false); setView2D(true); }}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 mb-2"
              >
                Switch to 2D View
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
        {/* Overlays removed for cleaner view */}
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
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white shadow-sm shadow-orange-100 flex items-center justify-center shrink-0 border border-orange-100/50">
                    <Package size={24} className="text-orange-500" />
                  </div>
                  <div className="min-w-0 pt-1">
                    <h3 className="text-lg font-black text-slate-900 leading-tight pr-8 tracking-tight">{selectedProduct.productName}</h3>
                    <p className="text-2xl font-black text-orange-600 italic mt-1">₹{selectedProduct.price}</p>
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
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-bold text-slate-800">{selectedProduct.rackId?.rackName} • Shelf {selectedProduct.shelfNumber}</p>
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CustomerSearch;
