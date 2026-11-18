import { useDispatch } from "react-redux";
import { addToCart } from "../features/cartSlice";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";

function FrequentlyBoughtTogether({ bundleProducts }) {
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();

  if (!bundleProducts || bundleProducts.length < 3) return null;

  const subtotal = bundleProducts.reduce((sum, item) => sum + Number(item.price), 0);
  const discountAmount = Math.round(subtotal * 0.15); // 15% Bundle Discount
  const finalBundlePrice = subtotal - discountAmount;

  function handleAddBundleToCart() {
    bundleProducts.forEach((product) => {
      dispatch(addToCart(product));
    });
    toast.success(`🎉 Bundle added to cart! You saved ${formatPrice(discountAmount)}!`);
  }

  return (
    <div className="fbt-container">
      <h3>Frequently Bought Together</h3>
      
      <div className="fbt-items-row">
        {bundleProducts.map((product, index) => (
          <div key={product.id} className="fbt-item-card">
            <img src={product.image} alt={product.name} />
            <span className="fbt-name">{product.name}</span>
            <span className="fbt-price">{formatPrice(product.price)}</span>
            {index < bundleProducts.length - 1 && <span className="fbt-plus">+</span>}
          </div>
        ))}
      </div>

      <div className="fbt-action-row">
        <div className="fbt-pricing-info">
          <p>
            Total Price: <span className="strikethrough">{formatPrice(subtotal)}</span>
          </p>
          <h4 className="bundle-total">
            Bundle Price: {formatPrice(finalBundlePrice)}{" "}
            <span className="save-badge">Save 15%</span>
          </h4>
        </div>
        <button className="add-bundle-btn" onClick={handleAddBundleToCart}>
          🛒 Add Bundle to Cart
        </button>
      </div>
    </div>
  );
}

export default FrequentlyBoughtTogether;