const alertWebhookChannel = new BroadcastChannel("shopsphere_price_stock_webhook");

export function broadcastProductUpdateWebhook(updatedProduct) {
  alertWebhookChannel.postMessage({
    type: "PRODUCT_UPDATED",
    updatedProduct
  });
}

export function subscribeToProductWebhooks(callback) {
  const handler = (event) => {
    if (event.data?.type === "PRODUCT_UPDATED") {
      callback(event.data.updatedProduct);
    }
  };
  alertWebhookChannel.addEventListener("message", handler);
  return () => alertWebhookChannel.removeEventListener("message", handler);
}