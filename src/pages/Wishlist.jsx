import { useDispatch, useSelector } from "react-redux";
import { removeFromWishlist } from "../features/wishlistSlice";
import { addToCart } from "../features/cartSlice";
import { Link } from "react-router-dom";

function Wishlist() {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist);

  function handleMoveToCart(product) {
    dispatch(addToCart(product));
    dispatch(removeFromWishlist(product.id));
  }

  return (
    <div className="wishlist-container">
      <h1 className="page-title">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="empty-cart">
          <h2>Your Wishlist is Empty</h2>
          <p>Save products you like while browsing the store.</p>
          <Link to="/products" className="submit-btn" style={{ display: "inline-block", marginTop: "20px", maxWidth: "200px", textAlign: "center" }}>
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <div key={product.id} className="wishlist-card">
              <img src={product.image} alt={product.name} />
              <div className="wishlist-content">
                <h2>{product.name}</h2>
                <p>Brand: {product.brand}</p>
                <p>Price: ₹{product.price}</p>
                <p>⭐ {product.rating}</p>

                <div className="wishlist-actions">
                  <button
                    className="cart-btn"
                    onClick={() => handleMoveToCart(product)}
                  >
                    Move to Cart
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => dispatch(removeFromWishlist(product.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;