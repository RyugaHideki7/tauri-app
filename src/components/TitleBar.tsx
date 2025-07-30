import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

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
    try {
      console.log('Minimizing window...');
      // Try the direct API first
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Direct minimize failed, trying invoke:', error);
      try {
        await invoke('minimize_window');
      } catch (invokeError) {
        console.error('Invoke minimize failed:', invokeError);
      }
    }
  };

  const handleMaximize = async () => {
    try {
      console.log('Toggling maximize...');
      const window = getCurrentWindow();
      await window.toggleMaximize();
    } catch (error) {
      console.error('Direct maximize failed, trying invoke:', error);
      try {
        await invoke('maximize_window');
      } catch (invokeError) {
        console.error('Invoke maximize failed:', invokeError);
      }
    }
  };

  const handleClose = async () => {
    try {
      console.log('Closing window...');
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Direct close failed, trying invoke:', error);
      try {
        await invoke('close_window');
      } catch (invokeError) {
        console.error('Invoke close failed:', invokeError);
      }
    }
  };

  return (
    <div 
      className="flex items-center justify-between h-8 bg-notion-gray-200/50 dark:bg-notion-gray-300/30 border-b border-notion-gray-300/30 dark:border-notion-gray-500/20 px-3 select-none backdrop-blur-sm"
      data-tauri-drag-region
    >
      {/* Left side - App name */}
      <div className="flex items-center">
        <span className="text-xs font-normal text-notion-gray-600 dark:text-notion-gray-500 opacity-70">
          Tauri App
        </span>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-0.5">
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded hover:bg-notion-gray-300/40 dark:hover:bg-notion-gray-400/30 transition-all duration-200 opacity-60 hover:opacity-100"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <svg className="w-3.5 h-3.5 text-notion-gray-600 dark:text-notion-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-notion-gray-600 dark:text-notion-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
        
        <div className="w-px h-3 bg-notion-gray-400/20 dark:bg-notion-gray-500/20 mx-2"></div>
        
        <button 
          onClick={handleMinimize}
          className="p-1.5 rounded hover:bg-notion-gray-300/40 dark:hover:bg-notion-gray-400/30 transition-all duration-200 opacity-50 hover:opacity-100"
          title="Minimize"
        >
          <svg className="w-3.5 h-3.5 text-notion-gray-600 dark:text-notion-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>
        
        <button 
          onClick={handleMaximize}
          className="p-1.5 rounded hover:bg-notion-gray-300/40 dark:hover:bg-notion-gray-400/30 transition-all duration-200 opacity-50 hover:opacity-100"
          title="Maximize"
        >
          <svg className="w-3.5 h-3.5 text-notion-gray-600 dark:text-notion-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4z" />
          </svg>
        </button>
        
        <button 
          onClick={handleClose}
          className="p-1.5 rounded hover:bg-notion-red/80 dark:hover:bg-notion-red/70 hover:text-white transition-all duration-200 opacity-50 hover:opacity-100 text-notion-gray-600 dark:text-notion-gray-500"
          title="Close"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;