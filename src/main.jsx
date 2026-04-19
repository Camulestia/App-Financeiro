import React from "react";
import ReactDOM from "react-dom/client";
import AppShell from "./AppShellV2.jsx";
import { FinanceProvider } from "./context/FinanceContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <FinanceProvider>
        <AppShell />
      </FinanceProvider>
    </ThemeProvider>
  </React.StrictMode>
);
