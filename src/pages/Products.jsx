import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useCurrency } from "../context/CurrencyContext";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import ProductComparisonModal from "../components/ProductComparisonModal";

function Products() {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState([]);

  // Filter & Sort States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [priceCeiling, setPriceCeiling] = useState(50000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // Comparison States
  const [comparedProducts, setComparedProducts] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user && user.role === "admin";

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    try {
      const response = await api.get("/products");
      const data = response.data;
      setProducts(data);

      // Dynamically set the slider ceiling based on the most expensive product
      if (data.length > 0) {
        const highestPrice = Math.max(...data.map((p) => Number(p.price || 0)));
        const roundedCeiling = Math.ceil(highestPrice / 1000) * 1000 || 50000;
        setPriceCeiling(roundedCeiling);
        setMaxPrice(roundedCeiling);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function deleteProduct(id) {
    await api.delete(`/products/${id}`);
    setProducts(products.filter((product) => product.id !== id));
    toast.info("Product deleted.");
  }

  // Extract unique brands dynamically from catalog
  const availableBrands = [...new Set(products.map((p) => p.brand).filter(Boolean))];

  // Toggle Brand Checkbox
  function handleBrandToggle(brand) {
    setCurrentPage(1);
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  }

  // Reset All Filters
  function handleResetFilters() {
    setSearch("");
    setCategory("All");
    setSelectedBrands([]);
    setMaxPrice(priceCeiling);
    setInStockOnly(false);
    setSort("");
    setCurrentPage(1);
  }

  // Toggle Compare Logic
  function handleToggleCompare(product) {
    const exists = comparedProducts.some((p) => p.id === product.id);
    if (exists) {
      setComparedProducts(comparedProducts.filter((p) => p.id !== product.id));
    } else {
      if (comparedProducts.length >= 3) {
        toast.warn("You can compare up to 3 products at a time.");
        return;
      }
      setComparedProducts([...comparedProducts, product]);
      toast.success("Added to comparison list");
    }
  }

  // Combined Filter Logic
  const filteredProducts = products.filter((product) => {
    const searchMatch = product.name.toLowerCase().includes(search.toLowerCase());
    const categoryMatch = category === "All" || product.category === category;
    const brandMatch =
      selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const priceMatch = Number(product.price) <= maxPrice;
    const stockMatch = !inStockOnly || Number(product.stock) > 0;

    return searchMatch && categoryMatch && brandMatch && priceMatch && stockMatch;
  });

  // Expanded Sorting Logic
  let finalProducts = [...filteredProducts];
  if (sort === "rating-high") finalProducts.sort((a, b) => b.rating - a.rating);
  if (sort === "rating-low") finalProducts.sort((a, b) => a.rating - b.rating);
  if (sort === "price-low") finalProducts.sort((a, b) => a.price - b.price);
  if (sort === "price-high") finalProducts.sort((a, b) => b.price - a.price);

  // Pagination Calculations
  const totalPages = Math.ceil(finalProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = finalProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  return (
    <div
      className="products-page-container"
      style={{ paddingBottom: comparedProducts.length > 0 ? "90px" : "20px" }}
    >
      <div className="catalog-top-header">
        <h1>Featured Products ({finalProducts.length})</h1>

        <div className="top-bar-controls">
          <input
            type="text"
            className="catalog-search-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

          <select
            className="catalog-sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Sort By: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating-high">Rating: High to Low</option>
            <option value="rating-low">Rating: Low to High</option>
          </select>

          {isAdmin && (
            <Link to="/add-product" className="add-btn">
              + Add Product
            </Link>
          )}
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: SIDEBAR + PRODUCT GRID */}
      <div className="catalog-layout">
        {/* LEFT FILTER SIDEBAR */}
        <aside className="filter-sidebar">
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="reset-filters-btn" onClick={handleResetFilters}>
              Reset All
            </button>
          </div>

          {/* 1. Category Filter */}
          <div className="filter-group">
            <h4>Category</h4>
            {["All", "Electronics", "Footwear", "Fashion", "Accessories"].map((cat) => (
              <label key={cat} className="filter-radio-label">
                <input
                  type="radio"
                  name="category"
                  checked={category === cat}
                  onChange={() => {
                    setCategory(cat);
                    setCurrentPage(1);
                  }}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>

          {/* 2. Dynamic Price Range Slider */}
          <div className="filter-group">
            <div className="price-slider-header">
              <h4>Max Price</h4>
              <span className="price-badge">{formatPrice(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={priceCeiling}
              step="500"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="price-range-slider"
            />
            <div className="price-slider-bounds">
              <span>{formatPrice(0)}</span>
              <span>{formatPrice(priceCeiling)}</span>
            </div>
          </div>

          {/* 3. Multi-Select Brand Checkboxes */}
          {availableBrands.length > 0 && (
            <div className="filter-group">
              <h4>Brands</h4>
              <div className="brand-checkbox-list">
                {availableBrands.map((brand) => (
                  <label key={brand} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 4. Availability Filter */}
          <div className="filter-group">
            <h4>Availability</h4>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* RIGHT PRODUCT CATALOG CONTENT */}
        <main className="catalog-main">
          <div className="products">
            {currentProducts.length === 0 ? (
              <div className="no-results-box">
                <h3>No products match your filters</h3>
                <p>Try adjusting your price range or clearing selected brands.</p>
                <button className="submit-btn" onClick={handleResetFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={deleteProduct}
                  onToggleCompare={handleToggleCompare}
                  isCompared={comparedProducts.some((p) => p.id === product.id)}
                />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  className={currentPage === index + 1 ? "active-page" : ""}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {/* FLOATING COMPARISON BAR */}
      {comparedProducts.length > 0 && (
        <div className="floating-compare-bar">
          <div className="compare-items-preview">
            <span>Comparing ({comparedProducts.length}/3):</span>
            {comparedProducts.map((p) => (
              <span key={p.id} className="compare-pill">
                {p.name.substring(0, 16)}...
              </span>
            ))}
          </div>
          <div className="compare-actions">
            <button className="compare-now-btn" onClick={() => setShowCompareModal(true)}>
              Compare Now
            </button>
            <button className="clear-compare-btn" onClick={() => setComparedProducts([])}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {showCompareModal && (
        <ProductComparisonModal
          comparedProducts={comparedProducts}
          onClose={() => setShowCompareModal(false)}
          onRemove={(id) =>
            setComparedProducts(comparedProducts.filter((p) => p.id !== id))
          }
        />
      )}
    </div>
  );
}

export default Products;