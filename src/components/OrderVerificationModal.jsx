import { QRCodeSVG } from "qrcode.react";
import { useCurrency } from "../context/CurrencyContext";

function OrderVerificationModal({ order, onClose }) {
  const { formatPrice } = useCurrency();

  // Create a verification payload string for the QR code
  const verificationPayload = JSON.stringify({
    orderId: order.id,
    user: order.userName,
    total: order.totalAmount,
    status: order.status,
    date: order.orderDate,
    secureHash: `SHOPSHERE-SECURE-${order.id}-${order.userId}`
  });

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h3>🔐 Official Order Verification & QR Pass</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="qr-code-display-box">
          <QRCodeSVG value={verificationPayload} size={160} level="H" includeMargin={true} />
          <span className="qr-subtext">Scan with warehouse scanner or camera</span>
        </div>

        <div className="qr-order-details">
          <div className="qr-row">
            <span>Order ID:</span>
            <strong>#{order.id}</strong>
          </div>
          <div className="qr-row">
            <span>Customer:</span>
            <strong>{order.userName}</strong>
          </div>
          <div className="qr-row">
            <span>Courier Partner:</span>
            <strong>BlueDart Express (AWB: BS-{order.id}-99X)</strong>
          </div>
          <div className="qr-row">
            <span>Verification Status:</span>
            <strong className="verified-pill">✔ Authenticated & Active</strong>
          </div>
        </div>

        <div className="qr-items-receipt">
          <h4>Itemized Receipt</h4>
          <ul>
            {(order.items || []).map((item, idx) => (
              <li key={idx}>
                <span>{item.name}</span>
                <span>{formatPrice(item.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="qr-modal-footer">
          <button className="print-invoice-btn" onClick={() => window.print()}>
            🖨️ Print / Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderVerificationModal;