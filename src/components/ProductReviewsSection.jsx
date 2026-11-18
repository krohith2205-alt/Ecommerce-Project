import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

function ProductReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // Specific attribute ratings (1 to 5)
  const [quality, setQuality] = useState(5);
  const [value, setValue] = useState(5);
  const [delivery, setDelivery] = useState(5);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  async function fetchReviews() {
    try {
      const res = await api.get("/reviews", { params: { productId } });
      setReviews(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleAddReview(e) {
    e.preventDefault();
    if (!user) {
      toast.warn("Please login to submit a review.");
      return;
    }
    if (!comment.trim()) {
      toast.warn("Please write a comment for your review.");
      return;
    }

    try {
      const newReview = {
        productId,
        userName: user.name,
        rating: Number(rating),
        comment: comment.trim(),
        image: imageUrl.trim() || "",
        attributes: {
          quality: Number(quality),
          value: Number(value),
          delivery: Number(delivery),
        },
        helpfulVotes: 0,
        date: new Date().toLocaleDateString(),
      };

      await api.post("/reviews", newReview);
      setComment("");
      setImageUrl("");
      toast.success("Review submitted successfully!");
      fetchReviews();
    } catch (err) {
      console.log(err);
      toast.error("Failed to submit review.");
    }
  }

  // Handle helpful thumbs-up voting
  async function handleHelpfulVote(reviewId, currentVotes) {
    if (!user) {
      toast.warn("Please login to vote on reviews.");
      return;
    }

    try {
      const updatedVotes = (currentVotes || 0) + 1;
      await api.patch(`/reviews/${reviewId}`, {
        helpfulVotes: updatedVotes,
      });
      toast.success("marked as helpful!");
      fetchReviews();
    } catch (err) {
      console.log(err);
      toast.error("Failed to record vote.");
    }
  }

  // Calculate average attribute ratings across all reviews
  const avgQuality = reviews.length ? (reviews.reduce((sum, r) => sum + (r.attributes?.quality || 5), 0) / reviews.length).toFixed(1) : 5.0;
  const avgValue = reviews.length ? (reviews.reduce((sum, r) => sum + (r.attributes?.value || 5), 0) / reviews.length).toFixed(1) : 5.0;
  const avgDelivery = reviews.length ? (reviews.reduce((sum, r) => sum + (r.attributes?.delivery || 5), 0) / reviews.length).toFixed(1) : 5.0;

  return (
    <div className="reviews-section">
      <h2>Customer Reviews & Social Proof</h2>

      {/* Attribute Breakdown Summary */}
      {reviews.length > 0 && (
        <div className="attributes-summary-box">
          <div className="attribute-metric">
            <span>Product Quality</span>
            <strong>⭐ {avgQuality} / 5</strong>
          </div>
          <div className="attribute-metric">
            <span>Value for Money</span>
            <strong>⭐ {avgValue} / 5</strong>
          </div>
          <div className="attribute-metric">
            <span>Delivery Experience</span>
            <strong>⭐ {avgDelivery} / 5</strong>
          </div>
        </div>
      )}

      {/* Submit Review Form */}
      <form onSubmit={handleAddReview} className="review-form">
        <h3>Write a Review</h3>
        <div className="form-row">
          <label>Overall Rating:</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
            <option value="4">⭐⭐⭐⭐ (4/5)</option>
            <option value="3">⭐⭐⭐ (3/5)</option>
            <option value="2">⭐⭐ (2/5)</option>
            <option value="1">⭐ (1/5)</option>
          </select>
        </div>

        <div className="attribute-selectors-row">
          <div>
            <label>Quality (1-5):</label>
            <input type="number" min="1" max="5" value={quality} onChange={(e) => setQuality(e.target.value)} />
          </div>
          <div>
            <label>Value (1-5):</label>
            <input type="number" min="1" max="5" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div>
            <label>Delivery (1-5):</label>
            <input type="number" min="1" max="5" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
          </div>
        </div>

        <textarea
          placeholder="Share details of your experience with this product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="3"
        />

        <input
          type="text"
          placeholder="Attach Photo Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <button type="submit" className="submit-btn" disabled={!user}>
          {user ? "Submit Review" : "Login to Review"}
        </button>
      </form>

      {/* Reviews Feed */}
      <div className="reviews-feed">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="review-card">
              <div className="review-header">
                <div>
                  <strong>{rev.userName}</strong>
                  <span className="review-date"> ({rev.date})</span>
                </div>
                <div className="review-stars">{"⭐".repeat(rev.rating)}</div>
              </div>

              <p className="review-comment">{rev.comment}</p>

              {/* Attached Review Photo */}
              {rev.image && (
                <div className="review-image-preview">
                  <img src={rev.image} alt="User attachment" />
                </div>
              )}

              {/* Attribute breakdown chips */}
              {rev.attributes && (
                <div className="review-attributes-row">
                  <span>Quality: {rev.attributes.quality}/5</span>
                  <span>Value: {rev.attributes.value}/5</span>
                  <span>Delivery: {rev.attributes.delivery}/5</span>
                </div>
              )}

              {/* Helpful Thumbs Up Voting */}
              <div className="review-footer-row">
                <button
                  type="button"
                  className="helpful-vote-btn"
                  onClick={() => handleHelpfulVote(rev.id, rev.helpfulVotes)}
                >
                  👍 Helpful ({rev.helpfulVotes || 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProductReviewsSection;