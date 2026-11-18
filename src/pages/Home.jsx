import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import RecommendationCarousel from "../components/RecommendationCarousel";
import { getPersonalizedRecommendations } from "../utils/recommendations";
import api from "../services/api";

function Home() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const wishlist = useSelector((state) => state.wishlist);
  const { formatPrice } = useCurrency();
  const user = JSON.parse(localStorage.getItem("user"));
  const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const prodRes = await api.get("/products");
        setProducts(prodRes.data);

        if (user) {
          const orderRes = await api.get("/orders", { params: { userId: user.id } });
          setOrders(orderRes.data);
        }
      } catch (err) {
        console.log("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  // Generate AI Recommendations
  const { recommendedProducts, topCategory } = getPersonalizedRecommendations(
    products,
    wishlist,
    recentlyViewed,
    orders
  );

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading ShopSphere...</div>;
  }

  return (
    <div className="home-container">
      {/* HERO BANNER SECTION */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1>Welcome to ShopSphere</h1>
          <p>Discover cutting-edge tech, fashion, and lifestyle essentials with real-time currency conversion, flash deals, and rewards.</p>
          <div className="hero-buttons">
            <Link to="/products" className="hero-btn primary">
              Explore Catalog ➔
            </Link>
            <Link to="/admin/analytics" className="hero-btn secondary">
              View Analytics
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORY QUICK LINKS */}
      <section className="category-quick-links">
        <h2>Shop By Category</h2>
        <div className="category-grid">
          <Link to="/products?category=Electronics" className="cat-card">
            <span>💻</span>
            <h3>Electronics</h3>
          </Link>
          <Link to="/products?category=Fashion" className="cat-card">
            <span>👕</span>
            <h3>Fashion</h3>
          </Link>
          <Link to="/products?category=Home" className="cat-card">
            <span>🏠</span>
            <h3>Home & Living</h3>
          </Link>
          <Link to="/products?category=Accessories" className="cat-card">
            <span>⌚</span>
            <h3>Accessories</h3>
          </Link>
        </div>
      </section>

      {/* AI PERSONALIZED RECOMMENDATIONS CAROUSEL */}
      {products.length > 0 && (
        <RecommendationCarousel
          products={recommendedProducts}
          title="Recommended For You"
          subtitle={`Curated based on your browsing habits and interest in ${topCategory}`}
        />
      )}

      {/* FEATURED PRODUCTS GRID */}
      <section className="featured-section">
        <h2>Trending Products</h2>
        <div className="product-grid">
          {products.slice(0, 8).map((product) => {
            const isOutOfStock = product.stock <= 0;
            return (
              <div key={product.id} className="product-card">
                <Link to={`/product/${product.id}`}>
                  <img src={product.image} alt={product.name} />
                </Link>
                <div className="product-info">
                  <span className="brand-label">{product.brand}</span>
                  <Link to={`/product/${product.id}`} className="product-title-link">
                    <h3>{product.name}</h3>
                  </Link>
                  <p className="product-price">{formatPrice(product.price)}</p>
                  <span className={isOutOfStock ? "stock-out" : "stock-in"}>
                    {isOutOfStock ? "Out of Stock" : `${product.stock} in stock`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home;