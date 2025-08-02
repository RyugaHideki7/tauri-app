import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider, AuthProvider } from "./contexts";
import { ThemeProvider } from "./components/layout/ThemeProvider";
import "./utils/fontawesome";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
