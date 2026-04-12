import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Star, ChevronLeft, ShieldCheck, Truck, RefreshCw, MessageSquare, Plus, Minus, Tag, Zap, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      const [catRes, reviewRes] = await Promise.all([
        api.get(`/public/catalog?category=${data.category}`),
        api.get(`/products/${id}/reviews`),
      ]);
      setRelatedProducts(catRes.data.filter((p: any) => p._id !== id).slice(0, 4));
      setReviews(reviewRes.data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Product not found" });
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const submitReview = async () => {
    if (!user) { navigate('/login'); return; }
    if (!reviewForm.comment.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please write a comment' });
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      toast({ title: '✓ Review Submitted', description: 'Thanks for your feedback!' });
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      const { data } = await api.get(`/products/${id}/reviews`);
      setReviews(data);
      // refresh product rating
      const { data: p } = await api.get(`/products/${id}`);
      setProduct(p);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Could not submit review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const addToCart = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post("/cart/add", { productId: id, qty });
      toast({ title: "Added to Cart", description: `${qty} item(s) added successfully` });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: "Could not add to cart" });
    }
  };

  const addToWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post("/wishlist/add", { productId: id });
      toast({ title: "Saved", description: "Added to your wishlist" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Already in wishlist or error" });
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><div className="page-loader" /></div>;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>home</span>
            <span className="text-slate-300">/</span>
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/catalog')}>catalog</span>
            <span className="text-slate-300">/</span>
            <span className="text-primary">product</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="w-fit h-auto p-0 hover:bg-transparent rounded-xl font-bold flex items-center gap-2 text-slate-500 group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> BACK TO COLLECTION
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center overflow-hidden relative group "
            >
              <ShoppingBag size={120} className="text-slate-100 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="absolute top-8 left-8">
                 <Badge className="px-5 py-2 rounded-full bg-slate-900 border-none text-white font-black italic text-[10px] tracking-[0.2em] uppercase">
                    Premium Quality
                 </Badge>
              </div>

              {product?.quantity === 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                   <div className="px-10 py-4 bg-rose-500 text-white rounded-[2rem]  rotate-[-12deg] font-black uppercase tracking-[0.3em] text-sm">
                      OUT OF STOCK
                   </div>
                </div>
              )}
            </motion.div>
            
            <div className="grid grid-cols-4 gap-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center hover:border-orange-500 transition-colors cursor-pointer group">
                   <ShoppingBag size={24} className="text-slate-200 group-hover:text-slate-400" />
                 </div>
               ))}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-6 flex items-center gap-4">
                <Badge variant="outline" className="bg-orange-50 text-orange-500 border-orange-100 px-4 py-2 rounded-xl flex items-center gap-2 font-black italic tracking-widest text-[9px]">
                   <Tag size={12} /> {product?.category}
                </Badge>
                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                   <Star size={12} fill="currentColor" />
                   <span className="text-[10px] font-black italic">{product?.rating || 4.5} <span className="text-slate-400">({product?.numReviews || 24} Reviews)</span></span>
                </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter text-slate-900 leading-[0.9] mb-6">
               {product?.productName} <br />
               <span className="text-orange-500 not-italic">EDITION.</span>
            </h1>

            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 max-w-xl italic uppercase tracking-wider shadow-slate-100">
               {product?.description || "Experience the pinnacle of engineering with our latest collection. Specifically crafted for those who demand excellence in every detail."}
            </p>

            <div className="mb-12">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">Price Total</p>
               <span className="text-5xl font-black italic text-slate-900 tracking-tighter leading-none">₹{product?.price}</span>
               <span className="text-slate-400 font-bold ml-4 text-lg italic line-through decoration-orange-500/50">₹{product?.price + 499}</span>
            </div>

            <div className="space-y-8">
               <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                     <button 
                       onClick={() => setQty(q => Math.max(1, q - 1))}
                       className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-all shadow-sm active:scale-90"
                     >
                        <Minus size={16} className="text-slate-400" />
                     </button>
                     <span className="w-8 text-center text-xl font-black italic text-slate-900 leading-none">{qty}</span>
                     <button 
                       onClick={() => setQty(q => q + 1)}
                       className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-all shadow-sm active:scale-90"
                     >
                        <Plus size={16} className="text-orange-500" />
                     </button>
                  </div>

                  <Button 
                    onClick={addToCart}
                    disabled={product?.quantity === 0}
                    className="h-16 px-10 flex-1 sm:flex-none rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs gap-3  active:scale-95 transition-all group lg:min-w-[240px]"
                  >
                    ADD TO CART <ShoppingBag size={18} className="group-hover:rotate-12 transition-transform" />
                  </Button>

                  <button 
                    onClick={addToWishlist}
                    className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white hover:border-slate-200 transition-all active:scale-90"
                  >
                     <Heart size={24} />
                  </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
                  {[
                    { icon: ShieldCheck, label: "2 Year Guarantee", color: "text-emerald-500" },
                    { icon: Truck, label: "Express Delivery", color: "text-blue-500" },
                    { icon: RefreshCw, label: "Refund Policy", color: "text-orange-500" },
                    { icon: Zap, label: "Instant Access", color: "text-amber-500" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group hover:bg-white hover:shadow-sm transition-all duration-300">
                       <item.icon size={18} className={item.color} />
                       <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 italic leading-none">{item.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-16 pt-16 border-t border-slate-100">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">PEOPLE <span className="text-orange-500 not-italic">ALSO BOUGHT.</span></h3>
                  <Badge variant="outline" className="rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 border-orange-200 text-orange-500">
                     <Zap size={14} /> AI Suggested
                  </Badge>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {relatedProducts.map((p: any, i: number) => (
                    <motion.div 
                      key={p._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/product/${p._id}`)}
                      className="group cursor-pointer"
                    >
                       <div className="aspect-[4/5] bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-3 relative overflow-hidden group-hover:border-orange-200 transition-all">
                          <ShoppingBag size={40} className="text-slate-100 group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/5 transition-all" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{p.category}</p>
                       <p className="text-sm font-black italic text-slate-900 leading-none mb-2">{p.productName}</p>
                       <p className="text-sm font-black text-orange-500 italic leading-none">₹{p.price}</p>
                    </motion.div>
                  ))}
               </div>
            </div>

            <div className="mt-16 pt-16 border-t border-slate-100">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">CUSTOMER <span className="text-orange-500 not-italic">REVIEWS</span></h3>
                  <Button variant="outline" onClick={() => user ? setShowReviewModal(true) : navigate('/login')} className="rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 hover:bg-slate-50 shadow-sm leading-none py-1 h-9">
                     <MessageSquare size={14} /> Write Review
                  </Button>
               </div>

               {reviews.length === 0 ? (
                 <div className="text-center py-10">
                   <MessageSquare size={32} className="mx-auto text-slate-200 mb-3" />
                   <p className="font-black italic text-slate-300 uppercase tracking-[0.2em] text-xs">No reviews yet. Be the first to review!</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {reviews.map((review: any, i: number) => (
                     <motion.div
                       key={review._id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="p-6 rounded-2xl bg-slate-50 border border-slate-100"
                     >
                       <div className="flex items-start justify-between mb-3">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                             <User size={18} />
                           </div>
                           <div>
                             <p className="text-sm font-black text-slate-900">{review.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-0.5">
                           {Array.from({ length: 5 }).map((_, idx) => (
                             <Star key={idx} size={14} className={idx < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                           ))}
                         </div>
                       </div>
                       <p className="text-sm text-slate-600 font-medium leading-relaxed">{review.comment}</p>
                     </motion.div>
                   ))}
                 </div>
               )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
              {showReviewModal && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black italic text-slate-900 uppercase">Write a <span className="text-orange-500 not-italic">Review</span></h3>
                      <button onClick={() => setShowReviewModal(false)} className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500">
                        <X size={18} />
                      </button>
                    </div>

                    {/* Star Rating Picker */}
                    <div className="mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Rating</p>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setReviewForm(f => ({ ...f, rating: idx + 1 }))}
                            className="transition-transform hover:scale-125 active:scale-95"
                          >
                            <Star
                              size={32}
                              className={idx < reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm font-black text-slate-500">{reviewForm.rating}/5</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Comment</p>
                      <textarea
                        rows={4}
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 transition-all"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowReviewModal(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
                      <Button
                        onClick={submitReview}
                        disabled={submittingReview || !reviewForm.comment.trim()}
                        className="flex-1 h-12 rounded-xl font-black bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProductDetail;
