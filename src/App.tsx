import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from "./components/layout";
import LoginPage from './pages/LoginPage';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
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
                <Route 
                  path="/" 
                  element={
                    <div className="p-8">
                      <h1 className="text-2xl font-bold text-foreground">Main Content Area</h1>
                      <p className="text-muted-foreground mt-2">Welcome to the application!</p>
                    </div>
                  } 
                />
                {/* Add more protected routes here */}
              </Routes>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
