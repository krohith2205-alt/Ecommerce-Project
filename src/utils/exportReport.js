export function exportSalesToCSV(orders) {
  if (!orders || orders.length === 0) {
    alert("No order data available to export.");
    return;
  }

  // Define CSV Headers
  const headers = [
    "Order ID",
    "Customer Name",
    "Order Date",
    "Status",
    "Payment Method",
    "Items Count",
    "Items Summary",
    "Subtotal",
    "Discount",
    "Total Amount"
  ];

  // Map orders to CSV rows
  const rows = orders.map((order) => {
    const itemsSummary = (order.items || [])
      .map((item) => `${item.name} (x1)`)
      .join(" | ");

    return [
      order.id,
      `"${order.userName || "Customer"}"`,
      order.orderDate || "N/A",
      order.status || "Order Placed",
      `"${order.paymentMethod || "N/A"}"`,
      (order.items || []).length,
      `"${itemsSummary}"`,
      order.subtotal || order.totalAmount,
      order.discount || 0,
      order.totalAmount
    ];
  });

  // Combine headers and rows into CSV text content
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  // Create temporary anchor tag and trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ShopSphere_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}