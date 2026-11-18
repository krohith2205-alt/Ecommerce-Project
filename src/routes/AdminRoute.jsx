import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  // Check if user is logged in and has the admin role
  if (!user || user.role !== "admin") {
    alert("Access Denied: Admins Only!");
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;