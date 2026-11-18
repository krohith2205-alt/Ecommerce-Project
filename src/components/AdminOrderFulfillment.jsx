import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FULFILLMENT_STAGES, broadcastOrderMilestone } from "../utils/fulfillmentStream";
import api from "../services/api";

function AdminOrderFulfillment() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdvanceStage(order) {
    const currentIndex = FULFILLMENT_STAGES.findIndex((s) => s.stage === order.status);
    if (currentIndex === -1 || currentIndex >= FULFILLMENT_STAGES.length - 1) {
      toast.info("Order has already reached final delivery stage.");
      return;
    }

    const nextStageObj = FULFILLMENT_STAGES[currentIndex + 1];
    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMilestone = {
      stage: nextStageObj.stage,
      timestamp: currentTime,
      note: nextStageObj.note
    };

    const updatedMilestones = [...(order.milestones || []), newMilestone];

    try {
      const res = await api.patch(`/orders/${order.id}`, {
        status: nextStageObj.stage,
        milestones: updatedMilestones
      });

      // Broadcast real-time update to customer screen
      broadcastOrderMilestone(order.id, res.data);

      setOrders((prev) => prev.map((o) => (o.id === order.id ? res.data : o)));
      toast.success(`Order #${order.id} moved to "${nextStageObj.stage}"!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update fulfillment stage.");
    }
  }

  return (
    <div className="admin-fulfillment-panel">
      <h2>🏭 Live Warehouse Fulfillment & Packing Control</h2>
      <p className="panel-subtitle">Advance order stages to stream live updates to customer screens.</p>

      <div className="fulfillment-list">
        {orders.map((order) => {
          const isCompleted = order.status === "Delivered";
          return (
            <div key={order.id} className="fulfillment-row">
              <div className="fulfillment-meta">
                <strong>Order #{order.id}</strong> — <span>{order.userName}</span>
                <div className="current-stage-pill">{order.status}</div>
              </div>

              <button
                className="advance-stage-btn"
                onClick={() => handleAdvanceStage(order)}
                disabled={isCompleted}
              >
                {isCompleted ? "✅ Completed" : "Advance Stage ➔"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminOrderFulfillment;