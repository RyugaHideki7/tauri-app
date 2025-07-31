import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ComponentsPage from "./pages/ComponentsPage";
import LinesPage from "./pages/LinesPage";
import ProductsPage from "./pages/ProductsPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import TitleBar from "./components/TitleBar";
import { AuthProvider } from "./contexts/AuthContext";
import "./App.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="h-screen flex flex-col bg-notion-gray-100 dark:bg-notion-gray-100 font-notion">
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
                <Route path="components" element={<ComponentsPage />} />
                <Route path="lines" element={<LinesPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route
                  path="users"
                  element={
                    <div className="p-8">
                      <h1 className="text-3xl font-bold text-notion-gray-900 dark:text-notion-gray-900">
                        Users
                      </h1>
                      <p className="text-notion-gray-600 dark:text-notion-gray-600 mt-2">
                        User management coming soon...
                      </p>
                    </div>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <div className="p-8">
                      <h1 className="text-3xl font-bold text-notion-gray-900 dark:text-notion-gray-900">
                        Settings
                      </h1>
                      <p className="text-notion-gray-600 dark:text-notion-gray-600 mt-2">
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
  );
};

export default App;
