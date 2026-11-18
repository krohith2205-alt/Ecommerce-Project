import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-ecommerce-project-h1qb.onrender.com"
});

export default api;