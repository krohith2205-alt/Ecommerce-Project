
import { createSlice } from "@reduxjs/toolkit";

// Safely load cart from LocalStorage
const getInitialCart = () => {
  try {
    const savedCart = JSON.parse(
      localStorage.getItem("cart")
    );

    return Array.isArray(savedCart) ? savedCart : [];
  } catch {
    return [];
  }
};

const cartSlice = createSlice({
  name: "cart",

  initialState: getInitialCart(),

  reducers: {
    // Add product
    addToCart: (state, action) => {
      const product = action.payload;

      if (!product?.id) return;

      const stock = Number(product.stock);

      if (!Number.isFinite(stock) || stock <= 0) return;

      const existingProduct = state.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        const currentQuantity = Number(
          existingProduct.quantity || 1
        );

        if (currentQuantity >= stock) return;

        existingProduct.quantity = currentQuantity + 1;
      } else {
        state.push({
          ...product,
          quantity: 1,
        });
      }
    },

    // Increase quantity
    increaseQuantity: (state, action) => {
      const product = state.find(
        (item) => item.id === action.payload
      );

      if (!product) return;

      const quantity = Number(product.quantity || 1);
      const stock = Number(product.stock);

      if (!Number.isFinite(stock) || quantity >= stock) return;

      product.quantity = quantity + 1;
    },

    // Decrease quantity
    decreaseQuantity: (state, action) => {
      const product = state.find(
        (item) => item.id === action.payload
      );

      if (!product) return;

      const quantity = Number(product.quantity || 1);

      if (quantity > 1) {
        product.quantity = quantity - 1;
      }
    },

    // Set quantity
    setQuantity: (state, action) => {
      const { id, quantity } = action.payload;

      const product = state.find(
        (item) => item.id === id
      );

      if (!product) return;

      const stock = Number(product.stock);
      const newQuantity = Number(quantity);

      if (
        !Number.isInteger(newQuantity) ||
        newQuantity < 1 ||
        !Number.isFinite(stock) ||
        newQuantity > stock
      ) return;

      product.quantity = newQuantity;
    },

    // Remove product
    removeFromCart: (state, action) => {
      return state.filter(
        (item) => item.id !== action.payload
      );
    },

    // Clear entire cart
    clearCart: () => {
      return [];
    },

    // Synchronize cart
    syncCart: (state, action) => {
      return Array.isArray(action.payload)
        ? action.payload
        : state;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  increaseQuantity,
  decreaseQuantity,
  updateQuantity,
  setCartFromSharedRoom,
  syncCart,
} = cartSlice.actions;

export default cartSlice.reducer;
