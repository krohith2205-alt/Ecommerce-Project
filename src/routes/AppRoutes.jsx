import { Routes, Route } from "react-router-dom";
// Public Pages
import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Register from "../pages/Register";
import Login from "../pages/Login";
// Admin Pages
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";
// Customer Pages
import Cart from "../pages/Cart";
import MyOrders from "../pages/MyOrders";
// Authentication
import Logout from "../pages/Logout";
import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "../pages/Profile";
import Wishlist from "../pages/Wishlist";
import AdminOrders from "../pages/AdminOrders";
import AdminAnalytics from "../pages/AdminAnalytics.jsx";

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* ADMIN ONLY ROUTES */}
      <Route
        path="/add-product"
        element={
          <AdminRoute>
            <AddProduct />
          </AdminRoute>
        }
      />

      <Route
        path="/edit-product/:id"
        element={
          <AdminRoute>
            <EditProduct />
          </AdminRoute>
        }
      />

      {/* CUSTOMER ONLY ROUTES */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Cart />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-orders"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <MyOrders />
          </ProtectedRoute>
        }
      />

      {/* AUTHENTICATED ROUTES */}
      <Route
        path="/logout"
        element={
          <ProtectedRoute>
            <Logout />
          </ProtectedRoute>
        }
      />
      <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>

<Route path="/wishlist" element={<Wishlist />} />
<Route
  path="/admin/orders"
  element={
    <AdminRoute>
      <AdminOrders />
    </AdminRoute>
  }
/>
<Route
  path="/admin/analytics"
  element={
    <AdminRoute>
      <AdminAnalytics />
    </AdminRoute>
  }
/>
    </Routes>
  );
}

export default AppRoutes;
