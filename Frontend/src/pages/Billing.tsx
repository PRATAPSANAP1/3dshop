import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Receipt, Printer, Eye, X, ScanLine, Search,
  IndianRupee, Calendar, FileText, Hash, CreditCard,
  User as UserIcon, Phone, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import SkeletonCard from "@/components/SkeletonCard";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── 6cm Thermal Receipt HTML Generator ───
const generateReceiptHTML = (bill: any) => {
  const itemsHtml = bill.items.map((item: any, i: number) =>
    `<tr>
      <td style="padding:2px 0;font-size:10px;border-bottom:1px dotted #ddd">${item.productName}</td>
      <td style="padding:2px 0;font-size:10px;text-align:center;border-bottom:1px dotted #ddd">${item.quantity}</td>
      <td style="padding:2px 0;font-size:10px;text-align:right;border-bottom:1px dotted #ddd">₹${item.price}</td>
      <td style="padding:2px 0;font-size:10px;text-align:right;border-bottom:1px dotted #ddd;font-weight:700">₹${item.total}</td>
    </tr>`
  ).join('');

  const billId = bill.billNo || bill.invoiceNumber || '';
  const dateStr = new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const payMethod = (bill.paymentMethod || 'cash').toUpperCase();

  return `<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${billId}</title>
  <style>
    @page { size: 6cm auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Lucida Console', monospace;
      width: 6cm;
      margin: 0 auto;
      padding: 6px 8px;
      background: #fff;
      color: #000;
      -webkit-print-color-adjust: exact;
    }
    .center { text-align: center; }
    .shop-name { font-size: 16px; font-weight: 900; letter-spacing: 2px; margin-bottom: 1px; }
    .shop-sub { font-size: 8px; color: #666; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px dashed #333; margin: 5px 0; }
    .bill-id { font-size: 9px; font-weight: 700; background: #f0f0f0; padding: 3px 6px; border-radius: 3px; display: inline-block; margin: 3px 0; letter-spacing: 0.5px; }
    .meta { font-size: 8px; color: #666; margin: 1px 0; }
    .meta-row { display: flex; justify-content: space-between; font-size: 8px; color: #555; margin: 1px 0; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    th { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; border-bottom: 1px solid #ccc; padding: 2px 0; text-align: left; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
    th:last-child { text-align: right; }
    .subtotal-row { display: flex; justify-content: space-between; font-size: 9px; padding: 2px 0; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; padding: 4px 0; border-top: 2px dashed #333; margin-top: 3px; }
    .footer { text-align: center; margin-top: 6px; padding-top: 5px; border-top: 1px dashed #999; }
    .thanks { font-size: 11px; font-weight: 800; margin-bottom: 2px; }
    .footer-sub { font-size: 7px; color: #888; }
    .payment-badge { display: inline-block; font-size: 8px; font-weight: 700; padding: 2px 8px; border: 1px solid #333; border-radius: 3px; margin: 3px 0; letter-spacing: 1px; }
    @media print {
      body { width: 6cm; padding: 4px 6px; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-name">3Dshop</div>
    <div class="shop-sub">EXCLUSIVE INVOICE</div>
  </div>
  <hr class="divider">
  <div class="center">
    <div class="bill-id">${billId}</div>
  </div>
  <div class="meta-row"><span>Date:</span><span>${dateStr}</span></div>
  <div class="meta-row"><span>Customer:</span><span>${bill.customerName || 'Walk-in'}</span></div>
  ${bill.customerPhone ? `<div class="meta-row"><span>Phone:</span><span>${bill.customerPhone}</span></div>` : ''}
  <div class="center"><span class="payment-badge">${payMethod}</span></div>
  <hr class="divider">
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th style="text-align:right">Amt</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr class="divider">
  <div class="subtotal-row"><span>Subtotal</span><span>₹${(bill.subtotal || bill.totalAmount).toFixed(2)}</span></div>
  ${bill.gstAmount ? `<div class="subtotal-row"><span>GST</span><span>₹${bill.gstAmount.toFixed(2)}</span></div>` : ''}
  <div class="total-row"><span>TOTAL</span><span>₹${bill.totalAmount.toFixed(2)}</span></div>
  <div class="footer">
    <div class="thanks">Thank You!</div>
    <div class="footer-sub">Visit Again • 3Dshop</div>
    <div class="footer-sub" style="margin-top:3px">-- ${bill.items.length} item(s) --</div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
};

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [previewBill, setPreviewBill] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billsRes, statsRes] = await Promise.all([
          api.get('/billing'),
          api.get('/billing/stats')
        ]);
        setBills(billsRes.data);
        setFilteredBills(billsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Bills fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Search by Bill ID
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredBills(bills);
      return;
    }

    // First filter locally
    const local = bills.filter(b =>
      (b.billNo || b.invoiceNumber || '').toLowerCase().includes(query.toLowerCase())
    );

    if (local.length > 0) {
      setFilteredBills(local);
    } else {
      // Search server if not found locally
      setSearchLoading(true);
      try {
        const { data } = await api.get(`/billing/search?q=${encodeURIComponent(query)}`);
        setFilteredBills(data);
      } catch {
        setFilteredBills([]);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const handlePrint = (bill: any) => {
    const printWindow = window.open('', '_blank', 'width=280,height=500');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML(bill));
      printWindow.document.close();
    }
  };

  const handleDownloadPDF = async (bill: any) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'cm', format: [6, 14] }); // 6cm x 14cm

      const billId = bill.billNo || bill.invoiceNumber || '';
      const dateStr = new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      let y = 0.5;

      // Header
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text('3Dshop', 3, y, { align: 'center' }); y += 0.4;
      doc.setFontSize(6);
      doc.setFont('courier', 'normal');
      doc.text('EXCLUSIVE INVOICE', 3, y, { align: 'center' }); y += 0.4;

      // Divider
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(0.3, y, 5.7, y); y += 0.3;

      // Bill ID
      doc.setFontSize(7);
      doc.setFont('courier', 'bold');
      doc.text(billId, 3, y, { align: 'center' }); y += 0.4;

      // Meta
      doc.setFontSize(6);
      doc.setFont('courier', 'normal');
      doc.text(`Date: ${dateStr}`, 0.3, y); y += 0.3;
      doc.text(`Customer: ${bill.customerName || 'Walk-in'}`, 0.3, y); y += 0.3;
      if (bill.customerPhone) { doc.text(`Phone: ${bill.customerPhone}`, 0.3, y); y += 0.3; }
      doc.text(`Payment: ${(bill.paymentMethod || 'CASH').toUpperCase()}`, 0.3, y); y += 0.3;

      // Divider
      doc.line(0.3, y, 5.7, y); y += 0.3;

      // Table Header
      doc.setFontSize(6);
      doc.setFont('courier', 'bold');
      doc.text('Item', 0.3, y);
      doc.text('Qty', 3.5, y, { align: 'center' });
      doc.text('Rate', 4.5, y, { align: 'right' });
      doc.text('Amt', 5.7, y, { align: 'right' }); y += 0.3;
      doc.line(0.3, y, 5.7, y); y += 0.2;

      // Items
      doc.setFont('courier', 'normal');
      bill.items.forEach((item: any) => {
        const name = item.productName.length > 14 ? item.productName.substring(0, 14) + '..' : item.productName;
        doc.text(name, 0.3, y);
        doc.text(`${item.quantity}`, 3.5, y, { align: 'center' });
        doc.text(`₹${item.price}`, 4.5, y, { align: 'right' });
        doc.setFont('courier', 'bold');
        doc.text(`₹${item.total}`, 5.7, y, { align: 'right' });
        doc.setFont('courier', 'normal');
        y += 0.3;
      });

      // Divider
      y += 0.1;
      doc.line(0.3, y, 5.7, y); y += 0.3;

      // Subtotal
      doc.setFontSize(7);
      doc.text('Subtotal', 0.3, y);
      doc.text(`₹${(bill.subtotal || bill.totalAmount).toFixed(2)}`, 5.7, y, { align: 'right' }); y += 0.3;
      if (bill.gstAmount) {
        doc.text('GST', 0.3, y);
        doc.text(`₹${bill.gstAmount.toFixed(2)}`, 5.7, y, { align: 'right' }); y += 0.3;
      }

      // Total
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(0.3, y, 5.7, y); y += 0.35;
      doc.setFontSize(11);
      doc.setFont('courier', 'bold');
      doc.text('TOTAL', 0.3, y);
      doc.text(`₹${bill.totalAmount.toFixed(2)}`, 5.7, y, { align: 'right' }); y += 0.5;

      // Footer
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(0.3, y, 5.7, y); y += 0.35;
      doc.setFontSize(9);
      doc.text('Thank You!', 3, y, { align: 'center' }); y += 0.3;
      doc.setFontSize(6);
      doc.setFont('courier', 'normal');
      doc.text('Visit Again • 3Dshop', 3, y, { align: 'center' });

      doc.save(`receipt_${billId}.pdf`);
      toast({ title: "PDF Downloaded", description: `Receipt ${billId} saved` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF" });
    }
  };

  const paymentIcon: Record<string, string> = { cash: '💵', card: '💳', upi: '📱', other: '🔗' };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <div className="skeleton-loader h-10 w-40 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-24" />)}
          </div>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-20" />)}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Bill <span className="text-orange-500 not-italic">History.</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{bills.length} invoices recorded</p>
          </div>
          <Button onClick={() => navigate('/scanner')} className="gap-2 h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm">
            <ScanLine size={16} /> New Bill
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-orange-200 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="text-xl font-black text-slate-900 italic">₹{(stats.total || 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">{stats.totalCount || 0} bills</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-200 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Sales</p>
              <p className="text-xl font-black text-emerald-600 italic">₹{(stats.todayRevenue || 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-emerald-400 mt-0.5">{stats.todayCount || 0} bills today</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-200 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Collected</p>
              <p className="text-xl font-black text-emerald-600 italic">₹{(stats.paid || 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">Paid invoices</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-amber-200 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
              <p className="text-xl font-black text-amber-600 italic">₹{(stats.pending || 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">Unpaid invoices</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by Bill ID (e.g. INV-20260412-0001)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-12 pl-11 rounded-2xl bg-white border-slate-200 font-bold text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10"
          />
          {searchLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
            </div>
          )}
        </div>

        {/* Bill List */}
        {filteredBills.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center">
            <div className="mx-auto h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
              <Receipt className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="font-heading text-xl font-black text-slate-900">
              {searchQuery ? "No Bills Found" : "No Bills Yet"}
            </h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No invoices match "${searchQuery}". Try a different ID.`
                : "Scan products using the QR Scanner to generate your first bill."
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/scanner')} className="mt-6 gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                <ScanLine size={14} /> Go to Scanner
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredBills.map((bill, i) => {
                const billId = bill.billNo || bill.invoiceNumber || '';
                const isExpanded = expandedId === bill._id;
                const payment = bill.paymentMethod || 'cash';

                return (
                  <motion.div
                    key={bill._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-orange-200 transition-all"
                  >
                    {/* Bill Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                          <Receipt size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-slate-900 truncate">{billId}</p>
                            <Badge className="border-none text-[8px] font-bold uppercase bg-emerald-100 text-emerald-700 shrink-0">
                              {bill.status || 'paid'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar size={10} />
                              {new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            <span className="whitespace-nowrap">{bill.items.length} item(s)</span>
                            <span className="whitespace-nowrap">{paymentIcon[payment] || '💵'} {payment.toUpperCase()}</span>
                            {bill.customerName && bill.customerName !== 'Walk-in Customer' && (
                              <span className="flex items-center gap-1 whitespace-nowrap"><UserIcon size={10} />{bill.customerName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:ml-auto">
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-900 italic">₹{bill.totalAmount.toLocaleString()}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : bill._id)}
                            className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-500 flex items-center justify-center transition-all"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setPreviewBill(bill)}
                            className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-500 flex items-center justify-center transition-all"
                            title="Preview Receipt"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => handlePrint(bill)}
                            className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 flex items-center justify-center transition-all"
                            title="Print"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(bill)}
                            className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 flex items-center justify-center transition-all"
                            title="Download PDF"
                          >
                            <Download size={15} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0">
                            <div className="bg-slate-50 rounded-2xl p-4">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-200">
                                    <th className="text-left text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">#</th>
                                    <th className="text-left text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">Product</th>
                                    <th className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">Qty</th>
                                    <th className="text-right text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">Price</th>
                                    <th className="text-right text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bill.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100/60">
                                      <td className="py-2 text-slate-400 font-bold text-xs">{idx + 1}</td>
                                      <td className="py-2 font-bold text-slate-700 text-xs">{item.productName}</td>
                                      <td className="py-2 text-center font-black text-slate-600 text-xs">{item.quantity}</td>
                                      <td className="py-2 text-right font-bold text-slate-600 text-xs">₹{item.price}</td>
                                      <td className="py-2 text-right font-black text-slate-900 text-xs">₹{item.total}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-dashed border-slate-200">
                                <div className="flex gap-4">
                                  {bill.subtotal && (
                                    <div>
                                      <p className="text-[8px] font-black text-slate-400 uppercase">Subtotal</p>
                                      <p className="text-sm font-bold text-slate-600">₹{bill.subtotal}</p>
                                    </div>
                                  )}
                                  {bill.gstAmount > 0 && (
                                    <div>
                                      <p className="text-[8px] font-black text-slate-400 uppercase">GST</p>
                                      <p className="text-sm font-bold text-slate-600">₹{bill.gstAmount}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                                  <p className="text-2xl font-black text-orange-500 italic">₹{bill.totalAmount.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ Receipt Preview Modal ═══ */}
        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {previewBill && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              >
                <div onClick={() => setPreviewBill(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative bg-white rounded-[2rem] overflow-hidden shadow-xl max-h-[90vh] flex flex-col"
                  style={{ width: '320px' }}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase italic">Receipt Preview</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">6cm thermal format</p>
                    </div>
                    <button onClick={() => setPreviewBill(null)} className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Receipt Preview — 6cm simulated width */}
                  <div className="overflow-y-auto flex-1 p-5 bg-slate-50 flex justify-center">
                    <div
                      className="bg-white border border-slate-200 shadow-sm rounded-lg"
                      style={{ width: '226px', fontFamily: "'Courier New', monospace", padding: '12px 10px' }}
                    >
                      {/* Shop name */}
                      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '2px' }}>3Dshop</div>
                        <div style={{ fontSize: '7px', color: '#888', letterSpacing: '1px' }}>EXCLUSIVE INVOICE</div>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '6px 0' }} />

                      {/* Bill ID */}
                      <div style={{ textAlign: 'center', margin: '4px 0' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, background: '#f5f5f5', padding: '3px 8px', borderRadius: '3px', display: 'inline-block' }}>
                          {previewBill.billNo || previewBill.invoiceNumber}
                        </span>
                      </div>

                      {/* Meta */}
                      <div style={{ fontSize: '8px', color: '#666', margin: '4px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Date:</span>
                          <span>{new Date(previewBill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Customer:</span>
                          <span>{previewBill.customerName || 'Walk-in'}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', margin: '4px 0' }}>
                        <span style={{ fontSize: '7px', fontWeight: 700, border: '1px solid #333', padding: '2px 6px', borderRadius: '2px', letterSpacing: '1px' }}>
                          {(previewBill.paymentMethod || 'cash').toUpperCase()}
                        </span>
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '6px 0' }} />

                      {/* Items */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: 700, color: '#888', fontSize: '7px' }}>Item</th>
                            <th style={{ textAlign: 'center', padding: '2px 0', fontWeight: 700, color: '#888', fontSize: '7px' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: 700, color: '#888', fontSize: '7px' }}>Amt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewBill.items.map((item: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px dotted #eee' }}>
                              <td style={{ padding: '3px 0', fontSize: '8px' }}>{item.productName}</td>
                              <td style={{ padding: '3px 0', fontSize: '8px', textAlign: 'center' }}>{item.quantity}</td>
                              <td style={{ padding: '3px 0', fontSize: '8px', textAlign: 'right', fontWeight: 700 }}>₹{item.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '6px 0' }} />

                      {/* Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, padding: '4px 0' }}>
                        <span>TOTAL</span>
                        <span>₹{previewBill.totalAmount.toFixed(2)}</span>
                      </div>

                      {/* Footer */}
                      <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '6px 0' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800 }}>Thank You!</div>
                        <div style={{ fontSize: '7px', color: '#888' }}>Visit Again • 3Dshop</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <Button
                      onClick={() => handlePrint(previewBill)}
                      className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest gap-2"
                    >
                      <Printer size={14} /> Print
                    </Button>
                    <Button
                      onClick={() => handleDownloadPDF(previewBill)}
                      className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest gap-2"
                    >
                      <Download size={14} /> PDF
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </PageTransition>
  );
};

export default Billing;
