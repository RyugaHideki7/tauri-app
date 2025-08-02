import React, { useState } from "react";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";

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
        <main className="flex-1 overflow-hidden bg-background">
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
