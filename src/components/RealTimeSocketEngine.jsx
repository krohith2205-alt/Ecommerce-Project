import { useEffect } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

const globalSimulatedCities = ["London", "New York", "Tokyo", "Berlin", "Sydney", "Toronto", "Paris"];

function RealTimeSocketEngine({ onStockUpdate }) {
  useEffect(() => {
    // Simulate real-time socket connection delay
    const socketInterval = setInterval(async () => {
      try {
        const res = await api.get("/products");
        const products = res.data;

        if (products.length === 0) return;

        // Pick a random product from the catalog
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomCity = globalSimulatedCities[Math.floor(Math.random() * globalSimulatedCities.length)];
        
        // Randomly choose event type: 0 = Cart activity, 1 = Purchase / Stock decrement
        const eventType = Math.random() > 0.5 ? 0 : 1;

        if (eventType === 0) {
          // Socket Event: Someone added item to cart
          toast.info(`🛒 Someone from ${randomCity} just added "${randomProduct.name}" to their cart!`, {
            autoClose: 4000,
            toastId: `socket_cart_${randomProduct.id}`
          });
        } else {
          // Socket Event: Someone purchased item, decrement stock live
          const currentStock = Number(randomProduct.stock || 0);
          if (currentStock > 0) {
            const newStock = currentStock - 1;

            await api.put(`/products/${randomProduct.id}`, {
              ...randomProduct,
              stock: newStock
            });

            // Notify parent / UI
            if (onStockUpdate) onStockUpdate();

            if (newStock === 0) {
              toast.error(`⚡ Out of Stock! "${randomProduct.name}" just sold out completely!`, {
                autoClose: 5000
              });
            } else if (newStock <= 2) {
              toast.warn(`🔥 Flash Alert! Only ${newStock} units left of "${randomProduct.name}"!`, {
                autoClose: 4500
              });
            }
          }
        }
      } catch (err) {
        console.log("Socket simulation error:", err);
      }
    }, 30000); // Triggers every 30 seconds to simulate active traffic

    return () => clearInterval(socketInterval);
  }, [onStockUpdate]);

  return null; // Background engine component renders no visual DOM
}

export default RealTimeSocketEngine;