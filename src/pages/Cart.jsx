
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  removeFromCart,
  clearCart,
  increaseQuantity,
  decreaseQuantity,
  setCartFromSharedRoom,
} from "../features/cartSlice";

import SharedCartManager from "../components/SharedCartManager";
import PaymentModal from "../components/PaymentModal";

import api from "../services/api";
import { useCurrency } from "../context/CurrencyContext";

// =====================================
// SAFE USER DATA
// =====================================

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

// =====================================
// SAFE BARGAIN COUPON DATA
// =====================================

function getActiveBargainCoupon() {
  try {
    const savedBargain = JSON.parse(
      sessionStorage.getItem("activeBargainCoupon")
    );

    if (
      !savedBargain ||
      !savedBargain.code ||
      !Number.isFinite(Number(savedBargain.discountAmount)) ||
      !Number.isFinite(Number(savedBargain.expiresAt)) ||
      Number(savedBargain.discountAmount) <= 0 ||
      Number(savedBargain.expiresAt) <= Date.now()
    ) {
      sessionStorage.removeItem("activeBargainCoupon");
      return null;
    }

    return {
      code: String(savedBargain.code),
      discountAmount: Number(savedBargain.discountAmount),
      expiresAt: Number(savedBargain.expiresAt)
    };

  } catch {
    sessionStorage.removeItem("activeBargainCoupon");
    return null;
  }
}

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // =====================================
  // REDUX CART
  // =====================================

  const cart = useSelector((state) =>
    Array.isArray(state.cart) ? state.cart : []
  );

  const { formatPrice } = useCurrency();

  const [user, setUser] = useState(getStoredUser);

  // =====================================
  // SHARED CART
  // =====================================

  function handleSyncSharedCart(newCart) {
    if (!Array.isArray(newCart)) {
      toast.error("Invalid shared cart data.");
      return;
    }

    dispatch(setCartFromSharedRoom(newCart));
  }

  // =====================================
  // ADDRESS
  // =====================================

  const [addresses, setAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  // =====================================
  // LOYALTY POINTS
  // =====================================

  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  // =====================================
  // COUPON STATES
  // =====================================

  const [couponInput, setCouponInput] = useState("");

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [negotiatedDiscount, setNegotiatedDiscount] =
    useState(0);

  const [isNegotiatedCoupon, setIsNegotiatedCoupon] =
    useState(false);

  // =====================================
  // PAYMENT STATES
  // =====================================

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [placingOrder, setPlacingOrder] = useState(false);

  const [checkingStock, setCheckingStock] = useState(false);

  // =====================================
  // 1. AUTOMATICALLY APPLY BARGAIN COUPON
  // =====================================

  useEffect(() => {
    const savedBargain = getActiveBargainCoupon();

    if (!savedBargain) return;

    setNegotiatedDiscount(savedBargain.discountAmount);

    setAppliedCoupon(
      `${savedBargain.code} (Negotiated Deal)`
    );

    setIsNegotiatedCoupon(true);

    toast.success(
      `Negotiated coupon ${savedBargain.code} automatically applied!`
    );

  }, []);

  // =====================================
  // 2. LOAD USER DATA
  // =====================================

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadUserData() {
      try {
        const response = await api.get(`/users/${user.id}`);

        if (cancelled) return;

        const userData = response.data;

        const userAddresses = Array.isArray(
          userData.addresses
        )
          ? userData.addresses
          : [];

        setAddresses(userAddresses);

        setUserPoints(
          Number(userData.loyaltyPoints) || 0
        );

        if (userAddresses.length > 0) {
          setSelectedAddressId(
            String(userAddresses[0].id)
          );
        }

      } catch (error) {
        console.error("User Data Error:", error);

        toast.error("Failed to load profile details.");
      }
    }

    loadUserData();

    return () => {
      cancelled = true;
    };

  }, [user?.id]);

  // =====================================
  // 3. CART CALCULATIONS
  // =====================================

  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;

    const quantity = Number(item.quantity) || 1;

    return sum + price * quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 1);
  }, 0);

  // =====================================
  // 4. COUPON DISCOUNT
  // =====================================

  const discountAmount = (() => {
    if (isNegotiatedCoupon) {
      return Math.min(
        negotiatedDiscount,
        subtotal
      );
    }

    if (appliedCoupon === "SAVE20") {
      return Math.round(subtotal * 0.2);
    }

    if (appliedCoupon === "FLAT500") {
      return Math.min(500, subtotal);
    }

    return 0;
  })();

  // =====================================
  // 5. LOYALTY POINTS
  // =====================================

  const pointsDiscount = usePoints
    ? Math.min(
        userPoints,
        Math.max(0, subtotal - discountAmount)
      )
    : 0;

  const totalDiscount =
    discountAmount + pointsDiscount;

  const finalTotal = Math.max(
    0,
    subtotal - totalDiscount
  );

  const earnedPoints = Math.round(finalTotal * 0.1);

  // =====================================
  // 6. APPLY COUPON
  // =====================================

  function handleApplyCoupon(event) {
    event.preventDefault();

    const code = couponInput.trim().toUpperCase();

    if (cart.length === 0 || subtotal <= 0) {
      toast.warning("Your cart is empty.");
      return;
    }

    if (appliedCoupon) {
      toast.info("A promo code is already applied.");
      return;
    }

    if (code === "SAVE20") {
      setAppliedCoupon("SAVE20");

      setCouponInput("");

      toast.success("20% discount applied!");

    } else if (code === "FLAT500") {

      if (subtotal < 500) {
        toast.warning(
          "FLAT500 requires a minimum purchase of ₹500."
        );

        return;
      }

      setAppliedCoupon("FLAT500");

      setCouponInput("");

      toast.success("₹500 discount applied!");

    } else {
      toast.error("Invalid coupon code.");
    }
  }

  // =====================================
  // 7. REMOVE COUPON
  // =====================================

  function handleRemoveCoupon() {
    setAppliedCoupon(null);

    setCouponInput("");

    setNegotiatedDiscount(0);

    setIsNegotiatedCoupon(false);

    // Remove negotiated coupon from session storage

    try {
      sessionStorage.removeItem("activeBargainCoupon");
    } catch (error) {
      console.error(
        "Bargain coupon removal error:",
        error
      );
    }

    toast.info("Promo code removed.");
  }

  // =====================================
  // 8. VALIDATE PRODUCT STOCK
  // =====================================

  async function validateStock() {
    for (const item of cart) {
      const productId = item.productId ?? item.id;

      if (productId == null) {
        throw new Error("Product ID is missing.");
      }

      const response = await api.get(
        `/products/${productId}`
      );

      const product = response.data;

      const requestedQuantity =
        Number(item.quantity) || 1;

      const availableStock =
        Number(product.stock) || 0;

      if (availableStock < requestedQuantity) {
        toast.error(
          `${item.name}: Only ${availableStock} item(s) available.`
        );

        return false;
      }
    }

    return true;
  }

  // =====================================
  // 9. OPEN CHECKOUT
  // =====================================

  async function handleOpenCheckout() {
    if (!user?.id) {
      toast.info("Please login to place an order.");

      navigate("/login");

      return;
    }

    if (cart.length === 0) {
      toast.warning("Your cart is empty.");

      return;
    }

    if (addresses.length === 0) {
      toast.warning("Please add a shipping address.");

      navigate("/profile");

      return;
    }

    const selectedAddress = addresses.find(
      (address) =>
        String(address.id) ===
        String(selectedAddressId)
    );

    if (!selectedAddress) {
      toast.warning("Please select a shipping address.");

      return;
    }

    if (subtotal <= 0) {
      toast.warning("Your cart total is invalid.");

      return;
    }

    // CHECK NEGOTIATED COUPON EXPIRATION

    if (isNegotiatedCoupon) {
      const savedBargain = getActiveBargainCoupon();

      if (!savedBargain) {
        setAppliedCoupon(null);

        setNegotiatedDiscount(0);

        setIsNegotiatedCoupon(false);

        toast.warning(
          "Your negotiated coupon has expired. Please negotiate again."
        );

        return;
      }
    }

    try {
      setCheckingStock(true);

      const stockAvailable = await validateStock();

      if (!stockAvailable) return;

      setShowPaymentModal(true);

    } catch (error) {
      console.error("Stock Validation Error:", error);

      toast.error(
        error.message || "Unable to verify product stock."
      );

    } finally {
      setCheckingStock(false);
    }
  }

  // =====================================
  // 10. COMPLETE ORDER
  // =====================================

  async function handleCompleteOrder(paymentDetails) {
    if (placingOrder) return;

    setPlacingOrder(true);

    const updatedProducts = [];

    let originalUserPoints = null;

    let userPointsUpdated = false;

    let orderCreated = false;

    try {
      // =================================
      // VERIFY NEGOTIATED COUPON
      // =================================

      if (isNegotiatedCoupon) {
        const savedBargain = getActiveBargainCoupon();

        if (!savedBargain) {
          throw new Error(
            "Your negotiated coupon has expired. Please negotiate again."
          );
        }

        if (
          `${savedBargain.code} (Negotiated Deal)` !==
          appliedCoupon
        ) {
          throw new Error(
            "Negotiated coupon validation failed."
          );
        }
      }

      // =================================
      // GET SHIPPING ADDRESS
      // =================================

      const shippingAddress = addresses.find(
        (address) =>
          String(address.id) ===
          String(selectedAddressId)
      );

      if (!shippingAddress) {
        throw new Error("Shipping address not found.");
      }

      if (cart.length === 0) {
        throw new Error("Your cart is empty.");
      }

      // =================================
      // GET LATEST USER POINTS
      // =================================

      const userResponse = await api.get(
        `/users/${user.id}`
      );

      originalUserPoints =
        Number(userResponse.data.loyaltyPoints) || 0;

      const pointsToRedeem = usePoints
        ? Math.min(
            originalUserPoints,
            Math.max(0, subtotal - discountAmount)
          )
        : 0;

      if (
        usePoints &&
        pointsToRedeem !== pointsDiscount
      ) {
        throw new Error(
          "Your loyalty points balance has changed. Please refresh your cart and try again."
        );
      }

      // =================================
      // FINAL PAYMENT CALCULATION
      // =================================

      const payableAmount = Math.max(
        0,
        subtotal - discountAmount - pointsToRedeem
      );

      const pointsToEarn = Math.round(
        payableAmount * 0.1
      );

      // =================================
      // STEP 1: CHECK STOCK AGAIN
      // =================================

      const productUpdates = [];

      for (const item of cart) {
        const productId = item.productId ?? item.id;

        const response = await api.get(
          `/products/${productId}`
        );

        const product = response.data;

        const quantity =
          Number(item.quantity) || 1;

        const availableStock =
          Number(product.stock) || 0;

        if (availableStock < quantity) {
          throw new Error(
            `${item.name}: Insufficient stock. Available: ${availableStock}.`
          );
        }

        productUpdates.push({
          product,
          quantity,
          previousStock: availableStock,
          updatedStock: availableStock - quantity
        });
      }

      // =================================
      // STEP 2: UPDATE INVENTORY
      // =================================

      for (const update of productUpdates) {
        await api.patch(
          `/products/${update.product.id}`,
          {
            stock: update.updatedStock
          }
        );

        updatedProducts.push(update);
      }

      // =================================
      // STEP 3: UPDATE LOYALTY POINTS
      // =================================

      const newUserPoints =
        originalUserPoints -
        pointsToRedeem +
        pointsToEarn;

      await api.patch(`/users/${user.id}`, {
        loyaltyPoints: newUserPoints
      });

      userPointsUpdated = true;

      // =================================
      // STEP 4: CREATE ORDER
      // =================================

      const newOrder = {
        userId: user.id,

        userName: user.name,

        shippingAddress,

        items: cart.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 1
        })),

        subtotal,

        discount: discountAmount + pointsToRedeem,

        promoCode: appliedCoupon || "None",

        negotiatedCoupon: isNegotiatedCoupon
          ? {
              code: getActiveBargainCoupon()?.code || "",
              discountAmount,
              expiresAt: getActiveBargainCoupon()?.expiresAt || null
            }
          : null,

        loyaltyPointsUsed: pointsToRedeem,

        loyaltyPointsEarned: pointsToEarn,

        totalAmount: payableAmount,

        paymentMethod:
          paymentDetails?.paymentMethod || "Unknown",

        paymentStatus:
          paymentDetails?.paymentStatus || "Paid",

        transactionId:
          paymentDetails?.transactionId || "",

        status: "Order Placed",

        orderDate: new Date().toISOString()
      };

      await api.post("/orders", newOrder);

      orderCreated = true;

      // =================================
      // STEP 5: UPDATE USER SESSION
      // =================================

      const updatedUser = {
        ...user,
        loyaltyPoints: newUserPoints
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);

      setUserPoints(newUserPoints);

      // =================================
      // STEP 6: CLEAR CART
      // =================================

      dispatch(clearCart());

      setAppliedCoupon(null);

      setCouponInput("");

      setNegotiatedDiscount(0);

      setIsNegotiatedCoupon(false);

      setUsePoints(false);

      // REMOVE NEGOTIATED COUPON AFTER ORDER

      try {
        sessionStorage.removeItem("activeBargainCoupon");
      } catch (storageError) {
        console.error(
          "Bargain coupon cleanup error:",
          storageError
        );
      }

      setShowPaymentModal(false);

      toast.success(
        `Order placed successfully! You earned ${pointsToEarn} loyalty points.`
      );

      navigate("/my-orders");

    } catch (error) {
      console.error("Order Placement Error:", error);

      // =================================
      // ROLLBACK ONLY IF ORDER WAS NOT CREATED
      // =================================

      if (!orderCreated) {

        // RESTORE LOYALTY POINTS

        if (
          userPointsUpdated &&
          originalUserPoints !== null
        ) {
          try {
            await api.patch(`/users/${user.id}`, {
              loyaltyPoints: originalUserPoints
            });

          } catch (rollbackError) {
            console.error(
              "Loyalty Points Rollback Error:",
              rollbackError
            );
          }
        }

        // RESTORE INVENTORY

        for (const update of [...updatedProducts].reverse()) {
          try {
            await api.patch(
              `/products/${update.product.id}`,
              {
                stock: update.previousStock
              }
            );

          } catch (rollbackError) {
            console.error(
              "Inventory Rollback Error:",
              rollbackError
            );
          }
        }
      }

      toast.error(
        error.message ||
          "Order placement failed. Please contact support if payment was deducted."
      );

    } finally {
      setPlacingOrder(false);
    }
  }

  // =====================================
  // 11. CLEAR CART
  // =====================================

  function handleClearCart() {
    if (placingOrder) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear your cart?"
    );

    if (!confirmed) return;

    dispatch(clearCart());

    setAppliedCoupon(null);

    setCouponInput("");

    setNegotiatedDiscount(0);

    setIsNegotiatedCoupon(false);

    setUsePoints(false);

    // REMOVE SAVED BARGAIN COUPON

    try {
      sessionStorage.removeItem("activeBargainCoupon");
    } catch (error) {
      console.error(
        "Bargain coupon cleanup error:",
        error
      );
    }

    toast.info("Cart cleared successfully.");
  }

  // =====================================
  // 12. LOGIN CHECK
  // =====================================

  if (!user) {
    return (
      <div className="cart-container">
        <h2>Please login to view your cart.</h2>

        <Link to="/login">
          Login Now
        </Link>
      </div>
    );
  }

  // =====================================
  // 13. CART UI
  // =====================================

  return (
    <div className="cart-container">

      <h1 className="page-title">
        Shopping Cart 🛒
      </h1>

      {/* SHARED CART COLLABORATION */}

      <div className="shared-cart-section">

        <SharedCartManager
          cart={cart}
          setCart={handleSyncSharedCart}
        />

      </div>

      {cart.length === 0 ? (

        <div className="empty-cart">

          <h2>Your Cart is Empty!</h2>

          <p>
            Add some products from our products page.
          </p>

          <Link
            to="/products"
            className="add-btn"
          >
            Continue Shopping
          </Link>

        </div>

      ) : (

        <>

          {/* CART PRODUCTS */}

          <div className="cart-grid">

            {cart.map((product) => {

              const quantity =
                Number(product.quantity) || 1;

              const stock =
                Number(product.stock) || 0;

              const price =
                Number(product.price) || 0;

              return (

                <div
                  key={product.id}
                  className="cart-card"
                >

                  <img
                    src={
                      product.image ||
                      "/placeholder.png"
                    }
                    alt={product.name}
                  />

                  <div className="cart-content">

                    <h2>{product.name}</h2>

                    <p>
                      Brand: {product.brand || "N/A"}
                    </p>

                    <p>
                      Price: {formatPrice(price)}
                    </p>

                    <p>
                      Available Stock: {stock}
                    </p>

                    {/* QUANTITY */}

                    <div className="quantity-controls">

                      <button
                        type="button"
                        disabled={
                          quantity <= 1 || placingOrder
                        }
                        onClick={() =>
                          dispatch(
                            decreaseQuantity(product.id)
                          )
                        }
                      >
                        -
                      </button>

                      <span>{quantity}</span>

                      <button
                        type="button"
                        disabled={
                          quantity >= stock ||
                          placingOrder
                        }
                        onClick={() =>
                          dispatch(
                            increaseQuantity(product.id)
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                    <p>
                      <strong>
                        Item Total:{" "}
                        {formatPrice(price * quantity)}
                      </strong>
                    </p>

                    {/* REMOVE PRODUCT */}

                    <button
                      type="button"
                      disabled={placingOrder}
                      onClick={() =>
                        dispatch(
                          removeFromCart(product.id)
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

          {/* ================================= */}
          {/* CHECKOUT SECTION */}
          {/* ================================= */}

          <div className="checkout-box">

            <div className="shipping-selector">

              {/* ADDRESS */}

              <h3>
                📍 Select Shipping Address
              </h3>

              {addresses.length === 0 ? (

                <p>
                  No saved addresses.{" "}

                  <Link to="/profile">
                    + Add Address
                  </Link>
                </p>

              ) : (

                <select
                  value={selectedAddressId}
                  onChange={(event) =>
                    setSelectedAddressId(
                      event.target.value
                    )
                  }
                  disabled={placingOrder}
                >

                  {addresses.map((address) => (

                    <option
                      key={address.id}
                      value={address.id}
                    >
                      {address.label || "Address"} -{" "}
                      {address.street}, {address.city} -{" "}
                      {address.zip}
                    </option>

                  ))}

                </select>

              )}

              {/* ================================= */}
              {/* LOYALTY POINTS */}
              {/* ================================= */}

              {userPoints > 0 && (

                <div className="loyalty-redemption-box">

                  <label>

                    <input
                      type="checkbox"
                      checked={usePoints}
                      disabled={placingOrder}
                      onChange={(event) =>
                        setUsePoints(
                          event.target.checked
                        )
                      }
                    />

                    Use Loyalty Points (

                    <strong>
                      {userPoints} points
                    </strong>

                    {" "} = {formatPrice(userPoints)} off)

                  </label>

                </div>

              )}

              {/* ================================= */}
              {/* COUPON SECTION */}
              {/* ================================= */}

              <div className="promo-section">

                <h3>
                  🎁 Apply Promo Code
                </h3>

                {!appliedCoupon ? (

                  <form
                    onSubmit={handleApplyCoupon}
                    className="promo-form"
                  >

                    <input
                      type="text"
                      placeholder="Enter SAVE20 or FLAT500"
                      value={couponInput}
                      disabled={placingOrder}
                      onChange={(event) =>
                        setCouponInput(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="submit"
                      className="promo-apply-btn"
                      disabled={placingOrder}
                    >
                      Apply
                    </button>

                  </form>

                ) : (

                  <div className="applied-promo-badge">

                    <span>
                      Applied:{" "}

                      <strong>
                        {appliedCoupon}
                      </strong>
                    </span>

                    <button
                      type="button"
                      className="remove-promo-btn"
                      disabled={placingOrder}
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>

                  </div>

                )}

                <small>
                  SAVE20 (20% OFF) | FLAT500 (₹500 OFF)
                </small>

                {/* NEGOTIATED DEAL INFORMATION */}

                {isNegotiatedCoupon && (

                  <p className="negotiated-coupon-info">

                    🤝 BargainBot negotiated deal applied!

                    <br />

                    You saved{" "}
                    <strong>
                      {formatPrice(discountAmount)}
                    </strong>

                  </p>

                )}

              </div>

            </div>

            {/* ================================= */}
            {/* ORDER SUMMARY */}
            {/* ================================= */}

            <div className="cart-summary">

              <h3>Order Summary</h3>

              <p>
                Total Items: {totalItems}
              </p>

              <p>
                Subtotal: {formatPrice(subtotal)}
              </p>

              {/* PROMO DISCOUNT */}

              {discountAmount > 0 && (

                <p style={{ color: "green" }}>

                  {isNegotiatedCoupon
                    ? "Negotiated Discount: -"
                    : "Promo Discount: -"}

                  {formatPrice(discountAmount)}

                </p>

              )}

              {/* LOYALTY DISCOUNT */}

              {pointsDiscount > 0 && (

                <p style={{ color: "purple" }}>

                  Loyalty Discount: -
                  {formatPrice(pointsDiscount)}

                </p>

              )}

              <p>
                Total Discount:{" "}
                {formatPrice(totalDiscount)}
              </p>

              <h2>
                Final Total: {formatPrice(finalTotal)}
              </h2>

              <small style={{ color: "green" }}>

                🎁 You will earn approximately{" "}
                {earnedPoints} loyalty points.

              </small>

              {/* ================================= */}
              {/* PAYMENT */}
              {/* ================================= */}

              <button
                type="button"
                className="submit-btn"
                onClick={handleOpenCheckout}
                disabled={
                  placingOrder ||
                  checkingStock ||
                  cart.length === 0
                }
              >

                {checkingStock
                  ? "Checking Stock..."
                  : "Proceed to Payment"}

              </button>

              {/* CLEAR CART */}

              <button
                type="button"
                className="delete-btn"
                onClick={handleClearCart}
                disabled={placingOrder}
              >
                Clear Cart
              </button>

            </div>

          </div>

        </>

      )}

      {/* ================================= */}
      {/* PAYMENT MODAL */}
      {/* ================================= */}

      {showPaymentModal && (

        <PaymentModal

          amount={finalTotal}

          onClose={() => {
            if (!placingOrder) {
              setShowPaymentModal(false);
            }
          }}

          onPaymentSuccess={handleCompleteOrder}

        />

      )}

    </div>
  );
}

export default Cart;
