
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadOrderInvoice(order, currencySymbol = "Rs. ") {
  if (!order) {
    console.error("Order details are missing.");
    return;
  }

  const doc = new jsPDF();

  const formatAmount = (amount) =>
    `${currencySymbol}${Number(amount || 0).toLocaleString("en-IN")}`;

  // Brand Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ShopSphere", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TAX INVOICE / ORDER RECEIPT", 140, 22);

  doc.setTextColor(30, 41, 59);

  // Order Details
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Order Details:", 14, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(`Order ID: #${order.id || "N/A"}`, 14, 55);
  doc.text(`Order Date: ${order.orderDate || "N/A"}`, 14, 61);
  doc.text(`Order Status: ${order.status || "Order Placed"}`, 14, 67);
  doc.text(
    `Payment Method: ${order.paymentMethod || "Online Payment"}`,
    14,
    73
  );

  if (order.transactionId && order.transactionId !== "N/A") {
    doc.text(`Transaction ID: ${order.transactionId}`, 14, 79);
  }

  // Shipping Address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed & Shipped To:", 120, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(order.userName || "Customer", 120, 55);

  if (order.shippingAddress) {
    const addr = order.shippingAddress;

    doc.text(addr.street || "", 120, 61);
    doc.text(`${addr.city || ""} - ${addr.zip || ""}`, 120, 67);
    doc.text(`Label: ${addr.label || "Home"}`, 120, 73);
  }

  // Products Table
  const tableRows = (order.items || []).map((item, index) => [
    index + 1,
    item.name || "Product",
    item.brand || "-",
    item.category || "-",
    formatAmount(item.price),
  ]);

  autoTable(doc, {
    startY: 90,
    head: [["#", "Product Name", "Brand", "Category", "Price"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      4: { halign: "right" },
    },
  });

  // Totals
  let finalY = (doc.lastAutoTable?.finalY || 90) + 12;

  // Move totals to a new page if necessary
  if (finalY > 255) {
    doc.addPage();
    finalY = 20;
  }

  const subtotal = order.subtotal ?? order.totalAmount ?? 0;
  const discount = Number(order.discount || 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);

  doc.text("Subtotal:", 140, finalY);
  doc.text(formatAmount(subtotal), 175, finalY, { align: "right" });

  if (discount > 0) {
    doc.setTextColor(22, 163, 74);

    doc.text(
      `Discount (${order.promoCode || "Promo"}):`,
      125,
      finalY + 7
    );

    doc.text(
      `- ${formatAmount(discount)}`,
      175,
      finalY + 7,
      { align: "right" }
    );

    doc.setTextColor(30, 41, 59);
  }

  // Grand Total
  const totalRowY = discount > 0 ? finalY + 16 : finalY + 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text("Grand Total:", 140, totalRowY);
  doc.text(
    formatAmount(order.totalAmount),
    175,
    totalRowY,
    { align: "right" }
  );

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  doc.text(
    "Thank you for shopping with ShopSphere!",
    105,
    285,
    { align: "center" }
  );

  // Download Invoice
  doc.save(`ShopSphere_Invoice_${order.id || "Order"}.pdf`);
}
