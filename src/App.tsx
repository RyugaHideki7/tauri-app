import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from "./components/layout";
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import LinesPage from './pages/LinesPage';
import ProductsPage from './pages/ProductsPage';
import UsersPage from './pages/UsersPage';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App Component
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/lines" element={<LinesPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route 
                  path="/settings" 
                  element={
                    <div className="p-8">
                      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                      <p className="text-muted-foreground mt-2">Application settings will be here.</p>
                    </div>
                  } 
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
