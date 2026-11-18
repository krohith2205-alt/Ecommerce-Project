import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function FlashSaleBanner() {
  // Set target flash sale end time (e.g., 6 hours from now or a fixed future timestamp)
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 45,
    seconds: 30,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          clearInterval(timer);
          setIsExpired(true);
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isExpired) {
    return (
      <div className="flash-sale-banner expired">
        <span>⚡ Flash Sale has ended! Stay tuned for our next daily drops.</span>
      </div>
    );
  }

  return (
    <div className="flash-sale-banner">
      <div className="flash-sale-content">
        <span className="flash-badge">⚡ FLASH SALE</span>
        <p>Get an extra <strong>25% OFF</strong> on all Electronics & Accessories today!</p>
        
        {/* Ticking Timer */}
        <div className="countdown-timer">
          <span>{String(timeLeft.hours).padStart(2, "0")}</span>:
          <span>{String(timeLeft.minutes).padStart(2, "0")}</span>:
          <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
        </div>

        <Link to="/products" className="flash-shop-now-btn">
          Shop Deals
        </Link>
      </div>
    </div>
  );
}

export default FlashSaleBanner;