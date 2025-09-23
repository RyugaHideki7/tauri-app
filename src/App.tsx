import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from "./components/layout";
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { APP_ROUTES } from './constants/routes';

// Main App Component
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Protected routes layout */}
      <Route 
        element={
          <Layout>
            <Outlet />
          </Layout>
        }
      >
        <Route path="/" element={<Navigate to="/reports" replace />} />

        {/* Dynamically generate protected routes */}
        {APP_ROUTES.map(({ path, element: Element, allowedRoles }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <Element />
              </ProtectedRoute>
            }
          />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
