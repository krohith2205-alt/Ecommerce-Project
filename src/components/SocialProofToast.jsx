import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const mockNames = ["Rahul", "Priya", "Amit", "Sneha", "Karan", "Ananya", "Vikram", "Neha", "Rohith", "Pooja"];
const mockCities = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"];

function SocialProofToast() {
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  const navigate = useNavigate();

  // Fetch products on mount
  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.log(err));
  }, []);

  // Interval loop for social proof popups
  useEffect(() => {
    if (products.length === 0 || dismissed) return;

    const triggerInterval = setInterval(() => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];
      
      // Randomly choose between a purchase alert or live viewing alert
      const isPurchase = Math.random() > 0.4;
      const randomTime = Math.floor(Math.random() * 8) + 1; // 1 to 8 mins ago
      const randomViewers = Math.floor(Math.random() * 15) + 5; // 5 to 20 people

      const alertData = {
        id: randomProduct.id,
        image: randomProduct.image,
        productName: randomProduct.name,
        message: isPurchase
          ? `🔥 ${randomName} from ${randomCity} purchased this ${randomTime} mins ago`
          : `👀 ${randomViewers} people are viewing this item right now`,
      };

      setCurrentAlert(alertData);
      setIsVisible(true);

      // Hide popup automatically after 6 seconds
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 6000);

      return () => clearTimeout(hideTimer);
    }, 25000); // Triggers every 25 seconds

    return () => clearInterval(triggerInterval);
  }, [products, dismissed]);

  if (!isVisible || !currentAlert || dismissed) return null;

  return (
    <div className="social-proof-toast">
      <div
        className="toast-inner-content"
        onClick={() => navigate(`/products/${currentAlert.id}`)}
      >
        <img src={currentAlert.image} alt="product" />
        <div className="toast-text-block">
          <div className="toast-top-row">
            <span>Live Activity</span>
            <button
              className="toast-dismiss-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
                setIsVisible(false);
              }}
              title="Close activity feed"
            >
              ✕
            </button>
          </div>
          <p>{currentAlert.message}</p>
          <h4>{currentAlert.productName}</h4>
        </div>
      </div>
    </div>
  );
}

export default SocialProofToast;