const fulfillmentChannel = new BroadcastChannel("shopsphere_order_fulfillment");

export const FULFILLMENT_STAGES = [
  { stage: "Order Placed", note: "Order confirmed and queued." },
  { stage: "Processing", note: "Items picked from warehouse shelves." },
  { stage: "Quality Check", note: "Product inspected and verified for defects." },
  { stage: "Packed & Ready", note: "Securely boxed and awaiting courier pickup." },
  { stage: "Out for Delivery", note: "Handed over to delivery partner." },
  { stage: "Delivered", note: "Package delivered to customer." }
];

export function broadcastOrderMilestone(orderId, updatedOrder) {
  fulfillmentChannel.postMessage({
    type: "ORDER_MILESTONE_UPDATE",
    orderId,
    updatedOrder
  });
}

export function subscribeToOrderUpdates(callback) {
  const handler = (event) => {
    if (event.data?.type === "ORDER_MILESTONE_UPDATE") {
      callback(event.data.orderId, event.data.updatedOrder);
    }
  };
  fulfillmentChannel.addEventListener("message", handler);
  return () => fulfillmentChannel.removeEventListener("message", handler);
}