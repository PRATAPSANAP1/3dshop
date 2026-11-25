import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { Store, Maximize, Plus, Trash2, Edit2, X, Move, RotateCw, ArrowUpRight, QrCode, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Text, Plane, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import StoreQRModal from "@/components/StoreQRModal";
import { ProductBoxMesh } from "@/components/3d/ProductBoxMesh";
import { AttractiveRackFrame3D, StoreDimensionsOverlay3D } from "@/components/3d/StoreNavigation3D";

const AxisArrows = () => (
  <group>
    <group>
      <Box args={[3, 0.05, 0.05]} position={[1.5, 0, 0]}><meshBasicMaterial color="#ef4444" /></Box>
      <Text position={[3.5, 0, 0]} fontSize={0.3} color="#ef4444">X</Text>
    </group>
    <group>
      <Box args={[0.05, 3, 0.05]} position={[0, 1.5, 0]}><meshBasicMaterial color="#22c55e" /></Box>
      <Text position={[0, 3.5, 0]} fontSize={0.3} color="#22c55e">Y</Text>
    </group>
    <group>
      <Box args={[0.05, 0.05, 3]} position={[0, 0, 1.5]}><meshBasicMaterial color="#3b82f6" /></Box>
      <Text position={[0, 0, 3.5]} fontSize={0.3} color="#3b82f6">Z</Text>
    </group>
  </group>
);

const Loading3D = () => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="relative w-48 h-48">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <group>
            {Array.from({ length: 12 }).map((_, i) => (
              <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI * 2]} position={[Math.cos((i/12)*Math.PI*2)*1.5, Math.sin((i/12)*Math.PI*2)*1.5, 0]}>
                <Box args={[0.4, 0.4, 0.4]}>
                  <meshStandardMaterial color={['#f97316','#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b'][i % 6]} emissive={['#f97316','#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b'][i % 6]} emissiveIntensity={0.5} />
                </Box>
              </mesh>
            ))}
          </group>
          <RotateGroup />
        </Canvas>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">

          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse text-center">Architecting<br/>Environment</span>
        </div>
      </div>
    </div>
  );
};

const RotateGroup = () => {
  const ref = useRef<any>();
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.getElapsedTime() * 1.5;
  });
  return <group ref={ref} />;
};

const RotationDial = ({ value, onChange, color = '#8b5cf6' }: any) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleUpdate = (e: any) => {
    if (!isDragging && e.type !== 'click') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    let deg = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    onChange(Math.round(deg));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        className="relative w-28 h-28 rounded-full border-[6px] border-slate-50 flex items-center justify-center cursor-pointer select-none group transition-transform active:scale-95 shadow-inner"
        onMouseMove={handleUpdate}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleUpdate}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onClick={handleUpdate}
        style={{ background: `conic-gradient(from 0deg, ${color} 0deg, ${color} ${value}deg, transparent ${value}deg)` }}
      >
        <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center shadow-md">
          <span className="text-xl font-black italic text-slate-900 leading-none">{value}°</span>
          <div className="h-0.5 w-4 bg-slate-100 rounded-full mt-2" />
        </div>
        <div 
          className="absolute w-3 h-3 bg-slate-900 rounded-full border-2 border-white shadow-lg z-10"
          style={{ 
            transform: `rotate(${value - 90}deg) translateX(48px)`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">360° Orientation Control</p>
    </div>
  );
};

