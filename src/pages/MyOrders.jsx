
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import OrderVerificationModal from "../components/OrderVerificationModal";
import LiveDeliveryMap from "../components/LiveDeliveryMap";
import ReturnExchangeModal from "../components/ReturnExchangeModal";
import ReturnPickupTracker from "../components/ReturnPickupTracker";

import {
  subscribeToOrderUpdates,
  FULFILLMENT_STAGES,
} from "../utils/fulfillmentStream";

import { useCurrency } from "../context/CurrencyContext";
import { downloadOrderInvoice } from "../utils/generateInvoice";
import api from "../services/api";

// ------------------------------------
// ORDER STATUSES
// ------------------------------------

const statuses = [
  "Order Placed",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const cancellableStatuses = [
  "Order Placed",
  "Confirmed",
  "Processing",
];

const returnEligibleStatuses = [
  "Delivered",
  "Completed",
];

// ------------------------------------
// GET LOGGED-IN USER
// ------------------------------------

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

// ------------------------------------
// MY ORDERS COMPONENT
// ------------------------------------

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);

  const [activeTrackingOrderId, setActiveTrackingOrderId] =
    useState(null);

  const [selectedOrderForQR, setSelectedOrderForQR] =
    useState(null);

  const [selectedOrderForReturn, setSelectedOrderForReturn] =
    useState(null);

  const [user] = useState(getStoredUser);

  const { formatPrice } = useCurrency();

  // ------------------------------------
  // FETCH ORDERS AND RETURNS
  // ------------------------------------

  const getOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      setReturns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      const [ordersResponse, returnsResponse] =
        await Promise.all([
          api.get("/orders", {
            params: { userId: user.id },
          }),
          api.get("/returns", {
            params: { userId: user.id },
          }),
        ]);

      const userOrders = Array.isArray(ordersResponse.data)
        ? ordersResponse.data
            .filter(
              (order) =>
                String(order.userId) === String(user.id)
            )
            .sort(
              (a, b) =>
                new Date(b.orderDate || 0) -
                new Date(a.orderDate || 0)
            )
        : [];

      const userReturns = Array.isArray(returnsResponse.data)
        ? returnsResponse.data.filter(
            (ticket) =>
              String(ticket.userId) === String(user.id)
          )
        : [];

      setOrders(userOrders);
      setReturns(userReturns);

    } catch (err) {
      console.error("Fetch Orders Error:", err);

      setError(true);

      toast.error("Failed to load your orders.");

    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ------------------------------------
  // INITIAL FETCH + LIVE ORDER UPDATES
  // ------------------------------------

  useEffect(() => {
    getOrders();

    if (!user?.id) return;

    const unsubscribe = subscribeToOrderUpdates(
      (updatedOrderId, updatedOrder) => {
        if (!updatedOrder) return;

        if (
          String(updatedOrder.userId) !== String(user.id)
        ) {
          return;
        }

        setOrders((previousOrders) => {
          const exists = previousOrders.some(
            (order) =>
              String(order.id) === String(updatedOrderId)
          );

          if (!exists) return previousOrders;

          return previousOrders.map((order) => {
            if (
              String(order.id) !== String(updatedOrderId)
            ) {
              return order;
            }

            if (order.status !== updatedOrder.status) {
              toast.info(
                `📦 Order #${order.id} is now ${updatedOrder.status}!`
              );
            }

            return {
              ...order,
              ...updatedOrder,
            };
          });
        });
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [getOrders, user?.id]);

  // ------------------------------------
  // RETURN / EXCHANGE CREATED
  // ------------------------------------

  const handleReturnCreated = (newTicket) => {
    setReturns((previousReturns) => [
      newTicket,
      ...previousReturns.filter(
        (ticket) =>
          String(ticket.id) !== String(newTicket.id)
      ),
    ]);

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        String(order.id) === String(newTicket.orderId)
          ? {
              ...order,
              status:
                newTicket.type === "exchange"
                  ? "Exchange Scheduled"
                  : "Return Scheduled",
            }
          : order
      )
    );

    setSelectedOrderForReturn(null);

    toast.success(
      newTicket.type === "exchange"
        ? "Exchange request created successfully!"
        : "Return request created successfully!"
    );
  };

  // ------------------------------------
  // RETURN PICKUP COMPLETED
  // ------------------------------------

  const handleTicketCompleted = (
    ticketId,
    orderId,
    finalOrderStatus
  ) => {
    setReturns((previousReturns) =>
      previousReturns.map((ticket) =>
        String(ticket.id) === String(ticketId)
          ? {
              ...ticket,
              status: "Picked Up & Completed",
            }
          : ticket
      )
    );

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        String(order.id) === String(orderId)
          ? {
              ...order,
              status: finalOrderStatus,
            }
          : order
      )
    );

    toast.success("Return pickup completed!");
  };

  // ------------------------------------
  // DOWNLOAD INVOICE
  // ------------------------------------

  const handleDownload = (order) => {
    try {
      downloadOrderInvoice(order);

      toast.success(
        `Invoice #${order.id} downloaded!`
      );

    } catch (err) {
      console.error("Invoice Error:", err);

      toast.error("Unable to download invoice.");
    }
  };

  // ------------------------------------
  // CANCEL ORDER + RESTORE INVENTORY
  // ------------------------------------

  const cancelOrder = async (order) => {
    if (!cancellableStatuses.includes(order.status)) {
      toast.warning(
        "This order can no longer be cancelled."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${order.id}?`
    );

    if (!confirmed) return;

    setCancellingId(order.id);

    const updatedProducts = [];

    try {
      const items = Array.isArray(order.items)
        ? order.items
        : [];

      if (items.length === 0) {
        throw new Error(
          "Order contains no product information."
        );
      }

      // Calculate quantities per product.
      const productQuantities = new Map();

      for (const item of items) {
        const productId = item.productId ?? item.id;

        if (productId == null) {
          throw new Error("A product ID is missing.");
        }

        const quantity = Number(item.quantity ?? 1);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          throw new Error("Invalid product quantity.");
        }

        const key = String(productId);

        productQuantities.set(
          key,
          (productQuantities.get(key) || 0) + quantity
        );
      }

      // Restore inventory.
      for (const [productId, quantity] of productQuantities) {
        const response = await api.get(
          `/products/${encodeURIComponent(productId)}`
        );

        const product = response.data;

        const previousStock = Number(product.stock || 0);

        updatedProducts.push({
          id: productId,
          previousStock,
        });

        await api.patch(
          `/products/${encodeURIComponent(productId)}`,
          {
            stock: previousStock + quantity,
          }
        );
      }

      // Update order in database.
      const cancelledAt = new Date().toISOString();

      await api.patch(
        `/orders/${encodeURIComponent(order.id)}`,
        {
          status: "Cancelled",
          cancelledAt,
        }
      );

      // Update local state.
      setOrders((previousOrders) =>
        previousOrders.map((item) =>
          String(item.id) === String(order.id)
            ? {
                ...item,
                status: "Cancelled",
                cancelledAt,
              }
            : item
        )
      );

      setActiveTrackingOrderId(null);

      toast.success(
        `Order #${order.id} cancelled and inventory restored!`
      );

    } catch (err) {
      console.error("Cancel Order Error:", err);

      // Rollback previously updated inventory.
      let rollbackFailed = false;

      for (const product of [...updatedProducts].reverse()) {
        try {
          await api.patch(
            `/products/${encodeURIComponent(product.id)}`,
            {
              stock: product.previousStock,
            }
          );

        } catch (rollbackError) {
          rollbackFailed = true;

          console.error(
            "Inventory rollback failed:",
            rollbackError
          );
        }
      }

      toast.error(
        rollbackFailed
          ? "Cancellation failed. Please verify product inventory."
          : err.message || "Failed to cancel your order."
      );

      await getOrders();

    } finally {
      setCancellingId(null);
    }
  };

  // ------------------------------------
  // ORDER STATUS HELPERS
  // ------------------------------------

  const getStatusStep = (status) => {
    return statuses.indexOf(status);
  };

  // ------------------------------------
  // LOADING
  // ------------------------------------

  if (loading) {
    return (
      <div className="orders-container">
        <h2
          style={{
            textAlign: "center",
            padding: "50px",
          }}
        >
          Loading Your Orders...
        </h2>
      </div>
    );
  }

  // ------------------------------------
  // LOGIN CHECK
  // ------------------------------------

  if (!user?.id) {
    return (
      <div className="orders-container">
        <h2>Please login to view your orders.</h2>

        <Link to="/login">
          Login Now
        </Link>
      </div>
    );
  }

  // ------------------------------------
  // MAIN UI
  // ------------------------------------

  return (
    <div className="orders-container">

      {/* PAGE HEADER */}

      <div className="orders-page-header">
        <h1 className="page-title">
          My Orders & Live Fulfillment Tracking
        </h1>

        <button
          type="button"
          className="refresh-btn"
          onClick={getOrders}
          disabled={loading}
        >
          ↻ Refresh Orders
        </button>
      </div>

      {/* FETCH ERROR */}

      {error && (
        <div className="empty-cart">
          <h2>Unable to load orders</h2>

          <p>
            Please check your connection and try again.
          </p>

          <button
            type="button"
            className="refresh-btn"
            onClick={getOrders}
          >
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* ACTIVE RETURNS AND EXCHANGES */}

          {returns.length > 0 && (
            <section className="active-returns-section">

              <h2>
                🚚 Live Return & Instant Exchange Pickups
              </h2>

              <div className="returns-list">
                {returns.map((ticket) => (
                  <ReturnPickupTracker
                    key={ticket.id}
                    ticket={ticket}
                    onTicketCompleted={handleTicketCompleted}
                  />
                ))}
              </div>

            </section>
          )}

          {/* EMPTY ORDERS */}

          {orders.length === 0 ? (
            <div className="empty-cart">
              <h2>No Orders Found</h2>

              <p>
                You haven't placed any orders yet.
              </p>

              <Link to="/products">
                Continue Shopping
              </Link>
            </div>
          ) : (

            /* ORDERS LIST */

            <div className="orders-list">

              {orders.map((order) => {
                const currentStep = getStatusStep(
                  order.status
                );

                const items = Array.isArray(order.items)
                  ? order.items
                  : [];

                const milestones = Array.isArray(
                  order.milestones
                )
                  ? order.milestones
                  : [];

                const canCancel =
                  cancellableStatuses.includes(order.status);

                const canReturn =
                  returnEligibleStatuses.includes(order.status);

                const isCancelled =
                  order.status === "Cancelled";

                const isTracking =
                  String(activeTrackingOrderId) ===
                  String(order.id);

                const currentStageIdx =
                  FULFILLMENT_STAGES.findIndex(
                    (stage) =>
                      stage.stage === order.status
                  );

                return (
                  <div
                    key={order.id}
                    className="order-card"
                  >

                    {/* ORDER HEADER */}

                    <div className="order-header">

                      <div>
                        <h3>
                          Order #{order.id}
                        </h3>

                        <p>
                          <strong>Placed on:</strong>{" "}
                          {order.orderDate
                            ? new Date(
                                order.orderDate
                              ).toLocaleString("en-IN")
                            : "Date unavailable"}
                        </p>

                        {order.shippingAddress && (
                          <p className="order-shipping-addr">
                            <strong>Shipping to:</strong>{" "}
                            {order.shippingAddress.street},{" "}
                            {order.shippingAddress.city},{" "}
                            {order.shippingAddress.state}{" "}
                            {order.shippingAddress.zip}
                          </p>
                        )}
                      </div>

                      <div className="order-header-actions">

                        <span
                          className={`status-badge status-${(
                            order.status || "unknown"
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {order.status || "Unknown"}
                        </span>

                        <h3>
                          Total:{" "}
                          {formatPrice(
                            Number(order.totalAmount || 0)
                          )}
                        </h3>

                        <button
                          type="button"
                          className="invoice-btn"
                          onClick={() =>
                            handleDownload(order)
                          }
                        >
                          📄 Download Invoice
                        </button>

                      </div>
                    </div>

                    {/* FULFILLMENT PROGRESS */}

                    {!isCancelled && (
                      <div className="fulfillment-stepper">

                        {FULFILLMENT_STAGES.map(
                          (stepObj, idx) => (
                            <div
                              key={stepObj.stage}
                              className={`stepper-node ${
                                idx <= currentStageIdx &&
                                currentStageIdx >= 0
                                  ? "completed"
                                  : ""
                              }`}
                            >
                              <div className="node-dot">
                                {idx < currentStageIdx
                                  ? "✓"
                                  : idx === currentStageIdx
                                  ? "●"
                                  : ""}
                              </div>

                              <span>
                                {stepObj.stage}
                              </span>
                            </div>
                          )
                        )}

                      </div>
                    )}

                    {/* FALLBACK TIMELINE */}

                    {!isCancelled &&
                      FULFILLMENT_STAGES.length === 0 && (
                        <div className="timeline-container">

                          {statuses.map(
                            (step, index) => (
                              <div
                                key={step}
                                className={`timeline-step ${
                                  currentStep >= 0 &&
                                  index <= currentStep
                                    ? "completed"
                                    : ""
                                }`}
                              >
                                <div className="step-bullet">
                                  {currentStep >= 0 &&
                                  index <= currentStep
                                    ? "✓"
                                    : index + 1}
                                </div>

                                <span>{step}</span>
                              </div>
                            )
                          )}

                        </div>
                      )}

                    {/* ORDER ITEMS */}

                    <div className="order-items">

                      {items.length === 0 ? (
                        <p>
                          No product details available.
                        </p>
                      ) : (
                        items.map((item, index) => (
                          <div
                            key={
                              item.id ??
                              item.productId ??
                              index
                            }
                            className="order-item"
                          >
                            <img
                              src={
                                item.image ||
                                "/placeholder.png"
                              }
                              alt={
                                item.name || "Product"
                              }
                            />

                            <div>
                              <h4>
                                {item.name ||
                                  "Unknown Product"}
                              </h4>

                              <p>
                                {item.brand &&
                                  `${item.brand} • `}
                                {formatPrice(
                                  Number(item.price || 0)
                                )}
                              </p>

                              {item.variant && (
                                <p>
                                  Variant: {item.variant}
                                </p>
                              )}

                              <p>
                                Quantity:{" "}
                                {Number(item.quantity || 1)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}

                    </div>

                    {/* WAREHOUSE ACTIVITY FEED */}

                    <div className="milestone-feed">

                      <h4>
                        📦 Warehouse Packing Log
                      </h4>

                      {milestones.length === 0 ? (
                        <p className="milestone-empty">
                          Awaiting warehouse scan...
                        </p>
                      ) : (
                        <ul>
                          {milestones.map(
                            (milestone, index) => (
                              <li
                                key={index}
                                className="milestone-item"
                              >
                                <span className="milestone-time">
                                  [{milestone.timestamp}]
                                </span>{" "}

                                <strong>
                                  {milestone.stage}:
                                </strong>{" "}

                                {milestone.note}
                              </li>
                            )
                          )}
                        </ul>
                      )}

                    </div>

                    {/* ORDER FOOTER */}

                    <div className="order-footer">

                      <div>
                        <p>
                          <strong>Payment:</strong>{" "}
                          {order.paymentMethod || "Standard"}
                        </p>

                        <p>
                          <strong>Payment Status:</strong>{" "}
                          {order.paymentStatus || "Paid"}
                        </p>
                      </div>

                      <h3>
                        Total Paid:{" "}
                        {formatPrice(
                          Number(order.totalAmount || 0)
                        )}
                      </h3>

                    </div>

                    {/* ORDER ACTIONS */}

                    <div className="order-actions">

                      {/* QR VERIFICATION */}

                      {!isCancelled && (
                        <button
                          type="button"
                          className="qr-pass-btn"
                          onClick={() =>
                            setSelectedOrderForQR(order)
                          }
                        >
                          📱 View Digital QR Pass
                        </button>
                      )}

                      {/* LIVE DELIVERY MAP */}

                      {!isCancelled &&
                        order.status !== "Delivered" &&
                        order.status !== "Completed" && (
                          <button
                            type="button"
                            className="track-map-btn"
                            onClick={() =>
                              setActiveTrackingOrderId(
                                isTracking
                                  ? null
                                  : order.id
                              )
                            }
                          >
                            {isTracking
                              ? "Hide Live Map 🗺️"
                              : "📍 Track Live Map"}
                          </button>
                        )}

                      {/* CANCEL ORDER */}

                      {canCancel && (
                        <button
                          type="button"
                          className="cancel-order-btn"
                          onClick={() =>
                            cancelOrder(order)
                          }
                          disabled={
                            cancellingId === order.id
                          }
                        >
                          {cancellingId === order.id
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      )}

                      {/* RETURN OR EXCHANGE */}

                      {canReturn && (
                        <button
                          type="button"
                          className="return-exchange-btn"
                          onClick={() =>
                            setSelectedOrderForReturn(order)
                          }
                        >
                          🔄 Return or Exchange
                        </button>
                      )}

                      {!canCancel && !canReturn && (
                        <p className="locked-msg">
                          {isCancelled
                            ? "This order has been cancelled."
                            : "This order is currently not eligible for cancellation or return."}
                        </p>
                      )}

                    </div>

                    {/* LIVE DELIVERY MAP */}

                    {isTracking && !isCancelled && (
                      <div className="live-map-container">

                        <h3>
                          📍 Live Delivery Tracking
                        </h3>

                        <LiveDeliveryMap order={order} />

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}
        </>
      )}

      {/* QR VERIFICATION MODAL */}

      {selectedOrderForQR && (
        <OrderVerificationModal
          order={selectedOrderForQR}
          onClose={() =>
            setSelectedOrderForQR(null)
          }
        />
      )}

      {/* RETURN / EXCHANGE MODAL */}

      {selectedOrderForReturn && (
        <ReturnExchangeModal
          order={selectedOrderForReturn}
          onClose={() =>
            setSelectedOrderForReturn(null)
          }
          onReturnCreated={handleReturnCreated}
        />
      )}

    </div>
  );
}

export default MyOrders;
