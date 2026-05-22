import { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://shubhangi-collection-backend.onrender.com";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Collection", href: `${BACKEND_URL}/collection` },
  { label: "Beauty Parlour", href: `${BACKEND_URL}/booking` },
  { label: "Orders", href: `${BACKEND_URL}/api/user/order` },
  { label: "Contact", href: `${BACKEND_URL}/contact` },
];

const SAMPLE_PRODUCTS = [
  { id: "prod001", name: "Bangles", category: "Apparel", price: 59.99, rating: 4.5 },
  { id: "prod002", name: "Anklet", category: "Accessories", price: 129.0, rating: 4.0 },
  { id: "prod003", name: "Earrings", category: "Jewelry", price: 35.5, rating: 5.0 },
  { id: "prod004", name: "Nose Rings", category: "Jewelry", price: 75.0, rating: 3.5 },
  { id: "prod005", name: "Necklace", category: "Jewelry", price: 25.0, rating: 4.5 },
  { id: "prod006", name: "Watches", category: "Accessories", price: 45.0, rating: 5.0 },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = rating >= s;
        const half = !filled && rating >= s - 0.5;
        return (
          <span key={s} style={{ color: filled || half ? "#D4A853" : "#555", fontSize: 13 }}>
            {filled ? "★" : half ? "⯨" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

function ProductCard({ product, onWishlist, wishlisted }: any) {
  return (
    <div style={styles.card}>
      <button
        onClick={() => onWishlist(product.id)}
        style={{ ...styles.wishBtn, color: wishlisted ? "#E8A0BF" : "rgba(255,255,255,0.7)" }}
        title="Wishlist"
      >
        {wishlisted ? "♥" : "♡"}
      </button>
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{product.name}</h3>
        <span style={styles.cardCat}>Category: {product.category}</span>
        <p style={styles.cardPrice}>₹{product.price.toFixed(2)}</p>
        <StarRating rating={product.rating} />
        <button style={styles.addBtn}>Add to Cart</button>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(200);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("featured");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);

  const sidebarRef = useRef(null);

  useEffect(() => {
    applyFilters();
  }, [maxPrice, selectedCats, selectedRatings, sortBy]);

  function applyFilters() {
    let filtered = SAMPLE_PRODUCTS.filter((p) => {
      if (selectedCats.length > 0 && !selectedCats.includes(p.category)) return false;
      if (p.price > maxPrice) return false;
      if (selectedRatings.length > 0 && !selectedRatings.some((r) => p.rating >= r)) return false;
      return true;
    });

    if (sortBy === "price-asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);

    setProducts(filtered);
  }

  function toggleCat(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleRating(r: number) {
    const n = parseInt(r.toString());
    setSelectedRatings((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }

  function toggleWishlist(id: string) {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div style={styles.root}>
      {/* BG overlay */}
      <div style={styles.bgOverlay} />

      {/* Header */}
      <header style={styles.header}>
        <a href="/" style={styles.logo}>
          Shubhangi<span style={styles.logoSub}>Collection</span>
        </a>

        {/* Desktop Nav */}
        <nav style={styles.desktopNav}>
          <ul style={styles.navList}>
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} style={styles.navLink}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div style={styles.headerRight}>
          {/* Filter toggle (mobile) */}
          <button
            style={styles.iconBtn}
            onClick={() => setSidebarOpen((v) => !v)}
            title="Filters"
            className="filter-toggle"
          >
            {sidebarOpen ? "✖" : "⚙"}
          </button>

          {/* Nav icons */}
          <div style={styles.navIcons}>
            {[
              { icon: "🤍", href: `${BACKEND_URL}/api/user/wishlist`, title: "Wishlist" },
              { icon: "🛍", href: `${BACKEND_URL}/api/user/cart`, title: "Cart" },
              { icon: "🚚", href: `${BACKEND_URL}/api/user/delivery`, title: "Delivery" },
              { icon: "👤", href: `${BACKEND_URL}/api/user/profile`, title: "Profile" },
            ].map((ic) => (
              <a key={ic.title} href={ic.href} style={styles.navIconLink as any} title={ic.title}>
                {ic.icon}
              </a>
            ))}
          </div>

          {/* Hamburger */}
          <button
            style={styles.hamburger}
            onClick={() => setNavOpen((v) => !v)}
            title="Menu"
            className="hamburger"
          >
            {navOpen ? "✖" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {navOpen && (
        <div style={styles.mobileOverlay} onClick={() => setNavOpen(false)}>
          <nav style={styles.mobileNav} onClick={(e) => e.stopPropagation()}>
            <ul style={styles.mobileNavList as any}>
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} style={styles.mobileNavLink as any} onClick={() => setNavOpen(false)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div style={styles.mainWrapper}>
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          style={{
            ...styles.sidebar,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          } as any}
          className="sidebar"
        >
          <h3 style={styles.sidebarTitle}>Filters</h3>

          <div style={styles.filterGroup as any}>
            <h4 style={styles.filterHead}>Categories</h4>
            {["Apparel", "Accessories", "Jewelry", "Footwear"].map((cat) => (
              <label key={cat} style={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat)}
                  onChange={() => toggleCat(cat)}
                  style={{ marginRight: 10, accentColor: "#D4A853" }}
                />
                {cat}
              </label>
            ))}
          </div>

          <div style={styles.filterGroup as any}>
            <h4 style={styles.filterHead}>Price Range</h4>
            <input
              type="range"
              min={0}
              max={200}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={styles.slider}
            />
            <p style={styles.priceText}>Price: ₹{maxPrice}</p>
          </div>

          <div style={styles.filterGroup as any}>
            <h4 style={styles.filterHead}>Ratings</h4>
            {[5, 4, 3].map((r) => (
              <label key={r} style={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={selectedRatings.includes(r)}
                  onChange={() => toggleRating(r)}
                  style={{ marginRight: 10, accentColor: "#D4A853" }}
                />
                {"★".repeat(r)}{"☆".repeat(5 - r)} {r < 5 && "& Up"}
              </label>
            ))}
          </div>

          <div style={styles.filterGroup as any}>
            <h4 style={styles.filterHead}>Sort By</h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>

          <button style={styles.applyBtn} onClick={applyFilters}>
            Apply Filters
          </button>
        </aside>

        {/* Product Grid */}
        <section style={styles.productSection}>
          {products.length === 0 ? (
            <div style={styles.noResults}>
              <h3>No Products Found</h3>
              <p>Try adjusting your filters.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onWishlist={toggleWishlist}
                  wishlisted={wishlist.includes(p.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Poppins:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0D0D0D; }
        a { text-decoration: none; }
        input[type=range] {
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: rgba(212,168,83,0.2);
          border-radius: 5px;
          margin: 15px 0 10px;
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          background: #D4A853;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(212,168,83,0.4);
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0D; }
        ::-webkit-scrollbar-thumb { background: rgba(212,168,83,0.3); border-radius: 10px; }

        @media (max-width: 1040px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
          .filter-toggle { display: block !important; }
        }
        @media (min-width: 1041px) {
          .hamburger { display: none !important; }
          .filter-toggle { display: none !important; }
          .sidebar { transform: translateX(0) !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    fontFamily: "'Poppins', sans-serif",
    color: "#F5F0E8",
    background: "#0D0D0D",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as any,
    overflowX: "hidden" as any,
  },
  bgOverlay: {
    position: "fixed" as any,
    inset: 0,
    background:
      "radial-gradient(ellipse at 20% 50%, rgba(212,168,83,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(232,160,191,0.03) 0%, transparent 50%)",
    pointerEvents: "none" as any,
    zIndex: 0,
  },

  header: {
    position: "sticky" as any,
    top: 0,
    zIndex: 1000,
    background: "rgba(13,13,13,0.85)",
    backdropFilter: "blur(20px) saturate(180%)",
    padding: "16px 50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(212,168,83,0.1)",
    flexWrap: "nowrap" as any,
    gap: 16,
  },
  logo: {
    fontFamily: "'Montserrat', serif",
    fontWeight: 700,
    fontSize: "1.9rem",
    color: "#D4A853",
    lineHeight: 1,
    flexShrink: 0,
  },
  logoSub: {
    display: "block",
    fontFamily: "'Poppins', sans-serif",
    fontSize: "0.75rem",
    fontWeight: 400,
    color: "#B8B0A0",
    letterSpacing: 4,
    textTransform: "uppercase" as any,
    marginTop: 2,
  },
  desktopNav: {
    display: "flex",
    className: "desktop-nav",
  },
  navList: {
    display: "flex",
    listStyle: "none",
    gap: 4,
  },
  navLink: {
    textTransform: "uppercase" as any,
    fontWeight: 500,
    letterSpacing: "1.5px",
    padding: "10px 14px",
    color: "#B8B0A0",
    fontSize: "0.82rem",
    transition: "color 0.3s",
    display: "block",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexShrink: 0,
  },
  navIcons: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  navIconLink: {
    fontSize: "1.15rem",
    padding: "8px",
    borderRadius: "50%",
    color: "#B8B0A0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.3s",
    background: "transparent",
    border: "none",
    textDecoration: "none" as any,
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#B8B0A0",
    fontSize: "1.1rem",
    padding: "8px",
    display: "none",
  },
  hamburger: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#B8B0A0",
    fontSize: "1.3rem",
    padding: "4px 8px",
    display: "none",
  },

  mobileOverlay: {
    position: "fixed" as any,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    zIndex: 1100,
    display: "flex",
    justifyContent: "flex-end",
  },
  mobileNav: {
    width: 280,
    height: "100vh",
    background: "rgba(13,13,13,0.98)",
    backdropFilter: "blur(24px)",
    borderLeft: "1px solid rgba(212,168,83,0.2)",
    padding: "100px 24px 32px",
    overflowY: "auto" as any,
  },
  mobileNavList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 4 },
  mobileNavLink: {
    display: "block",
    padding: "12px 18px",
    color: "#B8B0A0",
    fontSize: "0.95rem",
    fontWeight: 500,
    textTransform: "uppercase" as any,
    letterSpacing: "1px",
    borderRadius: 8,
    transition: "background 0.2s, color 0.2s",
  },

  sidebarOverlay: {
    position: "fixed" as any,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)",
    zIndex: 1000,
  },

  mainWrapper: {
    display: "flex",
    minHeight: "calc(100vh - 72px)",
    position: "relative" as any,
    zIndex: 1,
  },

  sidebar: {
    width: 260,
    minWidth: 260,
    background: "rgba(13,13,13,0.97)",
    backdropFilter: "blur(16px)",
    borderRight: "1px solid rgba(212,168,83,0.2)",
    padding: "30px 25px",
    position: "fixed" as any,
    top: 72,
    left: 0,
    height: "calc(100vh - 72px)",
    zIndex: 1002,
    overflowY: "auto",
    transition: "transform 0.3s ease-in-out",
  },
  sidebarTitle: {
    fontSize: "1.6rem",
    color: "#D4A853",
    textAlign: "center" as any,
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: "1px solid rgba(212,168,83,0.2)",
    letterSpacing: 2,
    fontFamily: "'Montserrat', serif",
  },
  filterGroup: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid rgba(212,168,83,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  filterHead: {
    fontSize: "0.85rem",
    color: "#F5F0E8",
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase" as any,
    marginBottom: 10,
  },
  filterLabel: {
    display: "flex",
    alignItems: "center",
    color: "#B8B0A0",
    cursor: "pointer",
    fontSize: "0.92rem",
    padding: "4px 0",
  },
  slider: {
    width: "100%",
  },
  priceText: {
    textAlign: "center" as any,
    fontWeight: 600,
    color: "#D4A853",
    fontSize: "0.95rem",
  },
  select: {
    width: "100%",
    padding: "10px 15px",
    border: "1px solid rgba(212,168,83,0.2)",
    borderRadius: 8,
    fontFamily: "'Poppins', sans-serif",
    fontSize: "0.92rem",
    background: "rgba(255,255,255,0.05)",
    color: "#F5F0E8",
    cursor: "pointer",
    outline: "none",
  },
  applyBtn: {
    width: "100%",
    marginTop: 20,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #D4A853, #E8C97A, #D4A853)",
    color: "#0D0D0D",
    border: "none",
    borderRadius: 50,
    fontWeight: 700,
    fontSize: "0.9rem",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as any,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(212,168,83,0.3)",
    transition: "all 0.3s",
  },

  productSection: {
    flexGrow: 1,
    marginLeft: 260,
    padding: "40px 24px",
    background: "transparent",
    minHeight: "100vh",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 24,
  },

  card: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    border: "1px solid rgba(212,168,83,0.2)",
    overflow: "hidden",
    position: "relative" as any,
    display: "flex",
    flexDirection: "column" as any,
    transition: "all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
    cursor: "pointer",
    height: 200,
  },
  wishBtn: {
    position: "absolute" as any,
    top: 14,
    right: 14,
    background: "none",
    border: "none",
    fontSize: "1.4rem",
    cursor: "pointer",
    zIndex: 10,
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
    transition: "color 0.3s, transform 0.2s",
    padding: 0,
    lineHeight: 1,
  },
  cardBody: {
    padding: "16px 18px",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column" as any,
    gap: 4,
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#F5F0E8",
    whiteSpace: "nowrap" as any,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardCat: {
    fontSize: "0.78rem",
    color: "#8A8278",
    textTransform: "uppercase" as any,
    letterSpacing: 1,
  },
  cardPrice: {
    fontSize: "1.1rem",
    color: "#D4A853",
    fontWeight: 700,
  },
  addBtn: {
    marginTop: "auto",
    padding: "10px 15px",
    background: "linear-gradient(135deg, #D4A853, #E8C97A, #D4A853)",
    color: "#0D0D0D",
    border: "none",
    borderRadius: 50,
    fontWeight: 600,
    fontSize: "0.82rem",
    letterSpacing: 1,
    cursor: "pointer",
    transition: "all 0.3s",
    width: "100%",
  },

  noResults: {
    textAlign: "center" as any,
    padding: "60px 20px",
    color: "#B8B0A0",
  },
};
