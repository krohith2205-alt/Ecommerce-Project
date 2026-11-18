import { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";

function WarehouseRadar({ product, onFulfillmentChange }) {
  const { formatPrice } = useCurrency();
  const warehouses = product?.warehouses || [];

  const [selectedHub, setSelectedHub] = useState(warehouses[0] || null);
  const [fulfillmentType, setFulfillmentType] = useState("standard"); // 'standard' or 'pickup'

  useEffect(() => {
    if (warehouses.length > 0 && !selectedHub) {
      setSelectedHub(warehouses[0]);
    }
  }, [warehouses, selectedHub]);

  useEffect(() => {
    if (!selectedHub) return;

    // Calculate delivery fee & ETA based on choice
    const fee = fulfillmentType === "pickup" ? 0 : selectedHub.stock > 0 ? 150 : 250;
    const eta = fulfillmentType === "pickup" ? "⚡ Ready in 60 Mins (Store Pickup)" : selectedHub.etaStandard;

    onFulfillmentChange({
      hubId: selectedHub.id,
      hubName: selectedHub.name,
      fulfillmentType,
      shippingFee: fee,
      eta,
      isAvailable: fulfillmentType === "pickup" ? selectedHub.stock > 0 : true
    });
  }, [selectedHub, fulfillmentType, onFulfillmentChange]);

  if (warehouses.length === 0) return null;

  return (
    <div className="warehouse-radar-container">
      <div className="radar-header">
        <h4>📍 Regional Fulfillment Hub Radar</h4>
        <span className="live-radar-badge">● Live Inventory</span>
      </div>

      <p className="radar-subtitle">Select your nearest regional depot for stock availability and express pickup:</p>

      {/* Hub Selection Cards */}
      <div className="hub-cards-grid">
        {warehouses.map((hub) => {
          const isSelected = selectedHub?.id === hub.id;
          const isOutOfStock = hub.stock <= 0;

          return (
            <div
              key={hub.id}
              className={`hub-card ${isSelected ? "selected-hub" : ""} ${isOutOfStock ? "out-hub" : ""}`}
              onClick={() => setSelectedHub(hub)}
            >
              <div className="hub-top">
                <strong>{hub.city}</strong>
                <span className={`stock-badge ${isOutOfStock ? "zero" : "in"}`}>
                  {isOutOfStock ? "Out of Stock" : `${hub.stock} units`}
                </span>
              </div>
              <small>{hub.name}</small>
              <span className="hub-eta">Standard ETA: {hub.etaStandard}</span>
            </div>
          );
        })}
      </div>

      {/* Fulfillment Mode Toggle */}
      <div className="fulfillment-toggle-row">
        <button
          type="button"
          className={`mode-btn ${fulfillmentType === "standard" ? "active" : ""}`}
          onClick={() => setFulfillmentType("standard")}
        >
          🚚 Standard Home Delivery <span>(+{formatPrice(150)})</span>
        </button>

        <button
          type="button"
          className={`mode-btn ${fulfillmentType === "pickup" ? "active" : ""} ${
            selectedHub?.stock <= 0 ? "disabled-mode" : ""
          }`}
          disabled={selectedHub?.stock <= 0}
          onClick={() => setFulfillmentType("pickup")}
        >
          ⚡ 60-Minute Express Hub Pickup <span className="free-tag">FREE</span>
        </button>
      </div>
    </div>
  );
}

export default WarehouseRadar;