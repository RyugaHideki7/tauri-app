import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./contexts";
import { ThemeProvider } from "./components/layout/ThemeProvider";
import "./utils/fontawesome";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
