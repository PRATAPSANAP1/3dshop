import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.8} />
    </mesh>
  );
}

function Shelf({ position, color, label, highlighted }: { position: [number, number, number]; color: string; label: string; highlighted?: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[2.4, 2.5, 0.8]} radius={0.05} position={[0, 1.25, 0]} castShadow>
        <meshStandardMaterial color={highlighted ? '#fff7ed' : '#f1f5f9'} roughness={0.4} metalness={0.1} emissive={highlighted ? '#f97316' : '#000000'} emissiveIntensity={highlighted ? 0.08 : 0} />
      </RoundedBox>
      {[0.5, 1.2, 1.9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[2.2, 0.05, 0.7]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      ))}
      {[0.5, 1.2, 1.9].map((y) =>
        [-0.6, 0, 0.6].map((x) => (
          <RoundedBox key={`${y}-${x}`} args={[0.35, 0.4, 0.3]} radius={0.03} position={[x, y + 0.25, 0]}>
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
          </RoundedBox>
        ))
      )}
    </group>
  );
}

function FloatingLogo() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 4.5 + Math.sin(state.clock.elapsedTime) * 0.2;
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={[0, 4.5, 0]}>
      <octahedronGeometry args={[0.5]} />
      <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

function Scene({ activeCategory }: { activeCategory: string | null }) {
  const SHELVES = [
    { position: [-4, 0, -3] as [number,number,number], color: '#ef4444', label: 'Fruits' },
    { position: [-4, 0,  0] as [number,number,number], color: '#f59e0b', label: 'Bakery' },
    { position: [-4, 0,  3] as [number,number,number], color: '#3b82f6', label: 'Dairy' },
    { position: [ 0, 0, -3] as [number,number,number], color: '#10b981', label: 'Vegetables' },
    { position: [ 0, 0,  0] as [number,number,number], color: '#8b5cf6', label: 'Pantry' },
    { position: [ 0, 0,  3] as [number,number,number], color: '#ec4899', label: 'Snacks' },
    { position: [ 4, 0, -3] as [number,number,number], color: '#06b6d4', label: 'Beverages' },
    { position: [ 4, 0,  0] as [number,number,number], color: '#f97316', label: 'Meat' },
    { position: [ 4, 0,  3] as [number,number,number], color: '#14b8a6', label: 'Seafood' },
  ];
  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 5, 8]} fov={50} />
      <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} minDistance={3} maxDistance={15} />
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 5, 0]} intensity={1} color="#f97316" distance={20} />
      <pointLight position={[-6, 4, -4]} intensity={0.5} color="#ffffff" />
      <pointLight position={[6, 4, 4]} intensity={0.5} color="#ffffff" />
      <Floor />
      <FloatingLogo />
      {SHELVES.map(s => (
        <Shelf key={s.label} position={s.position} color={s.color} label={s.label} highlighted={activeCategory === s.label} />
      ))}
      <Environment preset="apartment" />
    </>
  );
}

export default function Shop3D() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const CATEGORIES = ['Fruits', 'Bakery', 'Dairy', 'Vegetables', 'Pantry', 'Snacks', 'Beverages', 'Meat', 'Seafood'];

  return (
    <div className="min-h-screen bg-white">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen relative">
        <Canvas 
          shadows 
          dpr={[1, 1.2]}
          gl={{ 
            powerPreference: 'high-performance',
            antialias: false,
            stencil: false,
            failIfMajorPerformanceCaveat: false
          }}
        >
          <Suspense fallback={null}>
            <Scene activeCategory={activeCategory} />
          </Suspense>
        </Canvas>

        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-xl rounded-2xl p-4 max-w-xs border border-slate-100 shadow-sm">
          <h2 className="font-black text-sm text-slate-900 mb-1 uppercase tracking-tight">
            <span className="text-orange-500">3D</span> Store View
          </h2>
          <p className="text-xs text-slate-400 font-medium">Drag to rotate • Scroll to zoom • Explore the aisles</p>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <Link to="/home" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl border border-slate-100 shadow-sm text-xs font-black text-slate-600 hover:text-orange-500 transition-colors">
            <ArrowLeft size={14} /> Exit Store
          </Link>
          <Link to="/catalog" className="flex items-center gap-2 px-4 py-2 bg-orange-500 rounded-xl text-xs font-black text-white hover:bg-orange-600 transition-colors">
            <ShoppingBag size={14} /> Shop Now
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-2 md:gap-4 border border-slate-100 shadow-sm overflow-x-auto max-w-[90vw]">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              className={`text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${
                activeCategory === c
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-orange-500'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
