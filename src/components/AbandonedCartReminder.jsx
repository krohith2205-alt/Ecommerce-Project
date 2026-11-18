import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

function AbandonedCartReminder() {
  const cart = useSelector((state) => state.cart);
  const location = useLocation();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user && user.role === "admin";

  // Reset dismissal if the user adds new items to the cart
  useEffect(() => {
    setDismissed(false);
  }, [cart.length]);

  // Hide if not logged in, is admin, cart is empty, already on Cart page, or manually dismissed
  if (!user || isAdmin || cart.length === 0 || location.pathname === "/cart" || dismissed) {
    return null;
  }

  return (
    <div className="abandoned-cart-pill">
      <div className="abandoned-cart-content" onClick={() => navigate("/cart")}>
        <span className="cart-pulse-icon">🛒</span>
        <p>
          You left <strong>{cart.length} {cart.length === 1 ? "item" : "items"}</strong> in your cart —{" "}
          <span className="checkout-cta-link">Complete checkout now!</span>
        </p>
      </div>
      <button
        className="dismiss-pill-btn"
        onClick={() => setDismissed(true)}
        title="Dismiss reminder"
      >
        ✕
      </button>
    </div>
  );
}

export default AbandonedCartReminder;