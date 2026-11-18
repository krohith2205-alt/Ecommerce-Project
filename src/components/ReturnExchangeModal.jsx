import { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";
import api from "../services/api";

const RETURN_REASONS = [
  "Wrong color or size ordered",
  "Item arrived damaged or defective",
  "Product does not match description",
  "Performance or quality below expectation"
];

const PICKUP_SLOTS = [
  "Today, 2:00 PM - 4:00 PM",
  "Today, 5:00 PM - 7:00 PM",
  "Tomorrow, 10:00 AM - 12:00 PM"
];

function ReturnExchangeModal({ order, onClose, onReturnCreated }) {
  const { formatPrice } = useCurrency();
  const targetItem = order.items?.[0] || {};

  const [requestType, setRequestType] = useState("exchange"); // "exchange" | "refund"
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [pickupSlot, setPickupSlot] = useState(PICKUP_SLOTS[0]);
  const [productDetails, setProductDetails] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch product variants from db.json for live exchange options
  useEffect(() => {
    if (!targetItem.id) return;
    api
      .get(`/products/${targetItem.id}`)
      .then((res) => {
        const prod = res.data;
        setProductDetails(prod);
        setSelectedColor(prod.variants?.colors?.[0]?.name || "Standard");
        setSelectedOption(prod.variants?.options?.[0]?.label || "Standard");
      })
      .catch(() => setProductDetails(null));
  }, [targetItem.id]);

  async function handleSubmitReturn(e) {
    e.preventDefault();
    setSubmitting(true);

    const replacementSummary =
      requestType === "exchange"
        ? [selectedColor, selectedOption].filter((v) => v && v !== "Standard").join(" / ") ||
          "Standard Replacement"
        : null;

    const newReturnTicket = {
      orderId: order.id,
      userId: order.userId,
      productId: targetItem.id || "1",
      productName: targetItem.name || `Order #${order.id} Bundle`,
      type: requestType,
      reason,
      replacementVariant: replacementSummary,
      pickupSlot,
      refundAmount: requestType === "refund" ? Number(order.totalAmount) : 0,
      status: "Agent En Route",
      driverName: "Ramesh Varma",
      driverLat: 17.7185,
      driverLng: 83.3020,
      customerLat: 17.6868,
      customerLng: 83.2185,
      createdAt: new Date().toISOString()
    };

    try {
      const [retRes] = await Promise.all([
        api.post("/returns", newReturnTicket),
        api.patch(`/orders/${order.id}`, {
          status: requestType === "exchange" ? "Exchange Scheduled" : "Return Scheduled"
        })
      ]);

      // Broadcast real-time update across open tabs
      const channel = new BroadcastChannel("shopsphere_realtime");
      channel.postMessage({ type: "RETURN_CREATED", payload: retRes.data });
      channel.close();

      toast.success(
        requestType === "exchange"
          ? `🔄 Instant Exchange scheduled for ${pickupSlot}!`
          : `💸 Return pickup scheduled! Refund of ${formatPrice(order.totalAmount)} queued.`
      );

      onReturnCreated(retRes.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule pickup. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="return-modal-overlay" onClick={onClose}>
      <div className="return-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="return-modal-header">
          <h3>🔄 Smart Return & Instant Exchange Portal</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmitReturn} className="return-form">
          <div className="return-item-banner">
            <strong>Order #{order.id}</strong> — {targetItem.name || "Delivered Items"} (
            {formatPrice(order.totalAmount)})
          </div>

          {/* Toggle Exchange vs Refund */}
          <div className="return-type-toggle">
            <button
              type="button"
              className={`type-pill ${requestType === "exchange" ? "active" : ""}`}
              onClick={() => setRequestType("exchange")}
            >
              ⚡ Instant Variant Exchange
            </button>
            <button
              type="button"
              className={`type-pill ${requestType === "refund" ? "active" : ""}`}
              onClick={() => setRequestType("refund")}
            >
              💸 Doorstep Return & Refund
            </button>
          </div>

          {/* Variant Selector for Instant Exchange */}
          {requestType === "exchange" && (
            <div className="exchange-variant-box">
              <label>Select Replacement Variant (Live Stock from Catalog):</label>
              {productDetails?.variants ? (
                <div className="exchange-select-grid">
                  {productDetails.variants.colors?.length > 0 && (
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                    >
                      {productDetails.variants.colors.map((c) => (
                        <option key={c.name} value={c.name}>
                          Finish: {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {productDetails.variants.options?.length > 0 && (
                    <select
                      value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    >
                      {productDetails.variants.options.map((opt) => (
                        <option key={opt.label} value={opt.label} disabled={opt.stock <= 0}>
                          {opt.label} ({opt.stock > 0 ? `${opt.stock} in stock` : "Out of Stock"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <p className="exchange-note">
                  Same-model replacement unit will be dispatched immediately upon pickup scan.
                </p>
              )}
            </div>
          )}

          {/* Return Reason */}
          <div className="return-field">
            <label>Reason for {requestType === "exchange" ? "Exchange" : "Return"}:</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Doorstep Pickup Window */}
          <div className="return-field">
            <label>Doorstep Courier Pickup Slot:</label>
            <select value={pickupSlot} onChange={(e) => setPickupSlot(e.target.value)}>
              {PICKUP_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="confirm-return-btn" disabled={submitting}>
            {submitting
              ? "Scheduling Pickup Agent..."
              : requestType === "exchange"
              ? "Confirm Instant Exchange & Track Agent"
              : `Confirm Return & Queue ${formatPrice(order.totalAmount)} Refund`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReturnExchangeModal;