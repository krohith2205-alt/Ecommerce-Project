import { useEffect } from "react";
import { toast } from "react-toastify";
import { subscribeToProductWebhooks } from "../utils/priceAlertWebhook";
import api from "../services/api";

function AlertWebhookListener() {
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToProductWebhooks(async (updatedProduct) => {
      try {
        const res = await api.get("/priceAlerts", {
          params: { userId: user.id, productId: updatedProduct.id }
        });

        if (res.data.length > 0) {
          toast.success(`🚨 WEBHOOK ALERT: "${updatedProduct.name}" has been updated! New Price: ₹${updatedProduct.price}, Stock: ${updatedProduct.stock} units.`, {
            autoClose: 7000
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    return () => unsubscribe();
  }, [user]);

  return null;
}

export default AlertWebhookListener;