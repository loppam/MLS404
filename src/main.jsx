import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Add Paystack script
const script = document.createElement("script");
script.src = "https://js.paystack.co/v1/inline.js";
script.async = true;
document.head.appendChild(script);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
