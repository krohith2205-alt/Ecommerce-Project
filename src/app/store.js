import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "../features/cartSlice";
import wishlistReducer from "../features/wishlistSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
});

// Persist cart & wishlist so they survive refresh and sync across tabs
function persist(key, value) {
  try {
    const json = JSON.stringify(value);
    if (localStorage.getItem(key) !== json) {
      localStorage.setItem(key, json);
    }
  } catch {
    /* ignore storage errors */
  }
}

store.subscribe(() => {
  const { cart, wishlist } = store.getState();
  persist("cart", cart);
  persist("wishlist", wishlist);
});
