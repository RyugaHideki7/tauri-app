import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from './ThemeProvider';

const TitleBar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Minimize failed:', error);
      try {
        await invoke('minimize_window');
      } catch (invokeError) {
        console.error('Invoke minimize failed:', invokeError);
      }
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      await window.toggleMaximize();
    } catch (error) {
      console.error('Maximize failed:', error);
      try {
        await invoke('maximize_window');
      } catch (invokeError) {
        console.error('Invoke maximize failed:', invokeError);
      }
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Close failed:', error);
      try {
        await invoke('close_window');
      } catch (invokeError) {
        console.error('Invoke close failed:', invokeError);
      }
    }
  };

  return (
    <div 
      className="flex items-center justify-between h-8 bg-panel-sidebar border-b border-divider-border px-3 select-none"
      data-tauri-drag-region
    >
      {/* Left side - App name */}
      <div className="flex items-center">
        <span className="text-xs font-normal text-secondary-text opacity-70">
          Tauri App
        </span>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-0.5">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded hover:bg-surface-hover transition-all duration-200 opacity-60 hover:opacity-100"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <FontAwesomeIcon 
            icon={isDarkMode ? 'sun' : 'moon'} 
            className="w-3.5 h-3.5 text-secondary-text" 
          />
        </button>
        
        <div className="w-px h-3 bg-divider-border mx-2"></div>
        
        <button 
          onClick={handleMinimize}
          className="p-1.5 rounded hover:bg-surface-hover transition-all duration-200 opacity-50 hover:opacity-100"
          title="Minimize"
        >
          <FontAwesomeIcon 
            icon="minus" 
            className="w-3.5 h-3.5 text-secondary-text" 
          />
        </button>
        
        <button 
          onClick={handleMaximize}
          className="p-1.5 rounded hover:bg-surface-hover transition-all duration-200 opacity-50 hover:opacity-100"
          title="Maximize"
        >
          <FontAwesomeIcon 
            icon="expand" 
            className="w-3.5 h-3.5 text-secondary-text" 
          />
        </button>
        
        <button 
          onClick={handleClose}
          className="p-1.5 rounded hover:bg-accent-orange hover:text-white transition-all duration-200 opacity-50 hover:opacity-100 text-secondary-text"
          title="Close"
        >
          <FontAwesomeIcon 
            icon="times" 
            className="w-3.5 h-3.5" 
          />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;