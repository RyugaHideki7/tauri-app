import React, { useState } from "react";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import { Toaster } from "react-hot-toast";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Title bar wraps everything */}
      <TitleBar />
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden border-t border-border/50">
        {/* Sidebar */}
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-background relative">
          {/* Toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'bg-background text-foreground border border-border shadow-lg',
              duration: 3000,
              success: {
                className: '!bg-green-50 !text-green-700 !border-green-200',
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                className: '!bg-red-50 !text-red-700 !border-red-200',
              },
            }}
          />
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto py-6 px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