const Rack3D = ({ rack, products = [], isPreview = false }: any) => {
  const width = rack.width || 2;
  const height = rack.height || 3;
  const depth = 0.4;
  const shelves = rack.shelves || 4;
  const columns = rack.columns || 3;
  const shelfHeight = height / shelves;
  const columnWidth = width / columns;

  const getColor = () => {
    if (isPreview) return '#f59e0b';
    return rack.color || '#4f46e5';
  };

  return (
    <group position={[rack.positionX, rack.positionY || 0, rack.positionZ]} rotation={[0, (rack.rotation || 0) * Math.PI / 180, 0]}>
      <AttractiveRackFrame3D
        width={width}
        height={height}
        depth={depth}
        shelves={shelves}
        rackName={rack.rackName || 'PREVIEW'}
        color={getColor()}
      />

      {!isPreview && products.map((product: any, index: number) => {
        const shelfIndex = product.shelfNumber ? product.shelfNumber - 1 : Math.floor(index / columns);
        const columnIndex = product.columnNumber ? product.columnNumber - 1 : index % columns;
        if (shelfIndex >= shelves || shelfIndex < 0 || columnIndex >= columns || columnIndex < 0) return null;

        const productColors = ['#f97316','#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444'];
        const productColor = productColors[index % productColors.length];

        const productX = -width / 2 + columnWidth * (columnIndex + 0.5);
        const productY = -height / 2 + shelfHeight * (shelfIndex + 0.5);
        const productSize = [columnWidth * 0.72, shelfHeight * 0.62, 0.24] as [number, number, number];

        return (
          <ProductBoxMesh
            key={product._id || `prod-${index}`}
            product={product}
            position={[productX, productY, 0.06]}
            size={productSize}
            accentColor={productColor}
          />
        );
      })}
    </group>
  );
};

