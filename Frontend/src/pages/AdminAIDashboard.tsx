import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { BrainCircuit, Activity, Users, ShoppingCart, Loader2 } from 'lucide-react';

const AdminAIDashboard = () => {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchData();
    drawMockHeatmap();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ml/segmentation/k-means');
      setSegments(data.segments || []);
    } catch (err) {
      console.error('Failed to load segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const drawMockHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background grid
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Mock KDE Heatmap points
    const points = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 40 + 20,
      intensity: Math.random()
    }));

    // Draw radial gradients to simulate KDE heatmap
    points.forEach(p => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      // Hot spots are red/orange, cool spots are blue/green
      const alpha = p.intensity * 0.4;
      if (p.intensity > 0.7) {
        gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`); // Red
      } else if (p.intensity > 0.4) {
        gradient.addColorStop(0, `rgba(245, 158, 11, ${alpha})`); // Orange
      } else {
        gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`); // Blue
      }
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw store fixtures
    ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
    ctx.fillRect(100, 100, 20, 150);
    ctx.fillRect(200, 100, 20, 150);
    ctx.fillRect(300, 100, 20, 150);
    ctx.fillRect(100, 300, 220, 20);
  };

  return (
    <div className="p-8 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">AI & Analytics Dashboard</h1>
          <p className="text-sm font-medium text-slate-500">Machine learning insights, customer clustering, and spatial analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Customer Segmentation (K-Means) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              Customer Segmentation
            </h2>
            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">K-Means Clustering</span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : segments.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">No customer data available yet</div>
          ) : (
            <div className="space-y-4">
              {segments.map((seg, i) => (
                <div key={seg.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {seg.label}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Avg. Spend: ${(seg.centroid.spend || 0).toFixed(2)} | Avg. Orders: {(seg.centroid.orders || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-800">{seg.customers.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shoppers</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visitor Spatial Heatmap (KDE) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-rose-500" />
              Store Traffic Heatmap
            </h2>
            <span className="text-xs font-bold px-2 py-1 bg-rose-50 text-rose-600 rounded-lg">KDE Simulation</span>
          </div>
          
          <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={400} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-slate-200/50 text-xs font-medium text-slate-600 space-y-1">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /> High Dwell Time</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full" /> Moderate</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /> Passing By</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAIDashboard;
