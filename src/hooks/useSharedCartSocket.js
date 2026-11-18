import { useEffect, useState } from "react";
import { toast } from "react-toastify";

// Using BroadcastChannel to simulate multi-tab/multi-user real-time socket communication locally
const cartChannel = new BroadcastChannel("shopsphere_shared_cart_channel");

export function useSharedCartSocket(roomCode, user, currentCart, setCartCallback) {
  const [activePartnerActivity, setActivePartnerActivity] = useState("");
  const [roomMembers, setRoomMembers] = useState([]);

  useEffect(() => {
    if (!roomCode) return;

    // Announce user joined room
    cartChannel.postMessage({
      type: "JOIN_ROOM",
      roomCode,
      userName: user?.name || "Anonymous Guest"
    });

    cartChannel.onmessage = (event) => {
      const data = event.data;
      if (data.roomCode !== roomCode) return;

      if (data.type === "JOIN_ROOM") {
        setRoomMembers((prev) => Array.from(new Set([...prev, data.userName])));
        toast.info(`👋 ${data.userName} joined the shared cart room!`, { autoClose: 3000 });
      } else if (data.type === "CART_UPDATE") {
        if (data.senderId !== user?.id) {
          setCartCallback(data.updatedCart);
          toast.info(`🛒 ${data.userName} updated the shared cart!`, { autoClose: 2500 });
        }
      } else if (data.type === "ACTIVITY_UPDATE") {
        if (data.senderId !== user?.id) {
          setActivePartnerActivity(data.activityText);
        }
      }
    };

    return () => {
      cartChannel.onmessage = null;
    };
  }, [roomCode, user]);

  // Function to broadcast cart changes to other users in the room
  function broadcastCartChange(updatedCart) {
    cartChannel.postMessage({
      type: "CART_UPDATE",
      roomCode,
      senderId: user?.id,
      userName: user?.name || "Partner",
      updatedCart
    });
  }

  // Function to broadcast live activity (e.g., "Sarah is looking at Headphones")
  function broadcastActivity(activityText) {
    cartChannel.postMessage({
      type: "ACTIVITY_UPDATE",
      roomCode,
      senderId: user?.id,
      activityText
    });
  }

  return {
    broadcastCartChange,
    broadcastActivity,
    activePartnerActivity,
    roomMembers
  };
}