const ShopBuilder = () => {
  const [racks, setRacks] = useState<any[]>([]);
  const [rackProducts, setRackProducts] = useState<any>({});
  const [activeTab, setActiveTab] = useState('Dimension');
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 1280);
  const [showForm, setShowForm] = useState(false);
  const [editingRack, setEditingRack] = useState<any>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [rackFloorFilter, setRackFloorFilter] = useState<number | 'all'>('all');
  const [formData, setFormData] = useState({ 
    rackName: '', positionX: 0, positionY: 1.5, positionZ: 0, 
    rotation: 0, width: 2, height: 3, shelves: 4, columns: 3, color: '#EA580C',
    floor: 1
  });
  const [shopDimensions, setShopDimensions] = useState({ width: 30, depth: 30, totalFloors: 1 });
  const [doors, setDoors] = useState<any[]>([]);
  const [showDoorForm, setShowDoorForm] = useState(false);
  const [doorFormData, setDoorFormData] = useState({ doorType: 'entry', positionX: 0, positionZ: 0, rotation: 0, width: 1.5, height: 2.5, floor: 1 });
  const [showQRModal, setShowQRModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const availableFloors = useMemo(() => {
    const floorSet = new Set<number>([1]);
    const configuredFloors = Number(shopDimensions.totalFloors) || 1;
    for (let fl = 1; fl <= configuredFloors; fl++) {
      floorSet.add(fl);
    }
    racks.forEach((r: any) => floorSet.add(Number(r.floor) || 1));
    doors.forEach((d: any) => floorSet.add(Number(d.floor) || 1));
    return Array.from(floorSet).sort((a, b) => a - b);
  }, [racks, doors, shopDimensions.totalFloors]);

  const currentFloorRacks = useMemo(() => {
    return racks.filter(r => (Number(r.floor) || 1) === currentFloor);
  }, [racks, currentFloor]);

  const currentFloorDoors = useMemo(() => {
    return doors.filter(d => (Number(d.floor) || 1) === currentFloor);
  }, [doors, currentFloor]);

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadRackProducts = async (rackList: any[]) => {
    const productsMap: any = {};
    for (const rack of rackList) {
      try {
        const { data } = await api.get(`/products/rack/${rack._id}`);
        productsMap[rack._id] = data;
      } catch (err) {
        productsMap[rack._id] = [];
      }
    }
    setRackProducts(productsMap);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [configRes, rackRes, doorRes] = await Promise.all([
          api.get('/shop-config'), api.get('/racks'), api.get('/doors')
        ]);
        if (configRes.data) setShopDimensions({
          width: configRes.data.width || 30,
          depth: configRes.data.depth || 30,
          totalFloors: configRes.data.totalFloors || 1
        });
        setRacks(rackRes.data);
        setDoors(doorRes.data);
        loadRackProducts(rackRes.data);
      } catch (err) { console.warn("Initialization data missing"); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const handleSaveShopConfig = async () => {
    try {
      await api.post('/shop-config', shopDimensions);
      toast({ variant: "success", title: "Dimension Saved", description: "Scene boundaries persisted." });
    } catch { toast({ variant: "destructive", title: "Error", description: "Failed to save config." }); }
  };

  const handleRackSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        floor: Number(formData.floor) || currentFloor || 1,
        rackName: formData.rackName && formData.rackName.trim() ? formData.rackName.trim() : `Rack ${racks.length + 1}`
      };
      if (editingRack) {
        await api.put(`/racks/${editingRack._id}`, payload);
        setRacks(racks.map(r => r._id === editingRack._id ? { ...r, ...payload } : r));
        toast({ title: "✓ Rack Updated successfully", description: `${payload.rackName} updated on Floor ${payload.floor}.` });
      } else {
        const { data } = await api.post('/racks', payload);
        setRacks([...racks, data]);
        toast({ title: "✓ Rack Created successfully", description: `${payload.rackName} placed on Floor ${payload.floor}.` });
      }
      setShowForm(false);
      setEditingRack(null);
    } catch (err: any) {
      const msg = err.response?.data?.details || err.response?.data?.message || err.message || "Failed to save rack";
      toast({ variant: "destructive", title: "Rack Creation Error", description: msg });
    }
  };

  const handleAddDoor = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...doorFormData,
        floor: Number(doorFormData.floor) || currentFloor || 1
      };
      const { data } = await api.post('/doors', payload);
      setDoors([...doors, data]);
      setShowDoorForm(false);
      toast({ title: "✓ Door Created successfully", description: `${doorFormData.doorType.toUpperCase()} door added on Floor ${payload.floor}.` });
    } catch (err: any) {
      const msg = err.response?.data?.details || err.response?.data?.message || err.message || "Failed to add door";
      toast({ variant: "destructive", title: "Door Creation Error", description: msg });
    }
  };

  const deleteRack = async (id: string) => {
    try {
      await api.delete(`/racks/${id}`);
      setRacks(racks.filter(r => r._id !== id));
      toast({ variant: "success", title: "Unit Removed" });
    } catch { toast({ variant: "destructive", title: "Error" }); }
  };

  const deleteDoor = async (id: string) => {
    try {
      await api.delete(`/doors/${id}`);
      setDoors(doors.filter(d => d._id !== id));
      toast({ variant: "success", title: "Portal Removed" });
    } catch { toast({ variant: "destructive", title: "Error" }); }
  };

  const handleEdit = (rack: any) => {
    setEditingRack(rack);
    setFormData({ ...rack, floor: Number(rack.floor) || 1 });
    setShowForm(true);
  };

  // Remove full-screen loading as per user request

  return (
    <PageTransition>
      <div className="flex flex-col xl:flex-row h-[calc(100vh-120px)] w-full gap-4 overflow-hidden">
        
        <div className="h-[45vh] xl:h-full xl:flex-1 relative bg-slate-50 rounded-[2rem] xl:rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-inner group shrink-0">
          <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
             <div className="glass-card px-4 py-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet animate-pulse" />
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">3D Architectural Studio</span>
             </div>
          </div>

          <div className="absolute top-20 left-8 z-10 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-1.5 px-2 text-slate-400">
                <Layers size={13} className="text-violet" />
                <span className="text-[9px] font-black uppercase tracking-wider">Floors</span>
             </div>
             {availableFloors.map((fl) => {
                const isActive = currentFloor === fl;
                const rCount = racks.filter(r => (Number(r.floor) || 1) === fl).length;
                return (
                   <button
                      key={fl}
                      type="button"
                      onClick={() => setCurrentFloor(fl)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                         isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                   >
                      <span>🏢 {fl === 1 ? 'Floor 1 (Ground)' : `Floor ${fl}`}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                         {rCount} racks
                      </span>
                   </button>
                );
             })}
             <button
                type="button"
                onClick={async () => {
                   const nextFl = Math.max(...availableFloors, Number(shopDimensions.totalFloors) || 1, 1) + 1;
                   const nextConfig = { ...shopDimensions, totalFloors: nextFl };
                   setShopDimensions(nextConfig);
                   setCurrentFloor(nextFl);
                   setFormData(prev => ({ ...prev, floor: nextFl }));
                   setDoorFormData(prev => ({ ...prev, floor: nextFl }));
                   try {
                     await api.post('/shop-config', nextConfig);
                   } catch {
                     // Fallback local state if config save fails
                   }
                   toast({
                      title: `🏢 Floor ${nextFl} Added`,
                      description: `Shop now has ${nextFl} floors. Building on Floor ${nextFl}.`
                   });
                }}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 flex items-center gap-1 transition-all"
             >
                <Plus size={12} /> Add Floor
             </button>
          </div>

          <div className="absolute top-8 right-8 z-10">
             <button
               onClick={() => setShowQRModal(true)}
               className="glass-card px-4 py-2 flex items-center gap-2 text-slate-800 hover:text-orange-600 hover:border-orange-200 transition-all font-black text-[10px] uppercase tracking-widest pointer-events-auto bg-white/90 shadow-sm"
             >
               <QrCode size={14} className="text-orange-500" />
               <span>Store 3D QR Code</span>
             </button>
          </div>

          <Canvas 
            camera={{ position: [20, 20, 20], fov: 40 }} 
            shadows 
            dpr={[1, 1.2]} 
            frameloop="demand"
            gl={{ 
              powerPreference: 'default', 
              antialias: false,
              stencil: false,
              depth: true,
              failIfMajorPerformanceCaveat: false
            }}
          >
            <Suspense fallback={null}>
               <ambientLight intensity={0.8} />
               <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
               
               <Plane args={[shopDimensions.width, shopDimensions.depth]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
               </Plane>

               <group>
                  <Box args={[shopDimensions.width, 4, 0.3]} position={[0, 2, -shopDimensions.depth/2]}>
                    <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
                  </Box>
                  <Box args={[shopDimensions.width, 4, 0.3]} position={[0, 2, shopDimensions.depth/2]}>
                    <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
                  </Box>
                  <Box args={[0.3, 4, shopDimensions.depth]} position={[-shopDimensions.width/2, 2, 0]}>
                    <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
                  </Box>
                  <Box args={[0.3, 4, shopDimensions.depth]} position={[shopDimensions.width/2, 2, 0]}>
                    <meshStandardMaterial color="#94a3b8" transparent opacity={0.08} depthWrite={false} />
                  </Box>
               </group>
               
               <gridHelper args={[Math.max(shopDimensions.width, shopDimensions.depth), Math.max(shopDimensions.width, shopDimensions.depth)/2, "#cbd5e1", "#f1f5f9"]} position={[0, 0.01, 0]} />
               <StoreDimensionsOverlay3D width={shopDimensions.width} depth={shopDimensions.depth} floor={currentFloor} />
               <AxisArrows />

               {currentFloorDoors.map((door: any) => (
                  <group key={door._id} position={[door.positionX, 1.25, door.positionZ]} rotation={[0, (door.rotation || 0) * Math.PI/180, 0]}>
                    <Box args={[1.5, 2.5, 0.1]}><meshStandardMaterial color={door.doorType==='entry'?'#10b981':'#f43f5e'} transparent opacity={0.6} /></Box>
                    <Text position={[0, 1.5, 0]} fontSize={0.3} color="#1e293b" fontWeight="bold">{door.doorType.toUpperCase()}</Text>
                  </group>
               ))}

               {currentFloorRacks.map((rack) => (
                  editingRack?._id === rack._id ? null : <Rack3D key={rack._id} rack={rack} products={rackProducts[rack._id] || []} />
               ))}

               {showForm && <Rack3D key="preview" rack={formData} isPreview />}
               {showDoorForm && (
                  <group position={[doorFormData.positionX, 1.25, doorFormData.positionZ]} rotation={[0, (doorFormData.rotation || 0) * Math.PI/180, 0]}>
                    <Box args={[1.5, 2.5, 0.1]}><meshStandardMaterial color="#f59e0b" transparent opacity={0.4} wireframe /></Box>
                  </group>
               )}

               <OrbitControls makeDefault minDistance={5} maxDistance={60} maxPolarAngle={Math.PI/2.1} />
               <Environment preset="city" />
               <ContactShadows resolution={1024} scale={40} blur={2} opacity={0.1} far={10} color="#000000" />
            </Suspense>
          </Canvas>

          <div className="absolute bottom-8 left-8 z-10 glass-card p-3 hidden xl:flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
             <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-[#ef4444]" /> X-AXIS</span>
             <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-[#22c55e]" /> Y-AXIS</span>
             <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-[#3b82f6]" /> Z-AXIS</span>
          </div>
        </div>

        <div className="flex-1 xl:w-96 flex flex-col gap-5 overflow-y-scroll pr-2 pb-24 h-[55vh] xl:h-auto custom-scrollbar overscroll-contain">
          
          <div className="xl:hidden flex bg-white/50 backdrop-blur-xl border border-slate-100 p-1.5 rounded-2xl sticky top-0 z-30 shadow-sm">
             {['Dimension', 'Doors', 'Racks'].map((tab) => (
                <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                   {tab}
                </button>
             ))}
          </div>

          <div className="space-y-5">
             {(activeTab === 'Dimension' || !isMobileScreen) && (
                <div className="stat-card p-6">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600"><Maximize size={18} strokeWidth={3} /></div>
                      <h3 className="font-heading text-sm font-black text-slate-900 tracking-tight uppercase italic">Dimension</h3>
                   </div>
                   <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Breadth (m)</label>
                         <Input type="number" value={shopDimensions.width} onChange={e => setShopDimensions({...shopDimensions, width: parseInt(e.target.value) || 10})} className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Depth (m)</label>
                         <Input type="number" value={shopDimensions.depth} onChange={e => setShopDimensions({...shopDimensions, depth: parseInt(e.target.value) || 10})} className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Floors</label>
                         <Input type="number" min={1} max={10} value={shopDimensions.totalFloors} onChange={e => setShopDimensions({...shopDimensions, totalFloors: Math.max(1, parseInt(e.target.value) || 1)})} className="h-10 rounded-xl" />
                      </div>
                   </div>
                   <Button onClick={handleSaveShopConfig} className="w-full bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] h-10 rounded-xl">Save Boundary</Button>
                </div>
             )}

             {(activeTab === 'Doors' || !isMobileScreen) && (
                <div className="stat-card p-6">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="h-9 w-9 bg-emerald/10 text-emerald rounded-xl flex items-center justify-center"><Move size={18} strokeWidth={3} /></div>
                         <h3 className="font-heading text-sm font-black uppercase italic">Doors</h3>
                      </div>
                      <button onClick={() => setShowDoorForm(!showDoorForm)} className="h-8 w-8 rounded-lg bg-emerald text-white flex items-center justify-center shadow-sm">{showDoorForm ? <X size={16} /> : <Plus size={16} />}</button>
                   </div>
                   {showDoorForm && (
                      <form onSubmit={handleAddDoor} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-4 space-y-4">
                         <div className="flex gap-2">
                             <Button type="button" onClick={() => setDoorFormData({...doorFormData, doorType: 'entry'})} variant={doorFormData.doorType === 'entry' ? 'default' : 'outline'} className="flex-1 h-8 text-[9px] bg-emerald">ENTRY</Button>
                             <Button type="button" onClick={() => setDoorFormData({...doorFormData, doorType: 'exit'})} variant={doorFormData.doorType === 'exit' ? 'default' : 'outline'} className="flex-1 h-8 text-[9px]">EXIT</Button>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-slate-500">Floor Level</label>
                            <select
                               value={doorFormData.floor || currentFloor}
                               onChange={e => setDoorFormData({...doorFormData, floor: parseInt(e.target.value) || 1})}
                               className="w-full h-8 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-bold"
                            >
                               {availableFloors.map(fl => (
                                  <option key={fl} value={fl}>Floor {fl} {fl === 1 ? '(Ground)' : ''}</option>
                               ))}
                            </select>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase tracking-tighter">Breadth: {doorFormData.width}m</label>
                               <input type="range" min="0.5" max="5" step="0.1" value={doorFormData.width} onChange={e => setDoorFormData({...doorFormData, width: parseFloat(e.target.value)})} className="w-full accent-emerald" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase tracking-tighter">Elevation: {doorFormData.height}m</label>
                               <input type="range" min="1" max="5" step="0.1" value={doorFormData.height} onChange={e => setDoorFormData({...doorFormData, height: parseFloat(e.target.value)})} className="w-full accent-emerald" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase">PosX: {doorFormData.positionX}</label>
                               <input type="range" min={-shopDimensions.width/2} max={shopDimensions.width/2} value={doorFormData.positionX} onChange={e => setDoorFormData({...doorFormData, positionX: parseFloat(e.target.value)})} className="w-full accent-emerald" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase">PosZ: {doorFormData.positionZ}</label>
                               <input type="range" min={-shopDimensions.depth/2} max={shopDimensions.depth/2} value={doorFormData.positionZ} onChange={e => setDoorFormData({...doorFormData, positionZ: parseFloat(e.target.value)})} className="w-full accent-emerald" />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase">Rotation: {doorFormData.rotation}°</label>
                            <input type="range" min="0" max="360" value={doorFormData.rotation || 0} onChange={e => setDoorFormData({...doorFormData, rotation: parseInt(e.target.value)})} className="w-full accent-emerald" />
                         </div>
                         <Button type="submit" className="w-full h-10 bg-emerald font-black text-[9px]">ENACT PORTAL</Button>
                      </form>
                   )}
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                      {doors.map(door => (
                         <div key={door._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[10px] font-bold">
                            <div className="flex items-center gap-2">
                               <span>{door.doorType.toUpperCase()} ({door.positionX}, {door.positionZ})</span>
                               <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald/10 text-emerald uppercase">
                                  Floor {door.floor || 1}
                               </span>
                            </div>
                            <button onClick={() => deleteDoor(door._id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {(activeTab === 'Racks' || !isMobileScreen) && (
                <div className="stat-card p-6">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="h-9 w-9 bg-violet/10 text-violet rounded-xl flex items-center justify-center"><RotateCw size={18} strokeWidth={3} /></div>
                         <h3 className="font-heading text-sm font-black uppercase italic">Racks</h3>
                      </div>
                      <button onClick={() => { setShowForm(!showForm); setEditingRack(null); setFormData({ rackName: '', positionX: 0, positionY: 1.5, positionZ: 0, rotation: 0, width: 2, height: 3, shelves: 4, columns: 3, color: '#EA580C', floor: currentFloor }); }} className="h-9 w-9 rounded-xl bg-violet text-white flex items-center justify-center shadow-sm transition-all active:scale-95 hover:bg-violet-600">{showForm ? <X size={16} /> : <Plus size={16} />}</button>
                   </div>
                   {showForm && (
                      <form onSubmit={handleRackSubmit} className="bg-white p-5 rounded-2xl border border-slate-100 mb-4 shadow-sm space-y-4 text-[10px]">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-slate-500">Floor Level</label>
                            <select
                               value={formData.floor || currentFloor}
                               onChange={e => setFormData({...formData, floor: parseInt(e.target.value) || 1})}
                               className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 font-bold text-xs"
                            >
                               {availableFloors.concat(availableFloors.includes(formData.floor || currentFloor) ? [] : [formData.floor || currentFloor]).sort((a,b)=>a-b).map(fl => (
                                  <option key={fl} value={fl}>Floor {fl} {fl === 1 ? '(Ground Floor)' : ''}</option>
                               ))}
                            </select>
                         </div>
                         <Input placeholder="Rack Name" value={formData.rackName} onChange={e => setFormData({...formData, rackName: e.target.value})} className="h-10" required />
                         <div className="grid grid-cols-2 gap-4">
                            <Input type="number" placeholder="Width" value={formData.width} onChange={e => setFormData({...formData, width: parseFloat(e.target.value)})} className="h-10" />
                            <Input type="number" placeholder="Height" value={formData.height} onChange={e => setFormData({...formData, height: parseFloat(e.target.value)})} className="h-10" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            {/* Desktop: number inputs */}
                            <div className="space-y-1 hidden xl:block">
                               <label className="text-[8px] font-black uppercase">Shelves</label>
                               <Input type="number" min={1} max={10} value={formData.shelves} onChange={e => setFormData({...formData, shelves: parseInt(e.target.value) || 1})} className="h-10" />
                            </div>
                            <div className="space-y-1 hidden xl:block">
                               <label className="text-[8px] font-black uppercase">Columns</label>
                               <Input type="number" min={1} max={8} value={formData.columns} onChange={e => setFormData({...formData, columns: parseInt(e.target.value) || 1})} className="h-10" />
                            </div>
                            {/* Mobile: range sliders */}
                            <div className="space-y-1 xl:hidden">
                               <label className="text-[8px] font-black uppercase">Shelves: {formData.shelves}</label>
                               <input type="range" min="1" max="10" value={formData.shelves} onChange={e => setFormData({...formData, shelves: parseInt(e.target.value)})} className="w-full accent-violet" />
                            </div>
                            <div className="space-y-1 xl:hidden">
                               <label className="text-[8px] font-black uppercase">Columns: {formData.columns}</label>
                               <input type="range" min="1" max="8" value={formData.columns} onChange={e => setFormData({...formData, columns: parseInt(e.target.value)})} className="w-full accent-violet" />
                            </div>
                         </div>
                         {/* Desktop: number inputs for position */}
                         <div className="hidden xl:grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase">Pos X</label>
                               <Input type="number" step="0.5" value={formData.positionX} onChange={e => setFormData({...formData, positionX: parseFloat(e.target.value) || 0})} className="h-10" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase">Pos Y</label>
                               <Input type="number" step="0.1" value={formData.positionY} onChange={e => setFormData({...formData, positionY: parseFloat(e.target.value) || 0})} className="h-10" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase">Pos Z</label>
                               <Input type="number" step="0.5" value={formData.positionZ} onChange={e => setFormData({...formData, positionZ: parseFloat(e.target.value) || 0})} className="h-10" />
                            </div>
                         </div>
                         <div className="flex flex-col items-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <RotationDial 
                              value={formData.rotation || 0} 
                              onChange={(val: number) => setFormData({...formData, rotation: val})} 
                              color="#8b5cf6"
                            />
                         </div>
                         
                         <Button type="submit" className="w-full h-14 bg-slate-900 text-white font-black tracking-widest text-[11px] rounded-2xl hover:bg-violet shadow-lg shadow-violet/20 transition-all active:scale-95 uppercase">
                            {editingRack ? 'SYNC ARCHITECTURAL UNIT' : 'INITIALIZE SPATIAL UNIT'}
                         </Button>
                      </form>
                   )}
                   <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                      <button
                         type="button"
                         onClick={() => setRackFloorFilter('all')}
                         className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${rackFloorFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                         All ({racks.length})
                      </button>
                      {availableFloors.map(fl => (
                         <button
                            key={fl}
                            type="button"
                            onClick={() => setRackFloorFilter(fl)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${rackFloorFilter === fl ? 'bg-violet text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                         >
                            Floor {fl} ({racks.filter(r => (Number(r.floor) || 1) === fl).length})
                         </button>
                      ))}
                   </div>
                   <div className="space-y-3">
                      {racks
                         .filter(rack => rackFloorFilter === 'all' || (Number(rack.floor) || 1) === rackFloorFilter)
                         .map(rack => (
                         <div key={rack._id} className="stat-card p-4 border-slate-50 flex justify-between items-center">
                            <div>
                               <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-bold">{rack.rackName}</p>
                                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-violet/10 text-violet uppercase">
                                     Floor {rack.floor || 1}
                                  </span>
                               </div>
                               <p className="text-[8px] text-slate-400 mt-0.5">{rack.width}m x {rack.height}m • {rack.shelves || 4} shelves</p>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => handleEdit(rack)} className="p-1.5 text-slate-400 hover:text-violet"><Edit2 size={12} /></button>
                               <button onClick={() => deleteRack(rack._id)} className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
      <StoreQRModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        shopName={user?.shopName || 'MainStore'}
      />
    </PageTransition>
  );
};

export default ShopBuilder;
