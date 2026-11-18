
import { Link } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";

function RecommendationCarousel({ products = [], title, subtitle }) {
  const { formatPrice } = useCurrency();

  if (!products.length) {
    return null;
  }

  return (
    <section className="recommendation-section">
      <div className="recommendation-header">
        <div>
          <h2>{title || "Recommended For You"}</h2>
          <p>{subtitle || "Products selected for your interests"}</p>
        </div>

        <Link to="/products" className="view-all">
          View All →
        </Link>
      </div>

      <div className="recommendation-grid">
        {products.map((product) => (
          <div className="recommendation-card" key={product.id}>
            <Link to={`/product/${product.id}`}>
              <img
                src={product.image}
                alt={product.name}
                className="recommendation-image"
              />
            </Link>

            <div className="recommendation-info">
              <span className="recommendation-brand">
                {product.brand}
              </span>

              <Link
                to={`/product/${product.id}`}
                className="recommendation-product-link"
              >
                <h3>{product.name}</h3>
              </Link>

              <p className="recommendation-price">
                {formatPrice(product.price)}
              </p>

              <Link
                to={`/product/${product.id}`}
                className="recommendation-btn"
              >
                View Product
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecommendationCarousel;
