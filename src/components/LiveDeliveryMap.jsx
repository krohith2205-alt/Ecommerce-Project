import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom delivery driver icon
const driverIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3014/3014232.png",
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// Simulated Route Coordinates [Latitude, Longitude] (e.g., Warehouse to Delivery Destination)
const warehouseCoords = [28.6139, 77.2090]; // New Delhi Center
const destinationCoords = [28.5355, 77.3910]; // Noida / Delivery Target

function LiveDeliveryMap({ order }) {
  const [driverPos, setDriverPos] = useState(warehouseCoords);
  const [deliveryProgress, setDeliveryProgress] = useState(0); // 0 to 100%
  const [statusText, setStatusText] = useState("Order Dispatched from Warehouse");

  useEffect(() => {
    // Simulate real-time GPS driver movement along the route
    let step = 0;
    const totalSteps = 50;

    const interval = setInterval(() => {
      step += 1;
      const ratio = step / totalSteps;

      // Linear interpolation between warehouse and destination
      const currentLat = warehouseCoords[0] + (destinationCoords[0] - warehouseCoords[0]) * ratio;
      const currentLng = warehouseCoords[1] + (destinationCoords[1] - warehouseCoords[1]) * ratio;

      setDriverPos([currentLat, currentLng]);
      setDeliveryProgress(Math.round(ratio * 100));

      if (ratio < 0.3) {
        setStatusText("📦 Dispatched from Fulfillment Center");
      } else if (ratio < 0.7) {
        setStatusText("motorcycle Driver is on the way (Traffic normal)");
      } else if (ratio < 1) {
        setStatusText("⚡ Out for Delivery - Arriving Soon!");
      } else {
        setStatusText("✅ Delivered Successfully!");
        clearInterval(interval);
      }
    }, 2000); // Updates position every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-map-container">
      <div className="map-header-info">
        <h3>Live GPS Delivery Tracking</h3>
        <p className="status-badge">{statusText}</p>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${deliveryProgress}%` }}></div>
        </div>
        <small>Estimated Arrival: 15 Minutes • Driver: Rajesh Kumar (Rating: 4.9 ⭐)</small>
      </div>

      {/* Leaflet Map View */}
      <div className="leaflet-wrapper">
        <MapContainer center={warehouseCoords} zoom={12} scrollWheelZoom={false} style={{ height: "350px", width: "100%", borderRadius: "12px" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Warehouse Marker */}
          <Marker position={warehouseCoords}>
            <Popup>ShopSphere Fulfillment Hub</Popup>
          </Marker>

          {/* Destination Address Marker */}
          <Marker position={destinationCoords}>
            <Popup>Delivery Address: {order?.shippingAddress?.street || "Your Location"}</Popup>
          </Marker>

          {/* Live Moving Driver Marker */}
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>Delivery Partner is here! ({deliveryProgress}% completed)</Popup>
          </Marker>

          {/* Route Line */}
          <Polyline positions={[warehouseCoords, destinationCoords]} color="#2563eb" weight={4} dashArray="8, 8" />
        </MapContainer>
      </div>
    </div>
  );
}

export default LiveDeliveryMap;