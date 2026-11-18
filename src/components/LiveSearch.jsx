import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import api from "../services/api";

function LiveSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Fetch all products on mount for instant client-side filtering
  useEffect(() => {
    api.get("/products")
      .then((res) => setAllProducts(res.data))
      .catch((err) => console.log(err));

    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle typing with lightweight filtering
  function handleInputChange(e) {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length > 0) {
      const filtered = allProducts.filter((product) =>
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        product.brand?.toLowerCase().includes(value.toLowerCase()) ||
        product.category?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to top 5 instant suggestions

      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }

  function handleSelectProduct(id) {
    setIsOpen(false);
    setQuery("");
    navigate(`/products/${id}`);
  }

  return (
    <div className="live-search-container" ref={searchRef}>
      <div className="live-search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search ShopSphere..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
        />
        {query && (
          <button className="clear-search-btn" onClick={() => { setQuery(""); setIsOpen(false); }}>
            ✕
          </button>
        )}
      </div>

      {/* AUTOCOMPLETE DROPDOWN */}
      {isOpen && suggestions.length > 0 && (
        <div className="live-search-dropdown">
          {suggestions.map((product) => (
            <div
              key={product.id}
              className="suggestion-item"
              onClick={() => handleSelectProduct(product.id)}
            >
              <img src={product.image} alt={product.name} />
              <div className="suggestion-info">
                <h4>{product.name}</h4>
                <p>
                  <span>{product.category}</span> • <strong>{formatPrice(product.price)}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.trim().length > 0 && suggestions.length === 0 && (
        <div className="live-search-dropdown">
          <div className="no-suggestion">No products found for "{query}"</div>
        </div>
      )}
    </div>
  );
}

export default LiveSearch;