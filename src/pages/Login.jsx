import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await api.get("/users", {
        params: {
          email: email.trim().toLowerCase(),
          password
        }
      });

      if (response.data.length > 0) {
        localStorage.setItem("user", JSON.stringify(response.data[0]));
        toast.success(`Welcome back, ${response.data[0].name}!`);
        navigate("/");
        window.location.reload();
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (error) {
      toast.error("Login failed. Check your connection.");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login to ShopSphere</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="submit-btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;