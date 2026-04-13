import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  Warehouse, 
  Bell, 
  MapPin, 
  User, 
  ShieldCheck, 
  Save,
  Thermometer,
  ShieldAlert,
  Smartphone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const GodownSettings = () => {
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Godown <span className="text-[#EA580C] not-italic">Settings</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Configure your warehouse profile and security preferences
          </p>
        </div>
        <Button className="h-12 px-8 rounded-2xl bg-[#EA580C] text-white hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-orange-500/20 gap-3">
          <Save size={18} /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
         <div className="lg:col-span-2 space-y-12">
            {/* Godown Profile */}
            <section className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-orange-100 shadow-sm">
               <div className="flex items-center gap-3 border-l-4 border-[#EA580C] pl-5 py-2 bg-orange-50/30">
                  <Warehouse size={20} className="text-[#EA580C]" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] italic">Godown Profile</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Godown Name *</label>
                     <Input defaultValue="Mumbai Central Warehouse" className="h-14 rounded-2xl border-orange-100 font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Godown Code *</label>
                     <Input defaultValue="GDM-MUM-01" className="h-14 rounded-2xl border-orange-100 font-mono font-black text-[#EA580C]" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address *</label>
                     <textarea className="w-full min-h-[120px] rounded-[1.5rem] border border-orange-100 p-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#EA580C] bg-white" defaultValue="Plot 42, Sector 8, Industrial Area, Navi Mumbai, MH - 400706" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Manager Contact</label>
                     <Input defaultValue="+91 98765 43210" className="h-14 rounded-2xl border-orange-100 font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Official Email</label>
                     <Input defaultValue="warehouse.mum@3dshop.com" className="h-14 rounded-2xl border-orange-100 font-bold" />
                  </div>
               </div>
            </section>

            {/* Alert Preferences */}
            <section className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-orange-100 shadow-sm">
               <div className="flex items-center gap-3 border-l-4 border-[#EA580C] pl-5 py-2 bg-orange-50/30">
                  <Bell size={20} className="text-[#EA580C]" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] italic">Automated Alerts</h2>
               </div>
               <div className="space-y-6">
                  {[
                    { title: "Low Stock Notifications", desc: "Notify when units drop below minimum threshold", icon: ShieldAlert },
                    { title: "Expiry Warnings", desc: "Alert 30 days before product shelf life ends", icon: Clock },
                    { title: "Inbound Dispatch Alerts", desc: "Notify upon stock transfer requests", icon: Smartphone },
                    { title: "Monthly Audit Summaries", desc: "Receive automated warehouse health reports", icon: Mail }
                  ].map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-[#EA580C] shadow-sm">
                             <alert.icon size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900">{alert.title}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{alert.desc}</p>
                          </div>
                       </div>
                       <Switch className="data-[state=checked]:bg-[#EA580C]" defaultChecked />
                    </div>
                  ))}
               </div>
            </section>
         </div>

         <div className="space-y-12">
            {/* Storage Controls */}
            <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white space-y-8 shadow-2xl">
               <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em]">Environment Vector</p>
               <div className="space-y-6">
                  <div className="space-y-3">
                     <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Thermometer size={12} /> Default Temp</span>
                        <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">24°C</span>
                     </div>
                     <Input type="range" className="accent-[#EA580C]" />
                  </div>
                  <div className="pt-6 border-t border-white/10">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <ShieldCheck size={18} className="text-emerald-500" />
                           <span className="text-xs font-black uppercase tracking-widest">Multi-Person Auth</span>
                        </div>
                        <Switch />
                     </div>
                     <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase tracking-wider">Requires two staff members to approve bulk stock transfers out of the godown for enhanced security.</p>
                  </div>
               </div>
            </section>

            {/* Support Box */}
            <section className="bg-orange-50 p-8 rounded-[2.5rem] border-2 border-orange-100 flex flex-col items-center text-center space-y-4">
               <div className="h-16 w-16 rounded-[1.25rem] bg-white flex items-center justify-center text-[#EA580C] shadow-lg">
                  <User size={32} />
               </div>
               <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Need <span className="text-orange-600">Help?</span></h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Contact your regional godown administrator for hardware setup and access control management.</p>
               <Button variant="outline" className="w-full h-12 rounded-xl border-[#EA580C] text-[#EA580C] font-black uppercase tracking-widest text-[9px] hover:bg-white">
                  Chat with Support
               </Button>
            </section>
         </div>
      </div>
    </div>
  );
};

// Internal Clock for local use
function Clock({ size }: { size: number }) { 
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

export default GodownSettings;
