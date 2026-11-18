import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../features/cartSlice";
import { evaluateBargainOffer } from "../utils/bargainEngine";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";
import api from "../services/api";

function BargainBotModal({ product, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const { formatPrice } = useCurrency();
  const user = JSON.parse(localStorage.getItem("user"));

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hi ${user?.name || "there"}! 👋 Looking at the ${product.name} (${formatPrice(
        product.price
      )})? Make me a fair offer and let's see what discount I can unlock for you!`
    }
  ]);
  const [offerInput, setOfferInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attemptCount, setAttemptCount] = useState(1);
  const [pendingCounter, setPendingCounter] = useState(null);
  const [generatedCoupon, setGeneratedCoupon] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(180); // 3-minute expiry

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Real-time 3-minute countdown once coupon is minted
  useEffect(() => {
    if (!generatedCoupon) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGeneratedCoupon(null);
          toast.warn("⏳ Your negotiated coupon expired!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [generatedCoupon]);

  async function mintDynamicCoupon(discountAmount, finalPrice) {
    const randomCode = `DEAL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = Date.now() + 180 * 1000;

    try {
      const payload = {
        code: randomCode,
        userId: user.id,
        productId: product.id,
        discountAmount,
        finalPrice,
        expiresAt,
        used: false
      };

      await api.post("/dynamicCoupons", payload);
      setGeneratedCoupon(payload);
      setSecondsLeft(180);
      setPendingCounter(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate coupon code.");
    }
  }

  function handleSendOffer(e) {
    e.preventDefault();
    if (!user) {
      toast.warn("Please login to negotiate prices.");
      return;
    }
    if (!offerInput.trim() || isTyping) return;

    const numericOffer = Number(offerInput.replace(/[^0-9.]/g, ""));
    setMessages((prev) => [...prev, { sender: "user", text: `I offer ${formatPrice(numericOffer)}` }]);
    setOfferInput("");
    setIsTyping(true);

    // Simulate real-time AI evaluation delay
    setTimeout(async () => {
      const result = evaluateBargainOffer({
        product,
        offeredPrice: numericOffer,
        userLoyaltyPoints: user.loyaltyPoints || 0,
        cartCount: cart.length,
        attemptNumber: attemptCount
      });

      setIsTyping(false);
      setAttemptCount((prev) => prev + 1);
      setMessages((prev) => [...prev, { sender: "bot", text: result.reply }]);

      if (result.status === "accepted") {
        await mintDynamicCoupon(result.discountAmount, result.finalPrice);
      } else if (result.status === "counter") {
        setPendingCounter({
          price: result.counterPrice,
          discountAmount: result.discountAmount
        });
      }
    }, 900);
  }

  async function handleAcceptCounterOffer() {
    if (!pendingCounter) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: `Deal! I'll take ${formatPrice(pendingCounter.price)}.` },
      { sender: "bot", text: "Awesome! Locking in your custom promo code now..." }
    ]);
    await mintDynamicCoupon(pendingCounter.discountAmount, pendingCounter.price);
  }

  function handleClaimAndCheckout() {
    if (!generatedCoupon) return;
    dispatch(addToCart(product));
    // Store active negotiated code in sessionStorage for instant auto-apply in Cart
    sessionStorage.setItem("activeBargainCoupon", JSON.stringify(generatedCoupon));
    toast.success(`Added to cart with code ${generatedCoupon.code}!`);
    onClose();
    navigate("/cart");
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bargain-modal-overlay" onClick={onClose}>
      <div className="bargain-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="bargain-header">
          <div>
            <h3>🤝 ShopSphere AI Price Negotiator</h3>
            <small>Target Item: {product.name} ({formatPrice(product.price)})</small>
          </div>
          <button className="close-bargain-btn" onClick={onClose}>✕</button>
        </div>

        <div className="bargain-chat-feed">
          {messages.map((msg, i) => (
            <div key={i} className={`bargain-msg ${msg.sender === "user" ? "user-msg" : "bot-msg"}`}>
              <p>{msg.text}</p>
            </div>
          ))}

          {isTyping && (
            <div className="bargain-msg bot-msg typing-indicator">
              <span>AI Negotiator is checking warehouse margins...</span>
            </div>
          )}

          {/* Counter-Offer Quick Accept Pill */}
          {pendingCounter && !generatedCoupon && !isTyping && (
            <div className="counter-action-card">
              <span>Counter-Offer: <strong>{formatPrice(pendingCounter.price)}</strong></span>
              <button type="button" onClick={handleAcceptCounterOffer}>
                Accept Counter-Offer
              </button>
            </div>
          )}

          {/* Generated 3-Minute Flash Coupon Card */}
          {generatedCoupon && (
            <div className="minted-coupon-card">
              <div className="coupon-top-row">
                <span className="coupon-code-pill">{generatedCoupon.code}</span>
                <span className="coupon-countdown">⏳ Expires in {formatTimer(secondsLeft)}</span>
              </div>
              <p>
                Unlocked Price: <strong>{formatPrice(generatedCoupon.finalPrice)}</strong> (Save{" "}
                {formatPrice(generatedCoupon.discountAmount)})
              </p>
              <button type="button" className="claim-deal-btn" onClick={handleClaimAndCheckout}>
                🛒 Add to Cart & Apply Code
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {!generatedCoupon && (
          <form onSubmit={handleSendOffer} className="bargain-input-row">
            <input
              type="number"
              placeholder={`Enter your price offer (e.g. ${Math.round(product.price * 0.88)})`}
              value={offerInput}
              onChange={(e) => setOfferInput(e.target.value)}
            />
            <button type="submit" disabled={isTyping}>Offer</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BargainBotModal;