const supportChannel = new BroadcastChannel("shopsphere_live_support");

export function broadcastSupportMessage(userId, updatedChat) {
  supportChannel.postMessage({
    type: "SUPPORT_MESSAGE_UPDATE",
    userId,
    updatedChat
  });
}

export function subscribeToSupportChat(callback) {
  const handler = (event) => {
    if (event.data?.type === "SUPPORT_MESSAGE_UPDATE") {
      callback(event.data.userId, event.data.updatedChat);
    }
  };
  supportChannel.addEventListener("message", handler);
  return () => supportChannel.removeEventListener("message", handler);
}