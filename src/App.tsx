import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LinesPage from "./pages/LinesPage";
import ProductsPage from "./pages/ProductsPage";
import ProfilePage from "./pages/ProfilePage";
import UsersPage from "./pages/UsersPage";
import ColorTestPage from "./pages/ColorTestPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import TitleBar from "./components/TitleBar";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from 'react-hot-toast';
import "./lib/fontawesome"; // Initialize FontAwesome
import "./App.css";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <Router>
        <div className="h-screen flex flex-col bg-background font-sans">
          {/* TitleBar is now always visible across all routes */}
          <TitleBar />
          
          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes with Layout (Sidebar + Content) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="lines" element={<LinesPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="color-test" element={<ColorTestPage />} />
                <Route
                  path="settings"
                  element={
                    <div className="p-8">
                      <h1 className="text-3xl font-bold text-foreground">
                        Settings
                      </h1>
                      <p className="text-muted-foreground mt-2">
                        Settings page coming soon...
                      </p>
                    </div>
                  }
                />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
