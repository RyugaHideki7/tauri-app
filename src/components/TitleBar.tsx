import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const TitleBar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check system preference or localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored) return JSON.parse(stored);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Apply dark mode on mount
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleMinimize = async () => {
    const window = getCurrentWindow();
    await window.minimize();
  };

  const handleMaximize = async () => {
    const window = getCurrentWindow();
    await window.toggleMaximize();
  };

  const handleClose = async () => {
    const window = getCurrentWindow();
    await window.close();
  };

  return (
    <div 
      className="flex items-center justify-between h-10 bg-notion-gray-100 dark:bg-notion-gray-200 border-b border-notion-gray-300 dark:border-notion-gray-400 px-4 select-none"
      data-tauri-drag-region
    >
      {/* Left side - App name */}
      <div className="flex items-center">
        <span className="text-sm font-medium text-notion-gray-800 dark:text-notion-gray-700">
          Tauri App
        </span>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md hover:bg-notion-gray-200 dark:hover:bg-notion-gray-300 transition-colors"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <svg className="w-4 h-4 text-notion-gray-700 dark:text-notion-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-notion-gray-700 dark:text-notion-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
        
        <div className="w-px h-4 bg-notion-gray-300 dark:bg-notion-gray-400 mx-1"></div>
        
        <button 
          onClick={handleMinimize}
          className="p-2 rounded-md hover:bg-notion-gray-200 dark:hover:bg-notion-gray-300 transition-colors"
          title="Minimize"
        >
          <svg className="w-4 h-4 text-notion-gray-700 dark:text-notion-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>
        
        <button 
          onClick={handleMaximize}
          className="p-2 rounded-md hover:bg-notion-gray-200 dark:hover:bg-notion-gray-300 transition-colors"
          title="Maximize"
        >
          <svg className="w-4 h-4 text-notion-gray-700 dark:text-notion-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4z" />
          </svg>
        </button>
        
        <button 
          onClick={handleClose}
          className="p-2 rounded-md hover:bg-notion-red dark:hover:bg-notion-red hover:text-white dark:hover:text-white transition-colors text-notion-gray-700 dark:text-notion-gray-600"
          title="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;