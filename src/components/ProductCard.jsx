
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { addToCart } from "../features/cartSlice";
import { toggleWishlist } from "../features/wishlistSlice";
import { useCurrency } from "../context/CurrencyContext";
import FlashClaimBar from "./FlashClaimBar";

function ProductCard({
  product,
  onDelete,
  onToggleCompare,
  isCompared = false,
}) {
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();

  // Get logged-in user safely
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    user = null;
  }

  const isAdmin = user?.role === "admin";

  // Stock availability
  const stock = Number(product.stock ?? 0);
  const isOutOfStock = stock <= 0;

  // Wishlist
  const wishlist = useSelector(
    (state) => state.wishlist || []
  );

  const isWishlisted = wishlist.some(
    (item) => String(item.id) === String(product.id)
  );

  // Add to cart
  const handleAddToCart = () => {
    if (isOutOfStock || isAdmin) return;

    dispatch(addToCart(product));
  };

  // Wishlist
  const handleWishlist = () => {
    dispatch(toggleWishlist(product));
  };

  // Delete product
  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
    }
  };

  // Compare product
  const handleCompare = () => {
    if (onToggleCompare) {
      onToggleCompare(product);
    }
  };

  return (
    <div
      className={`card ${
        isOutOfStock ? "out-of-stock-card" : ""
      }`}
    >
      {/* PRODUCT IMAGE */}
      <div
        className="card-image-container"
        style={{ position: "relative" }}
      >
        <img
          src={product.image}
          alt={product.name}
        />

        {/* OUT OF STOCK BADGE */}
        {isOutOfStock && (
          <span className="stock-badge">
            Out of Stock
          </span>
        )}

        {/* WISHLIST BUTTON */}
        {!isAdmin && (
          <button
            type="button"
            className={`wishlist-icon-btn ${
              isWishlisted ? "active" : ""
            }`}
            onClick={handleWishlist}
            title={
              isWishlisted
                ? "Remove from Wishlist"
                : "Add to Wishlist"
            }
            aria-label={
              isWishlisted
                ? "Remove from Wishlist"
                : "Add to Wishlist"
            }
          >
            {isWishlisted ? "❤️" : "🤍"}
          </button>
        )}

        {/* COMPARE CHECKBOX */}
        {!isAdmin && onToggleCompare && (
          <label className="compare-checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(isCompared)}
              onChange={handleCompare}
            />
            <span>Compare</span>
          </label>
        )}
      </div>

      {/* PRODUCT DETAILS */}
      <h3>{product.name}</h3>

      <p>{product.brand}</p>

      {/* PRODUCT PRICE */}
      <p className="product-price">
        {formatPrice(product.price)}
      </p>

      {/* FLASH SALE CLAIM BAR */}
      {product.isFlashSale && (
        <FlashClaimBar product={product} />
      )}

      {/* PRODUCT RATING */}
      <p>⭐ {product.rating ?? "No Rating"}</p>

      {/* STOCK INFORMATION */}
      <p
        style={{
          fontSize: "13px",
          padding: "0 15px",
          color: isOutOfStock ? "#dc2626" : "#16a34a",
        }}
      >
        {isOutOfStock
          ? "Currently Unavailable"
          : `In Stock: ${stock} left`}
      </p>

      {/* ADD TO CART */}
      {!isAdmin && (
        <div style={{ padding: "0 15px" }}>
          <button
            type="button"
            className={`cart-btn ${
              isOutOfStock ? "disabled-btn" : ""
            }`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock
              ? "Out of Stock"
              : "Add To Cart"}
          </button>
        </div>
      )}

      {/* CARD ACTIONS */}
      <div className="card-actions">
        <Link
          className="view-btn"
          to={`/products/${product.id}`}
        >
          View
        </Link>

        {/* ADMIN ACTIONS */}
        {isAdmin && (
          <>
            <Link
              className="edit-btn"
              to={`/edit-product/${product.id}`}
            >
              Edit
            </Link>

            <button
              type="button"
              className="delete-btn"
              onClick={handleDelete}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
