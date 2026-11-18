import { useState } from "react";
import { useSharedCartSocket } from "../hooks/useSharedCartSocket";
import { toast } from "react-toastify";

function SharedCartManager({ cart, setCart }) {
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const { broadcastCartChange, broadcastActivity, activePartnerActivity, roomMembers } =
    useSharedCartSocket(activeRoom, user, cart, setCart);

  function handleJoinRoom(e) {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    const code = roomCodeInput.trim().toUpperCase();
    setActiveRoom(code);
    toast.success(`Successfully connected to shared cart room: ${code}`);
  }

  function handleLeaveRoom() {
    setActiveRoom(null);
    toast.info("Disconnected from shared cart room.");
  }

  return (
    <div className="shared-cart-banner">
      <div className="shared-cart-header">
        <h3>👥 Collaborative Shared Cart</h3>
        <p>Shop together with friends or family in real time!</p>
      </div>

      {!activeRoom ? (
        <form onSubmit={handleJoinRoom} className="shared-cart-form">
          <input
            type="text"
            placeholder="Enter Room Code (e.g. FAMILY2026)"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <button type="submit" className="join-room-btn">Join Room</button>
        </form>
      ) : (
        <div className="active-room-box">
          <div className="room-status-row">
            <span>Active Room Code: <strong>{activeRoom}</strong></span>
            <button onClick={handleLeaveRoom} className="leave-room-btn">Disconnect</button>
          </div>
          {activePartnerActivity && (
            <p className="partner-activity-ticker">⚡ {activePartnerActivity}</p>
          )}
          <small>Connected members: {roomMembers.join(", ") || "Just you"}</small>
        </div>
      )}
    </div>
  );
}

export default SharedCartManager;