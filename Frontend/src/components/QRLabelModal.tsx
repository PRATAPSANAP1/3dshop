import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, FileDown, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

interface QRLabelModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    productName: string;
    price: number;
    qrCode: string;
    category?: string;
  } | null;
}

// 2×2cm = 56.69pt in PDF points (1cm = 28.346pt)
const LABEL_CM = 2;
const LABEL_PT = LABEL_CM * 28.346;
// Preview size in pixels (scaled up for screen readability)
const PREVIEW_PX = 200;

const QRLabelModal = ({ open, onClose, product }: QRLabelModalProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!product?.qrCode) return;
    QRCode.toDataURL(product.qrCode, {
      width: 256,
      margin: 0,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setQrDataUrl);
  }, [product?.qrCode]);

  // Draw the 2×2cm label on canvas for preview
  useEffect(() => {
    if (!canvasRef.current || !qrDataUrl || !product) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const size = PREVIEW_PX;
    canvasRef.current.width = size;
    canvasRef.current.height = size;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

    // QR Code (centered, top portion)
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = size * 0.55;
      const qrX = (size - qrSize) / 2;
      const qrY = size * 0.06;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Product name (truncated)
      const name = product.productName.length > 16
        ? product.productName.slice(0, 15) + "…"
        : product.productName;
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${size * 0.065}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.fillText(name, size / 2, qrY + qrSize + size * 0.08);

      // Price
      ctx.fillStyle = "#EA580C";
      ctx.font = `bold ${size * 0.075}px 'Courier New', monospace`;
      ctx.fillText(`₹${product.price}`, size / 2, qrY + qrSize + size * 0.17);

      // QR code value (small, bottom)
      const code = product.qrCode.length > 20
        ? product.qrCode.slice(0, 19) + "…"
        : product.qrCode;
      ctx.fillStyle = "#94a3b8";
      ctx.font = `${size * 0.045}px 'Courier New', monospace`;
      ctx.fillText(code, size / 2, size * 0.95);
    };
    qrImg.src = qrDataUrl;
  }, [qrDataUrl, product]);

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=300,height=300");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Label - ${product?.productName || "Product"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { 
              size: 2cm 2cm; 
              margin: 0; 
            }
            body { 
              width: 2cm; 
              height: 2cm; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              overflow: hidden;
            }
            img { 
              width: 2cm; 
              height: 2cm; 
              image-rendering: crisp-edges;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <script>
            window.onload = function() { 
              setTimeout(function() { window.print(); }, 200); 
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    if (!canvasRef.current || !product) return;

    // Create a PDF exactly 2×2cm
    const doc = new jsPDF({
      unit: "cm",
      format: [LABEL_CM, LABEL_CM],
    });

    const dataUrl = canvasRef.current.toDataURL("image/png", 1.0);
    doc.addImage(dataUrl, "PNG", 0, 0, LABEL_CM, LABEL_CM);

    const safeName = product.productName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
    doc.save(`QR_${safeName}.pdf`);
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 relative flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:rotate-90 transition-all"
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
              >
                <QrCode size={22} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-black text-slate-900 tracking-tight uppercase italic leading-none">
                  QR <span className="text-orange-500 not-italic">Label</span>
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  2×2cm Print-Ready
                </p>
              </div>
            </div>

            {/* Product Info */}
            <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-black text-slate-900 truncate">{product.productName}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {product.category || "General"} • ₹{product.price} • {product.qrCode}
              </p>
            </div>

            {/* Label Preview */}
            <div className="flex flex-col items-center mb-4 mt-2">
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-2 bg-white flex justify-center items-center">
                <canvas
                  ref={canvasRef}
                  width={PREVIEW_PX}
                  height={PREVIEW_PX}
                  className="block max-w-full h-auto max-h-[160px] object-contain"
                  style={{ width: PREVIEW_PX, height: PREVIEW_PX }}
                />
                {/* Corner dimension marks */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                  2cm × 2cm
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto pt-2">
              <Button
                onClick={handlePrint}
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-95"
              >
                <Printer size={16} />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm border-none text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #EA580C 0%, #D97706 100%)" }}
              >
                <FileDown size={16} />
                PDF
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRLabelModal;
