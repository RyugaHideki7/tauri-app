import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../../contexts/AuthContext";
import { NAVIGATION_ITEMS, NAVIGATION_ICONS } from "../../constants/navigation";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const username = user?.username || "User";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = NAVIGATION_ITEMS;

  return (
    <div
      className={`h-full bg-card border-r border-border flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground text-sm font-bold">
                  I
                </span>
              </div>
              <span className="font-semibold text-foreground text-lg">
                Ifri
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm mx-auto">
              <span className="text-primary-foreground text-sm font-bold">
                I
              </span>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Collapse sidebar"
            >
              <FontAwesomeIcon
                icon={NAVIGATION_ICONS.COLLAPSE}
                className="w-4 h-4 text-muted-foreground"
              />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={onToggle}
            className="w-full mt-3 p-2 rounded-lg hover:bg-muted transition-colors"
            title="Expand sidebar"
          >
            <FontAwesomeIcon
              icon={NAVIGATION_ICONS.EXPAND}
              className="w-4 h-4 text-muted-foreground mx-auto"
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 bg-card">
        <ul className="space-y-2 text-foreground">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-muted text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${isCollapsed ? "justify-center" : ""}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                </span>
                {!isCollapsed && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-2 border-t border-border">
        {!isCollapsed ? (
          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-primary-foreground text-sm font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-sm text-foreground truncate font-medium block">
                  {username}
                </span>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Logout"
            >
              <FontAwesomeIcon
                icon={NAVIGATION_ICONS.LOGOUT}
                className="w-4 h-4"
              />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-lg font-bold">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Logout"
            >
              <FontAwesomeIcon
                icon={NAVIGATION_ICONS.LOGOUT}
                className="w-4 h-4"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
