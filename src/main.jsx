import React from "react";
import ReactDOM from "react-dom/client";
import AppShell from "./AppShellMonth.jsx";
import { FinanceProvider } from "./context/FinanceContext.jsx";
import { MonthProvider } from "./context/MonthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <MonthProvider>
        <FinanceProvider>
          <AppShell />
        </FinanceProvider>
      </MonthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
