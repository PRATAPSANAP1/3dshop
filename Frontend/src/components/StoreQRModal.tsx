import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, FileDown, QrCode, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

interface StoreQRModalProps {
  open: boolean;
  onClose: () => void;
  shopName: string;
}

const PREVIEW_PX = 320;

const StoreQRModal = ({ open, onClose, shopName }: StoreQRModalProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const displayShopName = shopName || 'MainStore';
  const qrTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store-map/${encodeURIComponent(displayShopName)}`
    : `/store-map/${encodeURIComponent(displayShopName)}`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(qrTargetUrl, {
      width: 512,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl).catch(err => console.error("QR Code Error:", err));
  }, [displayShopName, qrTargetUrl, open]);

  useEffect(() => {
    if (!open || !canvasRef.current || !qrDataUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 400;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Top banner
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#EA580C');
    grad.addColorStop(1, '#D97706');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 90);

    // Header text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("IN-STORE 3D NAVIGATOR", width / 2, 40);

    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(`STORE: ${displayShopName.toUpperCase()}`, width / 2, 68);

    // QR Code Image
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 240;
      const qrX = (width - qrSize) / 2;
      const qrY = 110;
      
      // QR border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Subtitle / Instructions
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.fillText("SCAN TO OPEN 3D STORE MAP", width / 2, 385);

      ctx.fillStyle = "#64748b";
      ctx.font = "11px 'Inter', sans-serif";
      ctx.fillText("Scan this QR code at store entrance to navigate racks,", width / 2, 410);
      ctx.fillText("locate products & find item shelves live.", width / 2, 428);

      // Footer brand
      ctx.fillStyle = "#ea580c";
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.fillText("POWERED BY 3DSHOP IN-STORE VISION", width / 2, 470);
    };
    qrImg.src = qrDataUrl;
  }, [qrDataUrl, displayShopName, open]);

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=500,height=650");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Store 3D QR Code - ${shopName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              background: #fff;
              font-family: sans-serif;
            }
            img { 
              width: 10cm; 
              height: 12.5cm; 
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <script>
            window.onload = function() { 
              setTimeout(function() { window.print(); }, 300); 
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    if (!canvasRef.current) return;
    const doc = new jsPDF({
      unit: "cm",
      format: [10, 12.5],
    });
    const dataUrl = canvasRef.current.toDataURL("image/png", 1.0);
    doc.addImage(dataUrl, "PNG", 0, 0, 10, 12.5);
    doc.save(`Store_3D_QR_${shopName.replace(/\s+/g, '_')}.pdf`);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 relative flex flex-col items-center"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 mb-4 self-start">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
              >
                <QrCode size={22} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-black text-slate-900 tracking-tight uppercase italic leading-none">
                  In-Store <span className="text-orange-500 not-italic">3D QR Code</span>
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Entrance Display Poster
                </p>
              </div>
            </div>

            <div className="w-full bg-orange-50/60 border border-orange-100 rounded-2xl p-3 mb-4 flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles size={16} className="text-orange-500 shrink-0" />
              <span>Customers scan this QR code inside your shop to view your interactive 3D map!</span>
            </div>

            <div className="border border-slate-200 rounded-2xl p-2 bg-white shadow-sm mb-4 max-w-full overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={500}
                className="w-full h-auto max-h-[360px] object-contain rounded-xl"
              />
            </div>

            <div className="w-full flex gap-3">
              <Button
                onClick={handlePrint}
                className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-95"
              >
                <Printer size={16} />
                Print Poster
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm border-none text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
              >
                <FileDown size={16} />
                Download PDF
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StoreQRModal;
