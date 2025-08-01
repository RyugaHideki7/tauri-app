import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon 
              icon="home" 
              className="w-5 h-5 text-blue-600" 
            />
            <h1 className="text-xl font-semibold text-gray-900">
              Tauri App
            </h1>
          </div>
          <nav className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              <FontAwesomeIcon icon="home" className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              <FontAwesomeIcon icon="user" className="w-4 h-4" />
              <span>About</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              <FontAwesomeIcon icon="cog" className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;