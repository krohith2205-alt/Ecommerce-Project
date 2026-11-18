
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { exportSalesToCSV } from "../utils/exportReport";
import { useCurrency } from "../context/CurrencyContext";
import api from "../services/api";

function AdminAnalytics() {
  // =================================
  // STATES
  // =================================

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { formatPrice } = useCurrency();

  // =================================
  // SAFE NUMBER CONVERSION
  // =================================

  function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
  }

  // =================================
  // FETCH DASHBOARD DATA
  // =================================

  async function fetchDashboardData() {
    if (loading || refreshing) return;

    setRefreshing(true);
    setError("");

    try {
      const [
        ordersResponse,
        usersResponse,
        productsResponse
      ] = await Promise.all([
        api.get("/orders"),
        api.get("/users"),
        api.get("/products")
      ]);

      // VALIDATE API RESPONSES

      if (
        !Array.isArray(ordersResponse.data) ||
        !Array.isArray(usersResponse.data) ||
        !Array.isArray(productsResponse.data)
      ) {
        throw new Error("Invalid dashboard API response.");
      }

      setOrders(ordersResponse.data);
      setUsers(usersResponse.data);
      setProducts(productsResponse.data);

      toast.success("Analytics refreshed successfully!");

    } catch (error) {
      console.error("Analytics API Error:", error);
      console.error("API Response:", error.response?.data);

      setError("Failed to refresh analytics data.");

      toast.error("Failed to load analytics data.");

    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  // =================================
  // INITIAL DATA FETCH
  // =================================

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [
          ordersResponse,
          usersResponse,
          productsResponse
        ] = await Promise.all([
          api.get("/orders"),
          api.get("/users"),
          api.get("/products")
        ]);

        if (cancelled) return;

        if (
          !Array.isArray(ordersResponse.data) ||
          !Array.isArray(usersResponse.data) ||
          !Array.isArray(productsResponse.data)
        ) {
          throw new Error("Invalid dashboard API response.");
        }

        setOrders(ordersResponse.data);
        setUsers(usersResponse.data);
        setProducts(productsResponse.data);

      } catch (error) {
        console.error("Analytics loading error:", error);

        if (!cancelled) {
          setError("Failed to load analytics data.");
          toast.error("Failed to load analytics data.");
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  // =================================
  // EXPORT SALES REPORT
  // =================================

  function handleExport() {
    if (orders.length === 0) {
      toast.warning("No order data available to export.");
      return;
    }

    try {
      exportSalesToCSV(orders);

      toast.success(
        "Sales report CSV downloaded successfully!"
      );

    } catch (error) {
      console.error("CSV export error:", error);

      toast.error("Failed to export sales report.");
    }
  }

  // =================================
  // KPI CALCULATIONS
  // =================================

  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum + toNumber(order.totalAmount),
    0
  );

  const totalOrders = orders.length;

  const customerCount = users.filter(
    (user) => user.role !== "admin"
  ).length;

  const totalStockUnits = products.reduce(
    (sum, product) =>
      sum + toNumber(product.stock),
    0
  );

  const averageOrderValue =
    totalOrders > 0
      ? totalRevenue / totalOrders
      : 0;

  // =================================
  // BEST-SELLING PRODUCTS
  // =================================

  const productSalesMap = {};

  orders.forEach((order) => {
    const items = Array.isArray(order.items)
      ? order.items
      : [];

    items.forEach((item) => {
      const productKey =
        item.id ??
        item.productId ??
        item.name;

      if (productKey == null) return;

      const quantityValue = toNumber(item.quantity);

      const quantity =
        quantityValue > 0
          ? quantityValue
          : 1;

      const price = toNumber(
        item.price ?? item.unitPrice
      );

      const key = String(productKey);

      if (!productSalesMap[key]) {
        productSalesMap[key] = {
          id: key,
          name: item.name || "Unknown Product",
          brand: item.brand || "",
          unitsSold: 0,
          revenue: 0
        };
      }

      productSalesMap[key].unitsSold += quantity;

      productSalesMap[key].revenue +=
        price * quantity;
    });
  });

  const bestSellingProducts = Object.values(
    productSalesMap
  )
    .sort(
      (a, b) => b.unitsSold - a.unitsSold
    )
    .slice(0, 5);

  const maxUnitsSold =
    bestSellingProducts.length > 0
      ? bestSellingProducts[0].unitsSold
      : 1;

  // =================================
  // LOW STOCK PRODUCTS
  // =================================

  const lowStockProducts = products.filter(
    (product) =>
      toNumber(product.stock) <= 3
  );

  const outOfStockCount = products.filter(
    (product) =>
      toNumber(product.stock) <= 0
  ).length;

  // =================================
  // LOADING STATE
  // =================================

  if (loading) {
    return (
      <div className="analytics-loading">
        <h2>Loading Analytics...</h2>
      </div>
    );
  }

  // =================================
  // ERROR STATE
  // =================================

  if (error && orders.length === 0 &&
      users.length === 0 &&
      products.length === 0) {
    return (
      <div className="analytics-error">
        <h2>{error}</h2>

        <button
          type="button"
          className="refresh-btn"
          onClick={() => {
            setLoading(true);
            fetchDashboardData();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // =================================
  // DASHBOARD UI
  // =================================

  return (
    <div className="analytics-container">

      {/* HEADER */}

      <div className="analytics-header">

        <div>
          <h1>Sales & Inventory Analytics</h1>

          <p>
            Monitor your ShopSphere business performance.
          </p>
        </div>

        <div className="analytics-header-actions">

          {/* EXPORT CSV */}

          <button
            type="button"
            className="export-csv-btn"
            onClick={handleExport}
          >
            📥 Export Sales Report (.csv)
          </button>

          {/* REFRESH */}

          <button
            type="button"
            className="refresh-btn"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Data"}
          </button>

        </div>

      </div>

      {/* REFRESH ERROR */}

      {error && (
        <p className="analytics-error-message">
          {error} Showing previously loaded data.
        </p>
      )}

      {/* ================================= */}
      {/* KPI SUMMARY CARDS */}
      {/* ================================= */}

      <div className="kpi-grid">

        {/* TOTAL REVENUE */}

        <div className="kpi-card revenue-card">

          <span className="kpi-label">
            Total Revenue
          </span>

          <h2 className="kpi-value">
            {formatPrice(totalRevenue)}
          </h2>

          <small>
            Across {totalOrders} recorded orders
          </small>

        </div>

        {/* TOTAL ORDERS */}

        <div className="kpi-card orders-card">

          <span className="kpi-label">
            Total Orders
          </span>

          <h2 className="kpi-value">
            {totalOrders}
          </h2>

          <small>
            Average Order Value:{" "}
            {formatPrice(averageOrderValue)}
          </small>

        </div>

        {/* CUSTOMERS */}

        <div className="kpi-card users-card">

          <span className="kpi-label">
            Registered Customers
          </span>

          <h2 className="kpi-value">
            {customerCount}
          </h2>

          <small>
            {users.length} total accounts
          </small>

        </div>

        {/* INVENTORY */}

        <div className="kpi-card stock-card">

          <span className="kpi-label">
            Inventory in Stock
          </span>

          <h2 className="kpi-value">
            {totalStockUnits}
          </h2>

          <small>
            Units across {products.length} products
          </small>

        </div>

      </div>

      {/* ================================= */}
      {/* ANALYTICS CONTENT */}
      {/* ================================= */}

      <div className="analytics-split-grid">

        {/* BEST-SELLING PRODUCTS */}

        <div className="analytics-panel">

          <h2>
            🏆 Top Best-Selling Products
          </h2>

          {bestSellingProducts.length === 0 ? (

            <p className="empty-text">
              No sales data available yet.
            </p>

          ) : (

            <div className="bar-chart-list">

              {bestSellingProducts.map((item) => {

                const widthPercent = Math.round(
                  (item.unitsSold / maxUnitsSold) * 100
                );

                return (
                  <div
                    className="bar-item"
                    key={item.id}
                  >

                    <div className="bar-label-row">

                      <span>
                        <strong>{item.name}</strong>

                        {item.brand &&
                          ` (${item.brand})`}
                      </span>

                      <span>
                        {item.unitsSold} sold ·{" "}
                        {formatPrice(item.revenue)}
                      </span>

                    </div>

                    <div className="bar-track">

                      <div
                        className="bar-fill"
                        style={{
                          width: `${widthPercent}%`
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

        {/* LOW STOCK ALERTS */}

        <div className="analytics-panel">

          <h2>
            ⚠️ Low & Out-of-Stock Alerts
          </h2>

          {lowStockProducts.length === 0 ? (

            <p className="empty-text">
              All products are well-stocked!
            </p>

          ) : (

            <div className="analytics-table-wrapper">

              <table className="analytics-table">

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock Left</th>
                  </tr>
                </thead>

                <tbody>

                  {lowStockProducts.map((product) => {

                    const stock = toNumber(
                      product.stock
                    );

                    return (
                      <tr key={product.id}>

                        <td>{product.name}</td>

                        <td>
                          {product.category || "N/A"}
                        </td>

                        <td>

                          <span
                            className={`stock-pill ${
                              stock <= 0
                                ? "pill-danger"
                                : "pill-warning"
                            }`}
                          >
                            {stock <= 0
                              ? "Out of Stock"
                              : `${stock} left`}
                          </span>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

          {/* STOCK SUMMARY */}

          <div className="stock-summary">

            <p>
              Total low-stock products:{" "}
              <strong>
                {lowStockProducts.length}
              </strong>
            </p>

            <p>
              Out-of-stock products:{" "}
              <strong>
                {outOfStockCount}
              </strong>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminAnalytics;
