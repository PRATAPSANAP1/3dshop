import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, PerspectiveCamera, Environment } from "@react-three/drei";
import { motion } from "framer-motion";
import { 
  Construction, 
  Save, 
  RotateCcw, 
  Download, 
  Box, 
  Move, 
  Grid3X3,
  Weight,
  Layers,
  Palette,
  Maximize2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Rack3D = ({ position, dimensions, color }: any) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
      {/* Wireframe for select effect */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[dimensions.width + 0.05, dimensions.height + 0.05, dimensions.depth + 0.05]} />
        <meshBasicMaterial color="#EA580C" wireframe transparent opacity={0.2} />
      </mesh>
    </mesh>
  );
};

const GodownBuilder = () => {
  const [racks, setRacks] = useState([
    { id: 1, position: [0, 1, 0], dimensions: { width: 1.2, height: 2, depth: 0.6 }, color: "#EA580C" },
    { id: 2, position: [2, 1, -1], dimensions: { width: 1.2, height: 2, depth: 0.6 }, color: "#3B82F6" },
  ]);

  const [formData, setFormData] = useState({
    name: "Rack A-1",
    code: "RA-001",
    zone: "Dry",
    x: 0,
    y: 0,
    z: 0,
    width: 1.2,
    height: 2.0,
    depth: 0.6,
    shelves: 4,
    color: "#EA580C"
  });

  return (
    <div className="flex h-screen bg-[#FFFFFF] overflow-hidden">
      {/* Settings Panel */}
      <div className="w-80 h-screen bg-white border-r border-orange-100 flex flex-col shadow-2xl relative z-10 transition-all">
        <div className="p-6 bg-orange-50/50 border-b border-orange-100">
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
               <Construction size={20} />
             </div>
             <div>
               <h2 className="font-heading font-black text-slate-800 uppercase tracking-tight italic">BUILD TOOLS</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Construct Godown</p>
             </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
          {/* Rack Info Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4 border-l-4 border-[#EA580C] pl-3 py-1 bg-orange-50/30">
               <p className="text-[10px] font-black text-[#EA580C] uppercase tracking-[0.2em] leading-none">Rack Information</p>
             </div>
             <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rack Name *</label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-11 rounded-xl border-orange-100 focus-visible:ring-[#EA580C] font-bold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rack Code *</label>
                  <Input 
                    value={formData.code} 
                    className="h-11 rounded-xl border-orange-100 focus-visible:ring-[#EA580C] font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Zone / Section</label>
                  <select className="flex h-11 w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold ring-offset-background focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:ring-offset-2">
                    <option>Dry Storage</option>
                    <option>Cold Storage</option>
                    <option>Bulk Area</option>
                  </select>
                </div>
             </div>
          </div>

          {/* Position Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4 border-l-4 border-[#EA580C] pl-3 py-1 bg-orange-50/30">
               <p className="text-[10px] font-black text-[#EA580C] uppercase tracking-[0.2em] leading-none">Position (m)</p>
             </div>
             <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">X Axis</label>
                  <Input type="number" step="0.1" value={formData.x} className="h-10 rounded-lg text-center font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Y Axis</label>
                  <Input type="number" step="0.1" value={formData.y} className="h-10 rounded-lg text-center font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Z Axis</label>
                  <Input type="number" step="0.1" value={formData.z} className="h-10 rounded-lg text-center font-mono text-xs" />
                </div>
             </div>
          </div>

          {/* Dimensions Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4 border-l-4 border-[#EA580C] pl-3 py-1 bg-orange-50/30">
               <p className="text-[10px] font-black text-[#EA580C] uppercase tracking-[0.2em] leading-none">Dimensions (m)</p>
             </div>
             <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Width</label>
                  <Input type="number" step="0.1" value={formData.width} className="h-10 rounded-lg text-center font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Height</label>
                  <Input type="number" step="0.1" value={formData.height} className="h-10 rounded-lg text-center font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Depth</label>
                  <Input type="number" step="0.1" value={formData.depth} className="h-10 rounded-lg text-center font-mono text-xs" />
                </div>
             </div>
          </div>

          {/* Shelves Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4 border-l-4 border-[#EA580C] pl-3 py-1 bg-orange-50/30">
               <p className="text-[10px] font-black text-[#EA580C] uppercase tracking-[0.2em] leading-none">Shelf Configuration</p>
             </div>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-[#EA580C]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Shelves</span>
                  </div>
                  <Input type="number" value={formData.shelves} className="h-8 w-16 text-center font-mono text-xs" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-2">
                    <Weight size={14} className="text-[#EA580C]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Strength</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">50kg/shelf</span>
                </div>
             </div>
          </div>

          {/* Color Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-4 border-l-4 border-[#EA580C] pl-3 py-1 bg-orange-50/30">
               <p className="text-[10px] font-black text-[#EA580C] uppercase tracking-[0.2em] leading-none">Appearance</p>
             </div>
             <div className="flex justify-between px-2">
               {["#EA580C", "#FFFFFF", "#3B82F6", "#10B981", "#EF4444"].map(c => (
                 <button 
                   key={c}
                   onClick={() => setFormData({...formData, color: c})}
                   className={`h-8 w-8 rounded-full border-2 transition-all ${formData.color === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-orange-100 bg-white">
          <Button className="w-full h-14 rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-orange-500/20 gap-3 group">
             <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
             Place New Rack
          </Button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 relative bg-[#0F1A2E]">
        {/* Canvas Toolbar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 z-20 shadow-2xl">
          <ToolbarButton icon={RotateCcw} label="Reset" />
          <ToolbarSeparator />
          <ToolbarButton icon={Move} label="Move" active />
          <ToolbarButton icon={Grid3X3} label="Select" />
          <ToolbarSeparator />
          <ToolbarButton icon={Maximize2} label="Focus" />
          <ToolbarButton icon={Download} label="Export" />
          <ToolbarSeparator />
          <Button className="h-10 px-6 rounded-xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] gap-2">
            <Save size={14} /> Save Layout
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-20 items-end">
           <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/5 flex items-center gap-3">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Active Racks</p>
              <p className="text-sm font-black text-[#EA580C] font-mono">{racks.length}</p>
           </div>
           <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/5 flex items-center gap-3">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Capacity Used</p>
              <p className="text-sm font-black text-emerald-500 font-mono">45%</p>
           </div>
        </div>

        <Suspense fallback={null}>
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[10, 10, 10]} />
            <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <spotLight position={[-10, 20, 10]} angle={0.2} penumbra={1} intensity={1} castShadow />
            
            <Grid 
              infiniteGrid 
              fadeDistance={50} 
              sectionColor="#EA580C" 
              sectionThickness={1.5} 
              cellColor="#312e81" 
              cellThickness={1}
              opacity={0.15}
            />

            {racks.map(rack => (
              <Rack3D key={rack.id} position={rack.position} dimensions={rack.dimensions} color={rack.color} />
            ))}

            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
            
            <Environment preset="night" />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon: Icon, label, active }: any) => (
  <button className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all group ${active ? 'bg-[#EA580C] text-white shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
    <Icon size={16} />
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const ToolbarSeparator = () => <div className="h-6 w-px bg-white/10 mx-2" />;

export default GodownBuilder;
