import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as buffer from "buffer";

const root = ReactDOM.createRoot(document.getElementById("root"));
window.Buffer = buffer.Buffer;
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
