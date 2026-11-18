import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { removeFromCart, clearCart } from "../features/cartSlice";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";
import PaymentModal from "./PaymentModal";
import api from "../services/api";

function CheckoutWizard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const { formatPrice } = useCurrency();
  const user = JSON.parse(localStorage.getItem("user"));

  const [step, setStep] = useState(1); // 1: Cart, 2: Address, 3: Payment & Review
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  
  // Loyalty & Promo
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.info("Please login to proceed to checkout");
      navigate("/login");
      return;
    }

    api.get(`/users/${user.id}`).then((res) => {
      const userData = res.data;
      setAddresses(userData.addresses || []);
      setUserPoints(userData.loyaltyPoints || 0);
      if (userData.addresses && userData.addresses.length > 0) {
        setSelectedAddressId(String(userData.addresses[0].id));
      }
    });
  }, [user, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);

  function handleApplyCoupon(e) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();

    if (code === "SAVE20") {
      const discount = Math.round(subtotal * 0.2);
      setDiscountAmount(discount);
      setAppliedCoupon("SAVE20 (20% OFF)");
      toast.success("Promo code applied successfully!");
    } else if (code === "FLAT500") {
      const discount = Math.min(500, subtotal);
      setDiscountAmount(discount);
      setAppliedCoupon("FLAT500 (₹500 OFF)");
      toast.success("Promo code applied successfully!");
    } else {
      toast.warn("Invalid Promo Code. Try 'SAVE20' or 'FLAT500'");
    }
  }

  const pointsDiscount = usePoints ? Math.min(userPoints, subtotal - discountAmount) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount - pointsDiscount);

  async function handleCompleteOrder(paymentDetails) {
    try {
      // 1. Decrement inventory stock
      for (const item of cart) {
        const prodRes = await api.get(`/products/${item.id}`);
        const currentProduct = prodRes.data;
        const updatedStock = Math.max(0, (currentProduct.stock || 0) - 1);

        await api.put(`/products/${item.id}`, {
          ...currentProduct,
          stock: updatedStock
        });
      }

      // 2. Calculate earned points (10% of final total)
      const earnedPoints = Math.round(finalTotal * 0.10);
      const updatedUserPoints = userPoints - pointsDiscount + earnedPoints;

      const userRes = await api.get(`/users/${user.id}`);
      await api.put(`/users/${user.id}`, {
        ...userRes.data,
        loyaltyPoints: updatedUserPoints
      });

      localStorage.setItem("user", JSON.stringify({ ...user, loyaltyPoints: updatedUserPoints }));

      // 3. Create Order
      const shippingAddress = addresses.find((addr) => String(addr.id) === String(selectedAddressId));

      const newOrder = {
        userId: user.id,
        userName: user.name,
        shippingAddress: shippingAddress,
        items: cart,
        subtotal: subtotal,
        discount: discountAmount + pointsDiscount,
        promoCode: appliedCoupon || "None",
        loyaltyPointsUsed: pointsDiscount,
        loyaltyPointsEarned: earnedPoints,
        totalAmount: finalTotal,
        paymentMethod: paymentDetails.paymentMethod,
        paymentStatus: paymentDetails.paymentStatus,
        transactionId: paymentDetails.transactionId,
        status: "Order Placed",
        orderDate: new Date().toLocaleDateString()
      };

      await api.post("/orders", newOrder);
      setShowPaymentModal(false);
      dispatch(clearCart());
      toast.success(`Order placed successfully! Earned +${earnedPoints} loyalty points!`);
      navigate("/my-orders");
    } catch (err) {
      console.log(err);
      toast.error("Order processing failed. Please try again.");
    }
  }

  if (cart.length === 0) {
    return (
      <div className="empty-cart-container" style={{ textAlign: "center", padding: "60px" }}>
        <h2>Your Cart is Empty</h2>
        <p>Add items to your cart before starting checkout.</p>
        <Link to="/products" className="submit-btn" style={{ display: "inline-block", marginTop: "16px", textDecoration: "none" }}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-wizard-container">
      <h1 className="page-title">Secure Checkout</h1>

      {/* Stepper Progress Bar Header */}
      <div className="wizard-stepper">
        <div className={`step-item ${step >= 1 ? "active" : ""}`}>
          <span className="step-number">1</span>
          <span className="step-label">Review Cart</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${step >= 2 ? "active" : ""}`}>
          <span className="step-number">2</span>
          <span className="step-label">Shipping Address</span>
        </div>
        <div className="step-line"></div>
        <div className={`step-item ${step >= 3 ? "active" : ""}`}>
          <span className="step-number">3</span>
          <span className="step-label">Payment & Review</span>
        </div>
      </div>

      {/* STEP 1: REVIEW CART & APPLY DISCOUNTS */}
      {step === 1 && (
        <div className="wizard-step-content">
          <h2>Step 1: Review Cart & Apply Rewards</h2>
          <div className="wizard-cart-list">
            {cart.map((item) => (
              <div key={item.id} className="wizard-cart-item">
                <img src={item.image} alt={item.name} />
                <div className="wizard-item-info">
                  <h4>{item.name}</h4>
                  <p>{formatPrice(item.price)}</p>
                </div>
                <button className="remove-item-btn" onClick={() => dispatch(removeFromCart(item.id))}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Promo Code & Loyalty */}
          <div className="wizard-discounts-box">
            <div className="promo-box">
              <h3>Apply Promo Code</h3>
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="promo-form">
                  <input
                    type="text"
                    placeholder="e.g. SAVE20"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                  />
                  <button type="submit">Apply</button>
                </form>
              ) : (
                <div className="applied-badge">
                  <span>Applied: <strong>{appliedCoupon}</strong></span>
                  <button onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); }}>Remove</button>
                </div>
              )}
            </div>

            {userPoints > 0 && (
              <div className="loyalty-box">
                <label>
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                  />
                  <span>Use Loyalty Points (Available: {userPoints} pts = {formatPrice(userPoints)} off)</span>
                </label>
              </div>
            )}
          </div>

          <div className="wizard-nav-buttons">
            <button className="submit-btn" onClick={() => setStep(2)}>
              Proceed to Shipping ➔
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SHIPPING ADDRESS SELECTION */}
      {step === 2 && (
        <div className="wizard-step-content">
          <h2>Step 2: Select Shipping Address</h2>
          {addresses.length === 0 ? (
            <div className="no-address-box">
              <p>No saved addresses found.</p>
              <Link to="/profile" className="submit-btn" style={{ textDecoration: "none", display: "inline-block" }}>
                + Add Address in Profile
              </Link>
            </div>
          ) : (
            <div className="address-select-grid">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`address-card-label ${String(selectedAddressId) === String(addr.id) ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="shippingAddress"
                    value={addr.id}
                    checked={String(selectedAddressId) === String(addr.id)}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  />
                  <div>
                    <strong>[{addr.label}]</strong>
                    <p>{addr.street}, {addr.city} - {addr.zip}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="wizard-nav-buttons">
            <button className="secondary-btn" onClick={() => setStep(1)}>
              ⬅ Back
            </button>
            <button
              className="submit-btn"
              onClick={() => {
                if (!selectedAddressId) {
                  toast.warn("Please select a shipping address.");
                  return;
                }
                setStep(3);
              }}
            >
              Proceed to Payment ➔
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT & FINAL REVIEW */}
      {step === 3 && (
        <div className="wizard-step-content">
          <h2>Step 3: Final Order Summary & Payment</h2>
          
          <div className="final-review-grid">
            <div className="review-section">
              <h3>Order Summary</h3>
              <p>Items Subtotal: <strong>{formatPrice(subtotal)}</strong></p>
              {discountAmount > 0 && <p style={{ color: "#16a34a" }}>Promo Discount: -{formatPrice(discountAmount)}</p>}
              {pointsDiscount > 0 && <p style={{ color: "#9333ea" }}>Loyalty Points: -{formatPrice(pointsDiscount)}</p>}
              <h2 className="final-payable">Total Payable: {formatPrice(finalTotal)}</h2>
              <small style={{ color: "#16a34a" }}>🎁 You will earn +{Math.round(finalTotal * 0.10)} loyalty points!</small>
            </div>

            <div className="review-section">
              <h3>Shipping To</h3>
              {(() => {
                const addr = addresses.find((a) => String(a.id) === String(selectedAddressId));
                return addr ? (
                  <p><strong>{addr.label}:</strong> {addr.street}, {addr.city}, {addr.state} - {addr.zip}</p>
                ) : <p>No address selected</p>;
              })()}
            </div>
          </div>

          <div className="wizard-nav-buttons">
            <button className="secondary-btn" onClick={() => setStep(2)}>
              ⬅ Back
            </button>
            <button className="submit-btn pay-now-btn" onClick={() => setShowPaymentModal(true)}>
              Pay Securely ({formatPrice(finalTotal)})
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          amount={finalTotal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handleCompleteOrder}
        />
      )}
    </div>
  );
}

export default CheckoutWizard;