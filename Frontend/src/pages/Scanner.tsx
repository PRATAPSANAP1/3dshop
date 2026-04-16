import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Camera, X, CheckCircle, AlertTriangle, Minus, Plus, Receipt, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ScannedItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  remainingStock: number;
  minStockLevel: number;
}

const Scanner = () => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [billItems, setBillItems] = useState<ScannedItem[]>([]);
  const [generatedBill, setGeneratedBill] = useState<any>(null);
  const [scanMode, setScanMode] = useState<"billing" | "inventory">("billing");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const billRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraOpen(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please allow camera permission or use the manual QR code entry below."
      });
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScanItem = async (qrCode: string) => {
    if (!qrCode.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a QR code" });
      return;
    }
    setLoading(true);
    try {
      if (scanMode === "billing") {
        const { data } = await api.post('/products/scan', { qrCode: qrCode.trim(), quantityTaken: quantity });
        
        const existingIndex = billItems.findIndex(item => item.productId === data._id);
        if (existingIndex >= 0) {
          const updated = [...billItems];
          updated[existingIndex].quantity += quantity;
          updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].price;
          updated[existingIndex].remainingStock = data.quantity;
          setBillItems(updated);
        } else {
          setBillItems(prev => [...prev, {
            productId: data._id,
            productName: data.productName,
            price: data.price,
            quantity: quantity,
            total: data.price * quantity,
            remainingStock: data.quantity,
            minStockLevel: data.minStockLevel,
          }]);
        }
        toast({ title: "Product Added", description: `${data.productName} added to bill` });
      } else {
        const { data } = await api.put('/products/update-stock-qr', { qrCode: qrCode.trim(), quantityChange: quantity });
        toast({ title: "Stock Updated", description: `${data.productName} stock is now ${data.quantity}` });
      }

      setManualCode("");
      setQuantity(1);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: err.response?.data?.error || "Product not found or update failed"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  const billTotal = billItems.reduce((sum, item) => sum + item.total, 0);

  const generateBill = async () => {
    if (billItems.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Add items to the bill first" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/billing', {
        items: billItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }))
      });
      setGeneratedBill(data);
      closeCamera();
      toast({ variant: "success", title: "Bill Generated!", description: `Bill ${data.billNo} created successfully` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate bill" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!billRef.current) return;
    const printContent = billRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${generatedBill?.billNo}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Courier New', monospace; padding: 20px; max-width: 380px; margin: 0 auto; }
              .bill-header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
              .bill-header h1 { font-size: 22px; font-weight: 900; letter-spacing: 2px; }
              .bill-header p { font-size: 11px; color: #666; margin-top: 4px; }
              .bill-no { text-align: center; font-size: 13px; font-weight: 700; margin: 8px 0; padding: 6px; background: #f5f5f5; border-radius: 4px; }
              .bill-date { text-align: center; font-size: 11px; color: #888; margin-bottom: 12px; }
              table { width: 100%; border-collapse: collapse; margin: 12px 0; }
              th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #ddd; padding: 6px 4px; }
              th:last-child, td:last-child { text-align: right; }
              th:nth-child(2), td:nth-child(2) { text-align: center; }
              th:nth-child(3), td:nth-child(3) { text-align: right; }
              td { padding: 8px 4px; font-size: 12px; border-bottom: 1px dotted #eee; }
              .total-row { border-top: 2px dashed #333; padding-top: 10px; margin-top: 8px; display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; }
              .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #333; padding-top: 12px; }
              .footer p { font-size: 11px; color: #888; }
              .footer .thanks { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 4px; }
              @media print { body { padding: 10px; } }
            </style>
          </head>
          <body>${printContent}
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const startNewBill = () => {
    setBillItems([]);
    setGeneratedBill(null);
    setManualCode("");
    setQuantity(1);
  };

  if (generatedBill) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-3xl font-black text-primary tracking-tight uppercase italic">
              Bill<span className="text-slate-900 not-italic">Generated</span>
            </h1>
            <div className="flex gap-3">
              <Button onClick={handlePrint} className="gap-2 h-12 px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm">
                <Printer size={16} /> Print Bill
              </Button>
              <Button onClick={startNewBill} variant="outline" className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-xs">
                New Bill
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card p-8 border-l-4"
            style={{ borderLeftColor: '#EA580C' }}
          >
            <div ref={billRef}>
              <div className="bill-header">
                <h1>SmartStore</h1>
                <p>Retail Management Suite</p>
              </div>
              <div className="bill-no">{generatedBill.billNo}</div>
              <div className="bill-date">{new Date(generatedBill.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</div>
              <table>
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {generatedBill.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="total-row">
                <span>TOTAL</span>
                <span>₹{generatedBill.totalAmount}</span>
              </div>
              <div className="footer">
                <p className="thanks">Thank You!</p>
                <p>Visit Again</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="h-12 w-12 bg-emerald/10 rounded-2xl flex items-center justify-center text-emerald">
                  <CheckCircle size={24} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-emerald uppercase tracking-widest">Transaction Complete</p>
                  <p className="text-sm font-bold text-slate-700">{generatedBill.items.length} item(s) • ₹{generatedBill.totalAmount}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-heading text-3xl font-black text-primary tracking-tight uppercase italic">
          QR<span className="text-slate-900 not-italic">Scanner</span>
          <span className="text-slate-400 not-italic font-normal lowercase tracking-widest text-lg ml-2">/ scanner suite</span>
        </h1>

        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
           <button 
             onClick={() => setScanMode("billing")}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === "billing" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
           >
             Billing Mode
           </button>
           <button 
             onClick={() => setScanMode("inventory")}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === "inventory" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
           >
             Inventory Mode
           </button>
        </div>

        <AnimatePresence>
          {cameraOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-black"
              style={{ minHeight: 320 }}
            >
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl" style={{ minHeight: 320 }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary/60 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <motion.div className="absolute left-2 right-2 h-0.5 bg-primary/80 rounded" animate={{ top: ["10%", "90%", "10%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                </div>
              </div>
              <button onClick={closeCamera} className="absolute top-4 right-4 h-10 w-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-sm">
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 flex gap-2">
                <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Type QR code..." className="h-11 rounded-xl font-bold flex-1" onKeyDown={(e) => e.key === 'Enter' && handleScanItem(manualCode)} />
                <Button onClick={() => handleScanItem(manualCode)} disabled={loading} className="h-11 px-5 rounded-xl bg-primary text-white font-black text-xs">
                  {loading ? "..." : "Add"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!cameraOpen && (
          <div className="stat-card p-8 space-y-6 border-l-4" style={{ borderLeftColor: '#EA580C' }}>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center">
                <ScanLine className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-black text-slate-900 uppercase tracking-tight">Scan Products</h2>
                <p className="text-sm text-slate-500 font-medium">Scan multiple items, then generate the bill</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={openCamera} className="gap-2 h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm">
                <Camera className="h-4 w-4" /> Open Camera
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Enter QR code manually..." className="h-12 w-full rounded-xl font-bold" onKeyDown={(e) => e.key === 'Enter' && handleScanItem(manualCode)} />
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 sm:flex-none items-center justify-between gap-1 bg-slate-50 rounded-xl px-2 shrink-0">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-black text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary">
                    <Plus size={14} />
                  </button>
                </div>
                <Button onClick={() => handleScanItem(manualCode)} disabled={loading || !manualCode.trim()} className="h-12 flex-1 sm:flex-none sm:px-6 bg-slate-900 hover:bg-primary text-white rounded-xl font-black text-xs transition-all shrink-0">
                  {loading ? "..." : "Add"}
                </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {billItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card p-6 space-y-4 border-l-4" style={{ borderLeftColor: '#10B981' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-base font-black text-slate-900 uppercase tracking-tight">Current Bill</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{billItems.length} item(s)</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest py-3 pr-4">Product</th>
                    <th className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-3 px-2">Qty</th>
                    <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest py-3 px-2">Price</th>
                    <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest py-3 px-2">Total</th>
                    <th className="py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, i) => (
                    <motion.tr
                      key={item.productId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-slate-50 group"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        {item.remainingStock < item.minStockLevel && (
                          <span className="text-[9px] font-black text-rose uppercase tracking-wider flex items-center gap-1 mt-0.5">
                            <AlertTriangle size={10} /> Low stock: {item.remainingStock} left
                          </span>
                        )}
                      </td>
                      <td className="text-center py-3 px-2 font-black text-slate-700">{item.quantity}</td>
                      <td className="text-right py-3 px-2 font-bold text-slate-600">₹{item.price}</td>
                      <td className="text-right py-3 px-2 font-black text-slate-900">₹{item.total}</td>
                      <td className="py-3 pl-2">
                        <button onClick={() => removeItem(i)} className="h-7 w-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose/10 hover:text-rose flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-slate-200">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                <p className="font-heading text-3xl font-black text-slate-900 italic">₹{billTotal}</p>
              </div>
              <Button onClick={generateBill} disabled={loading} className="gap-2 h-14 px-8 bg-emerald hover:bg-emerald/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm">
                <Receipt size={18} />
                {loading ? "Generating..." : "Generate Bill"}
              </Button>
            </div>
          </motion.div>
        )}

        {billItems.length === 0 && !cameraOpen && (
          <div className="text-center py-10">
            <p className="text-sm font-bold text-slate-400">Scan products above to start building a bill</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Scanner;
