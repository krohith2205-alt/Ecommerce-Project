import { useEffect, useState } from "react";
import api from "../services/api";

function FlashClaimBar({ product }) {
  const [claimed, setClaimed] = useState(product.flashClaimedUnits || 15);
  const total = product.flashTotalStock || 20;

  useEffect(() => {
    // Simulate real-time global user purchases on flash sale items
    const claimInterval = setInterval(() => {
      if (claimed < total && Math.random() > 0.6) {
        setClaimed((prev) => {
          const next = prev + 1;
          // Optionally sync with backend
          api.patch(`/products/${product.id}`, { flashClaimedUnits: next }).catch(() => {});
          return next;
        });
      }
    }, 8000); // Check/update every 8 seconds

    return () => clearInterval(claimInterval);
  }, [claimed, total, product.id]);

  const percentage = Math.min(100, Math.round((claimed / total) * 100));
  const remaining = Math.max(0, total - claimed);

  return (
    <div className="flash-claim-container">
      <div className="flash-claim-header">
        <span className="flash-fire-icon">🔥</span>
        <span className="flash-claim-text">
          <strong>{claimed} of {total} units claimed</strong> ({remaining} left!)
        </span>
      </div>

      <div className="flash-progress-track">
        <div
          className="flash-progress-fill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="flash-timer-row">
        <span className="limited-badge">⚡ Lightning Deal</span>
        <span className="urgency-text">
          {remaining <= 3 ? "Selling out fast!" : "Limited time offer"}
        </span>
      </div>
    </div>
  );
}

export default FlashClaimBar;