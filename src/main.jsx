import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { CurrencyProvider } from "./context/CurrencyContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <CurrencyProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </CurrencyProvider>
    </BrowserRouter>
  </Provider>
);