import { useState, useEffect, Suspense } from "react";
import { Store, Maximize, Plus, Trash2, Edit2, X, Move, RotateCw, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Text, Plane, Environment, ContactShadows } from "@react-three/drei";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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

const Rack3D = ({ rack, products = [], isPreview = false }: any) => {
  const width = rack.width || 2;
  const height = rack.height || 3;
  const depth = 0.3;
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
      <Box args={[width, height, depth]} castShadow>
        <meshStandardMaterial color="#f1f5f9" transparent opacity={0.08} depthWrite={false} />
      </Box>

      <group position={[0, height / 2 + 0.3, 0.16]}>
        <Box args={[width * 0.9, 0.4, 0.05]}>
          <meshStandardMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.3} />
        </Box>
        <Text position={[0, 0, 0.03]} fontSize={0.45} color="#000000" fontWeight="900" anchorX="center" anchorY="middle">
          {(rack.rackName || 'PREVIEW').toUpperCase()}
        </Text>
      </group>

      {Array.from({ length: shelves }).map((_, shelfIndex) => {
        const shelfY = -height / 2 + shelfHeight * (shelfIndex + 0.5);
        return (
          <group key={`shelf-${shelfIndex}`}>
             <Plane args={[width, depth]} position={[0, shelfY - shelfHeight/2, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
               <meshStandardMaterial color="#cbd5e1" transparent opacity={0.1} depthWrite={false} />
             </Plane>
          </group>
        );
      })}

      {!isPreview && products.map((product: any, index: number) => {
        const shelfIndex = Math.floor(index / columns);
        const columnIndex = index % columns;
        if (shelfIndex >= shelves) return null;

        const productColors = ['#f97316','#8b5cf6','#06b6d4','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444'];
        const productColor = productColors[index % productColors.length];

        const productX = -width / 2 + columnWidth * (columnIndex + 0.5);
        const productY = -height / 2 + shelfHeight * (shelfIndex + 0.5);
        const productSize = [columnWidth * 0.7, shelfHeight * 0.6, 0.2] as [number, number, number];

        return (
          <group key={product._id} position={[productX, productY, 0.15]}>
            <Box args={productSize}>
              <meshStandardMaterial color={productColor} />
            </Box>
          </group>
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
  const [formData, setFormData] = useState({ 
    rackName: '', positionX: 0, positionY: 1.5, positionZ: 0, 
    rotation: 0, width: 2, height: 3, shelves: 4, columns: 3, color: '#EA580C' 
  });
  const [shopDimensions, setShopDimensions] = useState({ width: 30, depth: 30 });
  const [doors, setDoors] = useState<any[]>([]);
  const [showDoorForm, setShowDoorForm] = useState(false);
  const [doorFormData, setDoorFormData] = useState({ doorType: 'entry', positionX: 0, positionZ: 0, rotation: 0, width: 1.5, height: 2.5 });

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        if (configRes.data) setShopDimensions({ width: configRes.data.width, depth: configRes.data.depth });
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
      if (editingRack) {
        await api.put(`/racks/${editingRack._id}`, formData);
        setRacks(racks.map(r => r._id === editingRack._id ? { ...r, ...formData } : r));
        toast({ variant: "success", title: "Unit Updated" });
      } else {
        const { data } = await api.post('/racks', formData);
        setRacks([...racks, data]);
        toast({ variant: "success", title: "Unit Initialized" });
      }
      setShowForm(false);
      setEditingRack(null);
    } catch { toast({ variant: "destructive", title: "Failure" }); }
  };

  const handleAddDoor = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/doors', doorFormData);
      setDoors([...doors, data]);
      setShowDoorForm(false);
      toast({ variant: "success", title: "Portal Established" });
    } catch { toast({ variant: "destructive", title: "Error" }); }
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
    setFormData({ ...rack });
    setShowForm(true);
  };

  if (loading) return null;

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

          <Canvas camera={{ position: [20, 20, 20], fov: 40 }} shadows dpr={[1, 1.5]}>
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
               
               <gridHelper args={[shopDimensions.width, shopDimensions.width/2, "#cbd5e1", "#f1f5f9"]} position={[0, 0.01, 0]} />
               <AxisArrows />

               {doors.map((door: any) => (
                  <group key={door._id} position={[door.positionX, 1.25, door.positionZ]} rotation={[0, (door.rotation || 0) * Math.PI/180, 0]}>
                    <Box args={[1.5, 2.5, 0.1]}><meshStandardMaterial color={door.doorType==='entry'?'#10b981':'#f43f5e'} transparent opacity={0.6} /></Box>
                    <Text position={[0, 1.5, 0]} fontSize={0.3} color="#1e293b" fontWeight="bold">{door.doorType.toUpperCase()}</Text>
                  </group>
               ))}

               {racks.map((rack) => (
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
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Breadth (m)</label>
                         <Input type="number" value={shopDimensions.width} onChange={e => setShopDimensions({...shopDimensions, width: parseInt(e.target.value) || 10})} className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Depth (m)</label>
                         <Input type="number" value={shopDimensions.depth} onChange={e => setShopDimensions({...shopDimensions, depth: parseInt(e.target.value) || 10})} className="h-10 rounded-xl" />
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
                            <span>{door.doorType.toUpperCase()} ({door.positionX}, {door.positionZ})</span>
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
                      <button onClick={() => { setShowForm(!showForm); setEditingRack(null); setFormData({ rackName: '', positionX: 0, positionY: 1.5, positionZ: 0, rotation: 0, width: 2, height: 3, shelves: 4, columns: 3, color: '#EA580C' }); }} className="h-8 w-8 rounded-lg bg-violet text-white flex items-center justify-center">{showForm ? <X size={16} /> : <Plus size={16} />}</button>
                   </div>
                   {showForm && (
                      <form onSubmit={handleRackSubmit} className="bg-white p-5 rounded-2xl border border-slate-100 mb-4 shadow-sm space-y-4 text-[10px]">
                         <Input placeholder="Rack Name" value={formData.rackName} onChange={e => setFormData({...formData, rackName: e.target.value})} className="h-10" required />
                         <div className="grid grid-cols-2 gap-4">
                            <Input type="number" placeholder="Width" value={formData.width} onChange={e => setFormData({...formData, width: parseFloat(e.target.value)})} className="h-10" />
                            <Input type="number" placeholder="Height" value={formData.height} onChange={e => setFormData({...formData, height: parseFloat(e.target.value)})} className="h-10" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase">Shelves: {formData.shelves}</label>
                               <input type="range" min="1" max="10" value={formData.shelves} onChange={e => setFormData({...formData, shelves: parseInt(e.target.value)})} className="w-full accent-violet" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] font-black uppercase">Columns: {formData.columns}</label>
                               <input type="range" min="1" max="8" value={formData.columns} onChange={e => setFormData({...formData, columns: parseInt(e.target.value)})} className="w-full accent-violet" />
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            <div><label className="text-[7px] font-bold">X: {formData.positionX}</label><input type="range" min={-shopDimensions.width/2} max={shopDimensions.width/2} value={formData.positionX} onChange={e => setFormData({...formData, positionX: parseFloat(e.target.value)})} className="w-full accent-violet" /></div>
                            <div><label className="text-[7px] font-bold">Y: {formData.positionY}</label><input type="range" min="0" max="10" step="0.1" value={formData.positionY} onChange={e => setFormData({...formData, positionY: parseFloat(e.target.value)})} className="w-full accent-violet" /></div>
                            <div><label className="text-[7px] font-bold">Z: {formData.positionZ}</label><input type="range" min={-shopDimensions.depth/2} max={shopDimensions.depth/2} value={formData.positionZ} onChange={e => setFormData({...formData, positionZ: parseFloat(e.target.value)})} className="w-full accent-violet" /></div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase">Angle: {formData.rotation}°</label>
                            <input type="range" min="0" max="360" value={formData.rotation || 0} onChange={e => setFormData({...formData, rotation: parseInt(e.target.value)})} className="w-full accent-violet" />
                         </div>
                         <Button type="submit" className="w-full h-12 bg-slate-900 text-white font-black tracking-widest text-[9px]">INITIALIZE UNIT</Button>
                      </form>
                   )}
                   <div className="space-y-3">
                      {racks.map(rack => (
                         <div key={rack._id} className="stat-card p-4 border-slate-50 flex justify-between items-center">
                            <div>
                               <p className="text-[10px] font-bold">{rack.rackName}</p>
                               <p className="text-[8px] text-slate-400">{rack.width}m x {rack.height}m</p>
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
    </PageTransition>
  );
};

export default ShopBuilder;
