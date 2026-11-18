
import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";

import { addToCart } from "../features/cartSlice";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";
import api from "../services/api";

import ProductVariantConfigurator from "../components/ProductVariantConfigurator";
import FrequentlyBoughtTogether from "../components/FrequentlyBoughtTogether";
import BargainBotModal from "../components/BargainBotModal";
import WarehouseRadar from "../components/WarehouseRadar";

import { getFrequentlyBoughtTogether } from "../utils/bundleEngine";

function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();

  // =================================
  // PRODUCT STATES
  // =================================

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  const [activeVariant, setActiveVariant] = useState({
    image: "",
    price: 0,
    stock: 0,
    variantSummary: ""
  });

  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =================================
  // REVIEW AND QUESTION STATES
  // =================================

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ""
  });

  const [newQuestion, setNewQuestion] = useState("");
  const [replyInputs, setReplyInputs] = useState({});

  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // =================================
  // BARGAIN BOT STATE
  // =================================

  const [showBargainModal, setShowBargainModal] = useState(false);

  // =================================
  // WAREHOUSE FULFILLMENT STATE
  // =================================

  const [fulfillmentDetails, setFulfillmentDetails] = useState({
    hubId: "",
    hubName: "",
    fulfillmentType: "standard",
    shippingFee: 150,
    eta: "2 Days"
  });

  const handleFulfillmentChange = useCallback((details) => {
    if (!details || typeof details !== "object") return;

    setFulfillmentDetails((previousDetails) => ({
      ...previousDetails,
      ...details
    }));
  }, []);

  // =================================
  // SAFE USER DATA
  // =================================

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  // =================================
  // FETCH PRODUCT, REVIEWS, QUESTIONS
  // AND ALL PRODUCTS
  // =================================

  useEffect(() => {
    let cancelled = false;

    async function fetchProductDetails() {
      setLoading(true);
      setError("");

      setProduct(null);
      setAllProducts([]);
      setReviews([]);
      setQuestions([]);
      setRecentProducts([]);
      setShowBargainModal(false);

      setFulfillmentDetails({
        hubId: "",
        hubName: "",
        fulfillmentType: "standard",
        shippingFee: 150,
        eta: "2 Days"
      });

      try {
        // FETCH CURRENT PRODUCT

        const productResponse = await api.get(`/products/${id}`);

        if (cancelled) return;

        const currentProduct = productResponse.data;

        if (!currentProduct) {
          throw new Error("Product not found");
        }

        setProduct(currentProduct);

        // INITIALIZE DEFAULT VARIANT

        setActiveVariant({
          image: currentProduct.image || "",
          price: Number(currentProduct.price) || 0,
          stock: Number(currentProduct.stock) || 0,
          variantSummary: ""
        });

        // =================================
        // RECENTLY VIEWED PRODUCTS
        // =================================

        let history = [];

        try {
          history =
            JSON.parse(localStorage.getItem("recentlyViewed")) || [];

          if (!Array.isArray(history)) {
            history = [];
          }
        } catch {
          history = [];
        }

        history = history.filter(
          (item) => String(item.id) !== String(currentProduct.id)
        );

        history.unshift({
          id: currentProduct.id,
          name: currentProduct.name,
          image: currentProduct.image,
          price: currentProduct.price,
          brand: currentProduct.brand
        });

        history = history.slice(0, 5);

        try {
          localStorage.setItem(
            "recentlyViewed",
            JSON.stringify(history)
          );
        } catch (storageError) {
          console.error("Recently viewed storage error:", storageError);
        }

        setRecentProducts(
          history.filter(
            (item) => String(item.id) !== String(currentProduct.id)
          )
        );

        // =================================
        // FETCH ALL PRODUCTS, REVIEWS
        // AND CUSTOMER QUESTIONS
        // =================================

        const results = await Promise.allSettled([
          api.get("/products"),

          api.get("/reviews", {
            params: { productId: id }
          }),

          api.get("/questions", {
            params: { productId: id }
          })
        ]);

        if (cancelled) return;

        // ALL PRODUCTS

        if (results[0].status === "fulfilled") {
          const productsData = results[0].value.data;

          setAllProducts(
            Array.isArray(productsData) ? productsData : []
          );
        } else {
          console.error(
            "All products loading error:",
            results[0].reason
          );
        }

        // CUSTOMER REVIEWS

        if (results[1].status === "fulfilled") {
          const reviewsData = results[1].value.data;

          setReviews(
            Array.isArray(reviewsData) ? reviewsData : []
          );
        } else {
          console.error(
            "Reviews loading error:",
            results[1].reason
          );

          toast.error("Failed to load customer reviews.");
        }

        // CUSTOMER QUESTIONS

        if (results[2].status === "fulfilled") {
          const questionsData = results[2].value.data;

          setQuestions(
            Array.isArray(questionsData) ? questionsData : []
          );
        } else {
          console.error(
            "Questions loading error:",
            results[2].reason
          );

          toast.error("Failed to load customer questions.");
        }
      } catch (error) {
        console.error("Product loading error:", error);

        if (!cancelled) {
          setError("Product not found or failed to load.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProductDetails();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // =================================
  // HANDLE PRODUCT VARIANT CHANGE
  // =================================

  const handleVariantChange = useCallback((variantData) => {
    if (!variantData) return;

    setActiveVariant((previousVariant) => ({
      ...previousVariant,
      ...variantData
    }));
  }, []);

  // =================================
  // FREQUENTLY BOUGHT TOGETHER
  // =================================

  const bundleItems = product
    ? getFrequentlyBoughtTogether(product, allProducts)
    : [];

  // =================================
  // DYNAMIC AVERAGE RATING
  // =================================

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : product?.rating != null
        ? Number(product.rating).toFixed(1)
        : null;

  // =================================
  // VARIANT STOCK STATUS
  // =================================

  const currentStock = activeVariant.stock ?? product?.stock ?? 0;

  const isOutOfStock = Number(currentStock) <= 0;

  // =================================
  // CONFIGURED PRODUCT FOR BARGAIN BOT
  // =================================

  const bargainProduct = product
    ? {
        ...product,
        price: Number(activeVariant.price),
        image: activeVariant.image || product.image,
        stock: Number(currentStock),
        variantSummary: activeVariant.variantSummary || "",
        name: activeVariant.variantSummary
          ? `${product.name} (${activeVariant.variantSummary})`
          : product.name
      }
    : null;

  // =================================
  // ADD CONFIGURED PRODUCT WITH
  // WAREHOUSE FULFILLMENT DETAILS
  // =================================

  function handleAddWithFulfillment() {
    if (!product) return;

    if (isOutOfStock) {
      toast.warning(
        "This product configuration is out of stock."
      );
      return;
    }

    const itemWithFulfillment = {
      ...product,

      // Selected variant details
      name: activeVariant.variantSummary
        ? `${product.name} (${activeVariant.variantSummary})`
        : product.name,

      price: Number(activeVariant.price),

      image: activeVariant.image || product.image,

      stock: Number(currentStock),

      variantSummary: activeVariant.variantSummary || "",

      // Warehouse fulfillment details
      fulfillment: {
        ...fulfillmentDetails,
        shippingFee: Math.max(
          0,
          Number(fulfillmentDetails.shippingFee) || 0
        )
      }
    };

    dispatch(addToCart(itemWithFulfillment));

    const fulfillmentLabel =
      fulfillmentDetails.fulfillmentType === "pickup"
        ? "Express Pickup"
        : "Standard Delivery";

    toast.success(
      `${itemWithFulfillment.name} added to cart! Mode: ${fulfillmentLabel}`
    );
  }

  // =================================
  // OPEN BARGAIN BOT
  // =================================

  function handleOpenBargainModal() {
    if (isOutOfStock) {
      toast.warning(
        "This product configuration is out of stock."
      );
      return;
    }

    setShowBargainModal(true);
  }

  // =================================
  // SUBMIT CUSTOMER REVIEW
  // =================================

  async function handleReviewSubmit(e) {
    e.preventDefault();

    if (!user) {
      toast.info("Please login to write a review.");
      return;
    }

    if (!newReview.comment.trim()) {
      toast.warning("Please write your review.");
      return;
    }

    if (submittingReview) return;

    setSubmittingReview(true);

    const reviewPayload = {
      productId: String(id),
      userId: user.id,
      userName: user.name,
      rating: Number(newReview.rating),
      comment: newReview.comment.trim(),
      date: new Date().toISOString()
    };

    try {
      const response = await api.post("/reviews", reviewPayload);

      setReviews((previousReviews) => [
        ...previousReviews,
        response.data
      ]);

      setNewReview({
        rating: 5,
        comment: ""
      });

      toast.success("Review submitted successfully!");
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  // =================================
  // DELETE CUSTOMER REVIEW
  // =================================

  async function handleDeleteReview(reviewId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/reviews/${reviewId}`);

      setReviews((previousReviews) =>
        previousReviews.filter(
          (review) => String(review.id) !== String(reviewId)
        )
      );

      toast.success("Review deleted successfully!");
    } catch (error) {
      console.error("Review deletion error:", error);
      toast.error("Failed to delete review.");
    }
  }

  // =================================
  // ASK CUSTOMER QUESTION
  // =================================

  async function handleAskQuestion(e) {
    e.preventDefault();

    if (!user) {
      toast.warning("Please login to ask a question.");
      return;
    }

    if (!newQuestion.trim()) {
      toast.warning("Please enter your question.");
      return;
    }

    if (submittingQuestion) return;

    setSubmittingQuestion(true);

    const questionPayload = {
      productId: String(id),
      userId: user.id,
      userName: user.name,
      question: newQuestion.trim(),
      answer: "",
      date: new Date().toISOString()
    };

    try {
      const response = await api.post("/questions", questionPayload);

      setQuestions((previousQuestions) => [
        ...previousQuestions,
        response.data
      ]);

      setNewQuestion("");

      toast.success("Question submitted successfully!");
    } catch (error) {
      console.error("Question submission error:", error);
      toast.error("Failed to submit question.");
    } finally {
      setSubmittingQuestion(false);
    }
  }

  // =================================
  // REPLY TO CUSTOMER QUESTION
  // =================================

  async function handlePostAnswer(questionId) {
    if (!user) {
      toast.warning("Please login to reply.");
      return;
    }

    const replyText = replyInputs[questionId];

    if (!replyText || !replyText.trim()) {
      toast.warning("Please enter your reply.");
      return;
    }

    const targetQuestion = questions.find(
      (question) => String(question.id) === String(questionId)
    );

    if (!targetQuestion) {
      toast.error("Question not found.");
      return;
    }

    const updatedAnswer = targetQuestion.answer
      ? `${targetQuestion.answer}\n${user.name}: ${replyText.trim()}`
      : `${user.name}: ${replyText.trim()}`;

    try {
      const response = await api.patch(
        `/questions/${questionId}`,
        {
          answer: updatedAnswer
        }
      );

      setQuestions((previousQuestions) =>
        previousQuestions.map((question) =>
          String(question.id) === String(questionId)
            ? response.data
            : question
        )
      );

      setReplyInputs((previousInputs) => ({
        ...previousInputs,
        [questionId]: ""
      }));

      toast.success("Reply posted!");
    } catch (error) {
      console.error("Reply submission error:", error);
      toast.error("Failed to post reply.");
    }
  }

  // =================================
  // LOADING STATE
  // =================================

  if (loading) {
    return (
      <div className="details-loading">
        <h2>Loading product details...</h2>
      </div>
    );
  }

  // =================================
  // ERROR STATE
  // =================================

  if (error || !product) {
    return (
      <div className="details-error">
        <h2>{error || "Product not found."}</h2>

        <Link to="/products" className="add-btn">
          Back to Products
        </Link>
      </div>
    );
  }

  // =================================
  // PRODUCT DETAILS UI
  // =================================

  return (
    <div className="details-container">

      {/* PRODUCT DETAILS AND VARIANTS */}

      <div className="details">

        <img
          src={activeVariant.image || product.image}
          alt={product.name}
        />

        <div className="details-info">

          <h1>{product.name}</h1>

          <h3>Brand: {product.brand}</h3>

          <p className="details-price">
            {formatPrice(Number(activeVariant.price))}
          </p>

          <p className="details-desc">
            {product.description}
          </p>

          <p>
            Category: <strong>{product.category}</strong>
          </p>

          <p>
            Rating: ⭐ {averageRating || "No ratings yet"}
            {reviews.length > 0 && ` (${reviews.length} reviews)`}
          </p>

          {/* PRODUCT VARIANT CONFIGURATOR */}

          <ProductVariantConfigurator
            product={product}
            onVariantChange={handleVariantChange}
          />

          {/* STOCK AVAILABILITY */}

          <p
            style={{
              color: isOutOfStock ? "#dc2626" : "#16a34a",
              fontWeight: "bold",
              marginTop: "12px"
            }}
          >
            {isOutOfStock
              ? "Out of Stock in this configuration"
              : `In Stock (${currentStock} units available)`}
          </p>

          {/* WAREHOUSE RADAR */}

          {!isOutOfStock && (
            <div className="warehouse-radar-wrapper">
              <h3>Choose Your Fulfillment Option</h3>

              <WarehouseRadar
                product={bargainProduct}
                onFulfillmentChange={handleFulfillmentChange}
              />

              {/* SELECTED FULFILLMENT SUMMARY */}

              <div className="fulfillment-summary">
                <p>
                  <strong>Fulfillment:</strong>{" "}
                  {fulfillmentDetails.fulfillmentType === "pickup"
                    ? "Express Pickup"
                    : "Standard Delivery"}
                </p>

                {fulfillmentDetails.hubName && (
                  <p>
                    <strong>Selected Hub:</strong>{" "}
                    {fulfillmentDetails.hubName}
                  </p>
                )}

                <p>
                  <strong>Shipping Fee:</strong>{" "}
                  {formatPrice(
                    Number(fulfillmentDetails.shippingFee) || 0
                  )}
                </p>

                <p>
                  <strong>Estimated Delivery:</strong>{" "}
                  {fulfillmentDetails.eta || "2 Days"}
                </p>
              </div>
            </div>
          )}

          {/* ADD CONFIGURED ITEM TO CART */}

          <button
            type="button"
            className={`cart-btn ${
              isOutOfStock ? "disabled-btn" : ""
            }`}
            onClick={handleAddWithFulfillment}
            disabled={isOutOfStock}
          >
            {isOutOfStock
              ? "Out of Stock"
              : "Add Configured Item to Cart"}
          </button>

          {/* BARGAIN BOT BUTTON */}

          {!isOutOfStock && (
            <button
              type="button"
              className="make-offer-btn"
              onClick={handleOpenBargainModal}
            >
              🤝 Make an Offer
            </button>
          )}

          <div style={{ marginTop: "15px" }}>
            <Link to="/products">
              ← Continue Shopping
            </Link>
          </div>

        </div>
      </div>

      {/* BARGAIN BOT MODAL */}

      {showBargainModal && bargainProduct && (
        <BargainBotModal
          product={bargainProduct}
          onClose={() => setShowBargainModal(false)}
        />
      )}

      {/* FREQUENTLY BOUGHT TOGETHER */}

      {bundleItems.length > 0 && (
        <FrequentlyBoughtTogether
          bundleProducts={bundleItems}
        />
      )}

      {/* CUSTOMER REVIEWS */}

      <div className="reviews-section">

        <h2>Customer Reviews ⭐</h2>

        <div className="average-rating">
          <h3>{averageRating || "N/A"} / 5</h3>

          <p>
            Based on {reviews.length} customer reviews
          </p>
        </div>

        {/* WRITE REVIEW */}

        {user ? (
          <form
            onSubmit={handleReviewSubmit}
            className="review-form"
          >
            <h3>Write a Review</h3>

            <label htmlFor="review-rating">
              Your Rating
            </label>

            <select
              id="review-rating"
              value={newReview.rating}
              onChange={(e) =>
                setNewReview((previous) => ({
                  ...previous,
                  rating: Number(e.target.value)
                }))
              }
            >
              <option value={5}>5 - Excellent ⭐⭐⭐⭐⭐</option>
              <option value={4}>4 - Very Good ⭐⭐⭐⭐</option>
              <option value={3}>3 - Average ⭐⭐⭐</option>
              <option value={2}>2 - Poor ⭐⭐</option>
              <option value={1}>1 - Terrible ⭐</option>
            </select>

            <label htmlFor="review-comment">
              Your Review
            </label>

            <textarea
              id="review-comment"
              placeholder="Write your review about this product..."
              value={newReview.comment}
              onChange={(e) =>
                setNewReview((previous) => ({
                  ...previous,
                  comment: e.target.value
                }))
              }
              rows="4"
              maxLength={1000}
            />

            <small>
              {newReview.comment.length}/1000 characters
            </small>

            <button
              type="submit"
              className="submit-btn"
              disabled={submittingReview}
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <p className="login-prompt">
            Please <Link to="/login">login</Link> to write a review.
          </p>
        )}

        {/* DISPLAY REVIEWS */}

        <div className="reviews-list">

          <h3>All Customer Reviews</h3>

          {reviews.length === 0 ? (
            <p>
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="review-card">

                <div className="review-header">
                  <strong>{review.userName}</strong>
                  <span>⭐ {review.rating} / 5</span>
                </div>

                <p className="review-comment">
                  {review.comment}
                </p>

                <div className="review-footer">

                  <small>
                    {review.date
                      ? new Date(review.date).toLocaleDateString()
                      : "Date unavailable"}
                  </small>

                  {user &&
                    (
                      String(user.id) === String(review.userId) ||
                      user.role === "admin"
                    ) && (
                      <button
                        type="button"
                        className="delete-review-btn"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        Delete
                      </button>
                    )}

                </div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* CUSTOMER QUESTIONS AND ANSWERS */}

      <div className="qa-section">

        <h2>Customer Questions & Answers</h2>

        {/* ASK QUESTION */}

        <form
          onSubmit={handleAskQuestion}
          className="qa-form"
        >
          <input
            type="text"
            placeholder={
              user
                ? "Have a question? Ask owners or buyers..."
                : "Please login to ask a question"
            }
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            disabled={!user || submittingQuestion}
            maxLength={500}
          />

          <button
            type="submit"
            className="submit-btn"
            disabled={!user || submittingQuestion}
          >
            {submittingQuestion ? "Submitting..." : "Ask Question"}
          </button>
        </form>

        {!user && (
          <p className="login-prompt">
            Please <Link to="/login">login</Link> to ask a question or reply.
          </p>
        )}

        {/* QUESTIONS LIST */}

        <div className="qa-list">

          {questions.length === 0 ? (
            <p className="no-qa">
              No questions yet. Be the first to ask about this product!
            </p>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="qa-card">

                <div className="qa-question-row">
                  <strong>Q: {question.question}</strong>

                  <span className="qa-author">
                    By {question.userName} (
                    {question.date
                      ? new Date(question.date).toLocaleDateString()
                      : "Date unavailable"}
                    )
                  </span>
                </div>

                {/* ANSWERS */}

                <div className="qa-answer-row">
                  {question.answer ? (
                    <p style={{ whiteSpace: "pre-line" }}>
                      <strong>A:</strong> {question.answer}
                    </p>
                  ) : (
                    <p className="no-answer">
                      No answers yet for this question.
                    </p>
                  )}
                </div>

                {/* REPLY INPUT */}

                {user && (
                  <div className="qa-reply-box">

                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyInputs[question.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((previous) => ({
                          ...previous,
                          [question.id]: e.target.value
                        }))
                      }
                    />

                    <button
                      type="button"
                      onClick={() => handlePostAnswer(question.id)}
                      className="reply-btn"
                    >
                      Reply
                    </button>

                  </div>
                )}

              </div>
            ))
          )}

        </div>
      </div>

      {/* RECENTLY VIEWED PRODUCTS */}

      {recentProducts.length > 0 && (
        <div className="recently-viewed-section">

          <h2>Recently Viewed Products</h2>

          <div className="recent-grid">

            {recentProducts.map((item) => (
              <Link
                to={`/products/${item.id}`}
                key={item.id}
                className="recent-card"
              >
                <img
                  src={item.image}
                  alt={item.name}
                />

                <div className="recent-info">
                  <h4>{item.name}</h4>
                  <p>{item.brand}</p>
                  <p>{formatPrice(item.price)}</p>
                </div>
              </Link>
            ))}

          </div>
        </div>
      )}

    </div>
  );
}

export default ProductDetails;
