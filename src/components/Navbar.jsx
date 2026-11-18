
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useCurrency } from "../context/CurrencyContext";
import LiveSearch from "./LiveSearch";

function Navbar() {
  // Safely retrieve logged-in user
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // Redux State
  const cart = useSelector((state) => state.cart || []);
  const wishlist = useSelector((state) => state.wishlist || []);

  const isAdmin = user?.role === "admin";

  // Currency Context
  const { currency, setCurrency } = useCurrency();

  // Dark Mode
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  // Apply Theme
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  return (
    <nav className="navbar-container">

      {/* LOGO */}
      <Link to="/" className="logo">
        ShopSphere
      </Link>

      {/* NAVIGATION LINKS */}
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>

        {/* CUSTOMER LINKS */}
        {user && !isAdmin && (
          <>
            <Link to="/wishlist">
              Wishlist ({wishlist.length})
            </Link>

            <Link to="/cart">
              Cart ({cart.length})
            </Link>

            <Link to="/my-orders">
              My Orders
            </Link>
          </>
        )}

        {/* ADMIN LINKS */}
        {isAdmin && (
          <>
            <Link to="/add-product">
              + Add Product
            </Link>

            <Link to="/admin/orders">
              Manage Orders
            </Link>

            <Link to="/admin/analytics">
              Analytics
            </Link>
          </>
        )}

        {/* PROFILE */}
        {user && (
          <Link to="/profile">
            Profile
          </Link>
        )}

        {/* AUTHENTICATION */}
        {!user ? (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        ) : (
          <Link to="/logout">
            Logout ({user.name})
          </Link>
        )}
      </div>

      {/* LIVE SEARCH */}
      <div className="nav-search-wrapper">
        <LiveSearch />
      </div>

      {/* NAVIGATION ACTIONS */}
      <div className="nav-actions">

        {/* CURRENCY SELECTOR */}
        <select
          className="currency-selector"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          aria-label="Select currency"
        >
          <option value="INR">₹ INR</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
          <option value="GBP">£ GBP</option>
        </select>

        {/* DARK MODE */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => setDarkMode((prev) => !prev)}
          title="Toggle Dark Mode"
          aria-label={
            darkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

      </div>
    </nav>
  );
}

export default Navbar;
