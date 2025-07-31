import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const menuItems = [
    {
      icon: 'user',
      label: 'Profile',
      path: '/profile'
    },
    {
      icon: 'home',
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      icon: 'industry',
      label: 'Lines',
      path: '/lines'
    },
    {
      icon: 'box',
      label: 'Products',
      path: '/products'
    },
    {
      icon: 'users',
      label: 'Users',
      path: '/users'
    },
    {
      icon: 'palette',
      label: 'Color Test',
      path: '/color-test'
    },
    {
      icon: 'cog',
      label: 'Settings',
      path: '/settings'
    }
  ];

  return (
    <div className={`h-full bg-card border-r border-border flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">T</span>
              </div>
              <span className="font-semibold text-foreground">
                Tauri App
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FontAwesomeIcon 
              icon="bars" 
              className="w-4 h-4 text-muted-foreground" 
            />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <FontAwesomeIcon 
                  icon={item.icon as any} 
                  className="w-4 h-4 flex-shrink-0" 
                />
                {!isCollapsed && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent-foreground text-xs font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-muted-foreground truncate font-medium">
                {username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Logout"
            >
              <FontAwesomeIcon 
                icon="sign-out-alt" 
                className="w-4 h-4 text-muted-foreground" 
              />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
              <span className="text-accent-foreground text-xs font-bold">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Logout"
            >
              <FontAwesomeIcon 
                icon="sign-out-alt" 
                className="w-4 h-4 text-muted-foreground" 
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;