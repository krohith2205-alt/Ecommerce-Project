import { useState } from "react";
import { toast } from "react-toastify";

function PaymentModal({ amount, onClose, onPaymentSuccess }) {
  const [method, setMethod] = useState("card"); // "card" | "upi" | "cod"
  const [isProcessing, setIsProcessing] = useState(false);

  // Card Details State
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // UPI State
  const [upiId, setUpiId] = useState("");

  function handlePay(e) {
    e.preventDefault();

    // Basic Validation
    if (method === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16 || !expiry || cvv.length < 3 || !cardName) {
        toast.warn("Please enter valid card details.");
        return;
      }
    }

    if (method === "upi") {
      if (!upiId.includes("@")) {
        toast.warn("Please enter a valid UPI ID (e.g., name@okaxis).");
        return;
      }
    }

    // Simulate Gateway Processing Delay
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const paymentLabel =
        method === "card"
          ? `Card ending in ${cardNumber.slice(-4)}`
          : method === "upi"
          ? `UPI (${upiId})`
          : "Cash on Delivery";

      const transactionId = "TXN_" + Math.floor(100000000 + Math.random() * 900000000);

      onPaymentSuccess({
        paymentMethod: paymentLabel,
        paymentStatus: method === "cod" ? "Pending (COD)" : "Paid",
        transactionId: method === "cod" ? "N/A" : transactionId
      });
    }, 2000);
  }

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-card">
        {/* Header */}
        <div className="payment-header">
          <div>
            <h2>ShopSphere Pay</h2>
            <p className="secure-badge">🔒 256-Bit SSL Secured Checkout</p>
          </div>
          <button className="close-modal-btn" onClick={onClose} disabled={isProcessing}>
            ✕
          </button>
        </div>

        {/* Amount Banner */}
        <div className="payment-amount-bar">
          <span>Payable Amount</span>
          <strong>₹{amount}</strong>
        </div>

        {/* Payment Method Tabs */}
        <div className="payment-tabs">
          <button
            type="button"
            className={method === "card" ? "active-tab" : ""}
            onClick={() => setMethod("card")}
            disabled={isProcessing}
          >
            💳 Card
          </button>
          <button
            type="button"
            className={method === "upi" ? "active-tab" : ""}
            onClick={() => setMethod("upi")}
            disabled={isProcessing}
          >
            📱 UPI
          </button>
          <button
            type="button"
            className={method === "cod" ? "active-tab" : ""}
            onClick={() => setMethod("cod")}
            disabled={isProcessing}
          >
            💵 Cash on Delivery
          </button>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePay} className="payment-form">
          {method === "card" && (
            <>
              <input
                type="text"
                placeholder="Cardholder Name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                disabled={isProcessing}
              />
              <input
                type="text"
                placeholder="Card Number (16 digits)"
                maxLength="19"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(
                    e.target.value
                      .replace(/\D/g, "")
                      .replace(/(.{4})/g, "$1 ")
                      .trim()
                  )
                }
                disabled={isProcessing}
              />
              <div className="card-row">
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength="5"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  disabled={isProcessing}
                />
                <input
                  type="password"
                  placeholder="CVV"
                  maxLength="3"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  disabled={isProcessing}
                />
              </div>
            </>
          )}

          {method === "upi" && (
            <div className="upi-box">
              <input
                type="text"
                placeholder="Enter UPI ID (e.g., alex@oksbi)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={isProcessing}
              />
              <small>Supports Google Pay, PhonePe, Paytm & BHIM UPI</small>
            </div>
          )}

          {method === "cod" && (
            <div className="cod-box">
              <p>Pay with cash or UPI upon delivery at your doorstep.</p>
              <small>No extra convenience fee applied.</small>
            </div>
          )}

          <button type="submit" className="pay-now-btn" disabled={isProcessing}>
            {isProcessing ? (
              <span className="spinner-wrapper">
                <span className="spinner"></span> Processing Payment...
              </span>
            ) : method === "cod" ? (
              `Confirm COD Order (₹${amount})`
            ) : (
              `Pay ₹${amount} Now`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;