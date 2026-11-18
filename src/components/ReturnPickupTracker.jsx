import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";
import api from "../services/api";

const vanIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const homeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619153.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

function ReturnPickupTracker({ ticket, onTicketCompleted }) {
  const { formatPrice } = useCurrency();
  const [driverPos, setDriverPos] = useState([ticket.driverLat, ticket.driverLng]);
  const [status, setStatus] = useState(ticket.status);
  const [progress, setProgress] = useState(ticket.status === "Picked Up & Completed" ? 100 : 15);

  const customerPos = [ticket.customerLat, ticket.customerLng];

  useEffect(() => {
    if (status === "Picked Up & Completed") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 17, 100);
        const ratio = next / 100;

        const nextLat = ticket.driverLat + (ticket.customerLat - ticket.driverLat) * ratio;
        const nextLng = ticket.driverLng + (ticket.customerLng - ticket.driverLng) * ratio;
        setDriverPos([nextLat, nextLng]);

        if (next >= 100) {
          clearInterval(interval);
          finalizePickup();
        }
        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [status, ticket]);

  async function finalizePickup() {
    try {
      const finalOrderStatus =
        ticket.type === "exchange" ? "Replacement Dispatched" : "Refunded";

      await Promise.all([
        api.patch(`/returns/${ticket.id}`, {
          status: "Picked Up & Completed",
          driverLat: ticket.customerLat,
          driverLng: ticket.customerLng
        }),
        api.patch(`/orders/${ticket.orderId}`, { status: finalOrderStatus })
      ]);

      setStatus("Picked Up & Completed");
      toast.success(
        ticket.type === "exchange"
          ? `📦 Item picked up! Replacement (${ticket.replacementVariant}) dispatched.`
          : `✅ Item picked up! ${formatPrice(ticket.refundAmount)} refunded to your account.`
      );

      if (onTicketCompleted) {
        onTicketCompleted(ticket.id, ticket.orderId, finalOrderStatus);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="return-tracker-card">
      <div className="return-tracker-top">
        <div>
          <span className="return-type-tag">
            {ticket.type === "exchange" ? "⚡ INSTANT EXCHANGE" : "💸 RETURN & REFUND"}
          </span>
          <h4>
            Order #{ticket.orderId} — {ticket.productName}
          </h4>
          <p className="return-meta">
            Slot: <strong>{ticket.pickupSlot}</strong> • Courier: <strong>{ticket.driverName}</strong>
            {ticket.replacementVariant && (
              <>
                {" "}
                • Replacement: <strong>{ticket.replacementVariant}</strong>
              </>
            )}
          </p>
        </div>

        <span
          className={`return-status-pill ${
            status === "Picked Up & Completed" ? "done" : "en-route"
          }`}
        >
          {status === "Picked Up & Completed" ? "✔ Picked Up & Completed" : `🚚 ${status} (${progress}%)`}
        </span>
      </div>

      {/* Live Leaflet Pickup Map */}
      <div className="return-map-wrapper">
        <MapContainer
          center={customerPos}
          zoom={12}
          style={{ height: "210px", width: "100%", borderRadius: "10px" }}
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={driverPos} icon={vanIcon}>
            <Popup>Pickup Agent: {ticket.driverName}</Popup>
          </Marker>
          <Marker position={customerPos} icon={homeIcon}>
            <Popup>Your Doorstep Pickup Location</Popup>
          </Marker>
          <Polyline positions={[driverPos, customerPos]} color="#2563eb" dashArray="6" />
        </MapContainer>
      </div>
    </div>
  );
}

export default ReturnPickupTracker;