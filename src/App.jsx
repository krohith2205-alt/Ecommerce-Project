
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { syncCart } from "./features/cartSlice";
import { syncWishlist } from "./features/wishlistSlice";

import Navbar from "./components/Navbar";
import FlashSaleBanner from "./components/FlashSaleBanner";
import RealTimeSocketEngine from "./components/RealTimeSocketEngine";
import AbandonedCartReminder from "./components/AbandonedCartReminder";
import SocialProofToast from "./components/SocialProofToast";

import AppRoutes from "./routes/AppRoutes";

function App() {
  const dispatch = useDispatch();

  // Stock update counter
  const [socketTick, setSocketTick] = useState(0);

  // =========================================
  // 1. REAL-TIME STOCK UPDATE HANDLER
  // =========================================

  function handleSocketStockChange() {
    setSocketTick((previous) => previous + 1);
  }

  // =========================================
  // 2. CROSS-TAB STORAGE SYNCHRONIZATION
  // =========================================

  useEffect(() => {
    function handleStorageSync(event) {
      try {
        // CART SYNCHRONIZATION
        if (event.key === "cart") {
          const updatedCart = event.newValue
            ? JSON.parse(event.newValue)
            : [];

          dispatch(
            syncCart(
              Array.isArray(updatedCart) ? updatedCart : []
            )
          );
        }

        // WISHLIST SYNCHRONIZATION
        if (event.key === "wishlist") {
          const updatedWishlist = event.newValue
            ? JSON.parse(event.newValue)
            : [];

          dispatch(
            syncWishlist(
              Array.isArray(updatedWishlist)
                ? updatedWishlist
                : []
            )
          );
        }

        // DARK MODE SYNCHRONIZATION
        if (event.key === "theme") {
          if (event.newValue === "dark") {
            document.body.classList.add("dark-mode");
          } else {
            document.body.classList.remove("dark-mode");
          }
        }

        // LOGIN / LOGOUT SYNCHRONIZATION
        if (event.key === "user") {
          window.location.reload();
        }

      } catch (error) {
        console.error("Cross-tab synchronization error:", error);
      }
    }

    window.addEventListener("storage", handleStorageSync);

    return () => {
      window.removeEventListener("storage", handleStorageSync);
    };
  }, [dispatch]);

  // =========================================
  // 3. INITIAL THEME SYNCHRONIZATION
  // =========================================

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    document.body.classList.toggle(
      "dark-mode",
      savedTheme === "dark"
    );
  }, []);

  // =========================================
  // 4. APPLICATION UI
  // =========================================

  return (
    <>
      {/* NAVIGATION */}
      <Navbar />

      {/* FLASH SALE */}
      <FlashSaleBanner />

      {/* REAL-TIME STOCK SIMULATION */}
      <RealTimeSocketEngine
        onStockUpdate={handleSocketStockChange}
      />

      {/* APPLICATION ROUTES */}
      <AppRoutes socketTick={socketTick} />

      {/* BACKGROUND FEATURES */}
      <AbandonedCartReminder />
      <SocialProofToast />
    </>
  );
}

export default App;
