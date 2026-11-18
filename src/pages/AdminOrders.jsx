import { useEffect, useState } from "react";
import api from "../services/api";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const statuses = [
    "Order Placed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered"
  ];

  useEffect(() => {
    fetchAllOrders();
  }, []);

  async function fetchAllOrders() {
    try {
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      // Find target order
      const orderToUpdate = orders.find((o) => o.id === orderId);
      const updatedOrder = { ...orderToUpdate, status: newStatus };

      await api.put(`/orders/${orderId}`, updatedOrder);
      
      setOrders(
        orders.map((o) => (o.id === orderId ? updatedOrder : o))
      );
      alert(`Order #${orderId} updated to "${newStatus}"`);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="orders-container">
      <h1>Admin Orders Management Dashboard</h1>

      {orders.length === 0 ? (
        <div className="empty-cart">
          <h2>No Customer Orders Yet</h2>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p>Customer: <strong>{order.userName}</strong> (ID: {order.userId})</p>
                  <p>Date: {order.orderDate}</p>
                </div>
                <div>
                  <h3>Total: ₹{order.totalAmount}</h3>
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ marginRight: "10px", fontWeight: "bold" }}>Status:</label>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {order.shippingAddress && (
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", marginBottom: "15px", fontSize: "14px" }}>
                  <strong>Shipping Address:</strong> {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
                </div>
              )}

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <h4>{item.name}</h4>
                      <p>₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;