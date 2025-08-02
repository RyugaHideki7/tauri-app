import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from "./components/layout";
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import LinesPage from './pages/LinesPage';
import ProductsPage from './pages/ProductsPage';
import UsersPage from './pages/UsersPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ROLES } from './types/auth';
import UnauthorizedPage from './pages/UnauthorizedPage';


// Main App Component
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute allowedRoles={Object.values(ROLES)}>
          <Layout>
            <Outlet />
          </Layout>
        </ProtectedRoute>
      }>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard - Accessible to all authenticated users */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={[
              ROLES.ADMIN, 
              ROLES.SITE01, 
              ROLES.SITE02, 
              ROLES.PERFORMANCE, 
              ROLES.CONSOMMATEUR
            ]}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Profile - Accessible to all authenticated users */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={Object.values(ROLES)}>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Lines - Accessible to site staff and above */}
        <Route 
          path="/lines" 
          element={
            <ProtectedRoute allowedRoles={[
              ROLES.ADMIN, 
              ROLES.SITE01, 
              ROLES.SITE02, 
              ROLES.PERFORMANCE
            ]}>
              <LinesPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Products - Accessible to site staff and above */}
        <Route 
          path="/products" 
          element={
            <ProtectedRoute allowedRoles={[
              ROLES.ADMIN, 
              ROLES.SITE01, 
              ROLES.SITE02, 
              ROLES.PERFORMANCE
            ]}>
              <ProductsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Users - Admin only */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Settings - Admin and Performance team */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PERFORMANCE]}>
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">Application settings will be here.</p>
              </div>
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
