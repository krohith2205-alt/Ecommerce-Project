
import { createSlice } from "@reduxjs/toolkit";

// Safely load wishlist from LocalStorage
const getInitialWishlist = () => {
  try {
    const savedWishlist = JSON.parse(
      localStorage.getItem("wishlist")
    );

    return Array.isArray(savedWishlist)
      ? savedWishlist
      : [];
  } catch {
    return [];
  }
};

const wishlistSlice = createSlice({
  name: "wishlist",

  initialState: getInitialWishlist(),

  reducers: {
    // Add or remove product
    toggleWishlist: (state, action) => {
      const product = action.payload;

      if (!product || product.id == null) return;

      const index = state.findIndex(
        (item) => item.id === product.id
      );

      if (index !== -1) {
        state.splice(index, 1);
      } else {
        state.push(product);
      }
    },

    // Remove specific product
    removeFromWishlist: (state, action) => {
      return state.filter(
        (item) => item.id !== action.payload
      );
    },

    // Clear entire wishlist
    clearWishlist: () => {
      return [];
    },

    // Synchronize wishlist across browser tabs
    syncWishlist: (_, action) => {
      return Array.isArray(action.payload)
        ? action.payload
        : [];
    },
  },
});

export const {
  toggleWishlist,
  removeFromWishlist,
  clearWishlist,
  syncWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
