import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TitleBar from "../components/layout/TitleBar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Stable navigate function to prevent infinite re-renders
  const navigateToDashboard = useCallback(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigateToDashboard();
    }
  }, [isAuthenticated, navigateToDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple validation
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Title bar */}
      <TitleBar />

      {/* Login content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
        <div className="w-full max-w-md animate-fadeInUp">
          <div className="bg-card/80 backdrop-blur-sm shadow-xl p-8 sm:p-10 rounded-2xl border border-border/30 transition-all duration-300 hover:shadow-2xl">
            {/* Logo/Title */}
            <div className="text-center mb-10 animate-fadeIn">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3 transform transition-transform duration-300 hover:scale-105">
                Welcome Back
              </h1>
              <p className="text-muted-foreground/90 transition-colors duration-300">
                Sign in to your account
              </p>
            </div>

            {/* Login Form */}
            <form 
              onSubmit={handleLogin} 
              className="space-y-6 animate-fadeIn"
            >
              <div className="space-y-4">
                <Input
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="py-3 px-4 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="py-3 px-4 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {error && (
                <div 
                  className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-fadeInDown"
                >
                  <p className="text-sm text-destructive flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 019 5a3 3 0 013 3v1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              <div className="pt-2 transition-transform duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 text-base font-medium transition-all duration-300 hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
