import { useCurrency } from "../context/CurrencyContext";

function ProductComparisonModal({ comparedProducts, onClose, onRemove }) {
  const { formatPrice } = useCurrency();

  if (comparedProducts.length === 0) return null;

  return (
    <div className="comparison-modal-overlay">
      <div className="comparison-modal-card">
        <div className="comparison-header">
          <h2>Product Comparison ({comparedProducts.length}/3)</h2>
          <button className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                {comparedProducts.map((product) => (
                  <th key={product.id} className="compare-col-header">
                    <button
                      className="remove-compare-btn"
                      onClick={() => onRemove(product.id)}
                      title="Remove from comparison"
                    >
                      ✕
                    </button>
                    <img src={product.image} alt={product.name} />
                    <h4>{product.name}</h4>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Price</strong></td>
                {comparedProducts.map((product) => (
                  <td key={product.id} className="compare-price">
                    {formatPrice(product.price)}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Brand</strong></td>
                {comparedProducts.map((product) => (
                  <td key={product.id}>{product.brand}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Category</strong></td>
                {comparedProducts.map((product) => (
                  <td key={product.id}>{product.category}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Rating</strong></td>
                {comparedProducts.map((product) => (
                  <td key={product.id}>⭐ {product.rating}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Stock Status</strong></td>
                {comparedProducts.map((product) => {
                  const isOut = product.stock <= 0;
                  return (
                    <td key={product.id} style={{ color: isOut ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
                      {isOut ? "Out of Stock" : `${product.stock} available`}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><strong>Description</strong></td>
                {comparedProducts.map((product) => (
                  <td key={product.id} className="compare-desc">
                    {product.description}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductComparisonModal;