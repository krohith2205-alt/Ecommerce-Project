import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

function PriceStockAlertBell({ product }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) return;
    api.get("/priceAlerts", { params: { userId: user.id, productId: product.id } }).then((res) => {
      if (res.data.length > 0) {
        setIsSubscribed(true);
        setSubscriptionId(res.data[0].id);
      }
    });
  }, [user, product.id]);

  async function handleToggleSubscription() {
    if (!user) {
      toast.warn("Please login to subscribe to price/stock alerts.");
      return;
    }

    try {
      if (isSubscribed) {
        await api.delete(`/priceAlerts/${subscriptionId}`);
        setIsSubscribed(false);
        setSubscriptionId(null);
        toast.info("Unsubscribed from price & stock alerts.");
      } else {
        const newSub = {
          userId: user.id,
          userName: user.name,
          productId: product.id,
          productName: product.name,
          targetPrice: product.price,
          dateSubscribed: new Date().toLocaleDateString()
        };
        const res = await api.post("/priceAlerts", newSub);
        setIsSubscribed(true);
        setSubscriptionId(res.data.id);
        toast.success("🔔 Subscribed! You will be notified instantly when price drops or item is restocked.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update alert subscription.");
    }
  }

  return (
    <button
      type="button"
      className={`alert-bell-btn ${isSubscribed ? "subscribed" : ""}`}
      onClick={handleToggleSubscription}
    >
      {isSubscribed ? "🔔 Subscribed to Alerts" : "🔔 Notify Me on Price Drop / Restock"}
    </button>
  );
}

export default PriceStockAlertBell;