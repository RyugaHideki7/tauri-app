import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

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
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v6m8-6v6" />
        </svg>
      ),
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: 'Components',
      path: '/components'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      label: 'Users',
      path: '/users'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Settings',
      path: '/settings'
    }
  ];

  return (
    <div className={`h-full bg-notion-gray-200/50 dark:bg-notion-gray-300/30 border-r border-notion-gray-300/30 dark:border-notion-gray-500/20 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-notion-gray-300/30 dark:border-notion-gray-500/20">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-notion-blue rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <span className="font-semibold text-notion-gray-900 dark:text-notion-gray-900">
                Tauri App
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-notion-gray-300/40 dark:hover:bg-notion-gray-400/30 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-4 h-4 text-notion-gray-600 dark:text-notion-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
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
                  `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-notion-blue/10 text-notion-blue border-r-2 border-notion-blue'
                      : 'text-notion-gray-700 dark:text-notion-gray-700 hover:bg-notion-gray-300/40 dark:hover:bg-notion-gray-400/30'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-notion-gray-300/30 dark:border-notion-gray-500/20">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-6 h-6 bg-notion-purple rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-notion-gray-700 dark:text-notion-gray-700 truncate">
                {username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-notion-gray-300/40 dark:hover:bg-notion-gray-400/30 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4 text-notion-gray-600 dark:text-notion-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 bg-notion-purple rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-notion-gray-300/40 dark:hover:bg-notion-gray-400/30 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4 text-notion-gray-600 dark:text-notion-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;