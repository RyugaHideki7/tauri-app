import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTheme } from "./ThemeProvider";

const TitleBar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error("Minimize failed:", error);
      try {
        await invoke("minimize_window");
      } catch (invokeError) {
        console.error("Invoke minimize failed:", invokeError);
      }
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      await window.toggleMaximize();
    } catch (error) {
      console.error("Maximize failed:", error);
      try {
        await invoke("maximize_window");
      } catch (invokeError) {
        console.error("Invoke maximize failed:", invokeError);
      }
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error("Close failed:", error);
      try {
        await invoke("close_window");
      } catch (invokeError) {
        console.error("Invoke close failed:", invokeError);
      }
    }
  };

  return (
    <div
      className="flex items-center justify-between h-10 bg-card border-b border-border select-none"
      data-tauri-drag-region
      style={{ paddingLeft: "16px", paddingRight: "16px" }}
    >
      {/* Left side - App name */}
      <div className="flex items-center">
        <span className="text-2xl font-bold text-foreground tracking-wide">
          Ifri
        </span>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-all duration-200 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <FontAwesomeIcon
            icon={isDarkMode ? "sun" : "moon"}
            className="w-4 h-4"
          />
        </button>

        {/* Separator */}
        <div className="w-px h-4 bg-border mx-3"></div>

        {/* Window controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleMinimize}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-all duration-200 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            title="Minimize"
            data-tauri-drag-region="false"
          >
            <FontAwesomeIcon icon="minus" className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleMaximize}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-all duration-200 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            title="Maximize"
            data-tauri-drag-region="false"
          >
            <FontAwesomeIcon icon="expand" className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-red-500 hover:text-white transition-all duration-200 text-[var(--color-muted-foreground)]"
            title="Close"
            data-tauri-drag-region="false"
          >
            <FontAwesomeIcon icon="times" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
