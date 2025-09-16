import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTheme } from "./ThemeProvider";
import { useUpdateManager } from "../ui/UpdateManager";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";

const TitleBar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    updateAvailable,
    checking: checkingUpdate,
    installing: isInstalling,
    showUpdateDialog,
    setShowUpdateDialog,
    checkForUpdates,
    installUpdate
  } = useUpdateManager();

  const handleUpdateCheck = () => {
    checkForUpdates(true);
  };

  const handleInstallUpdate = () => {
    installUpdate();
  };

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
        {/* Update icon */}
        <button
          onClick={handleUpdateCheck}
          disabled={checkingUpdate}
          className={`flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-all duration-200 ${
            updateAvailable 
              ? 'text-blue-600 hover:text-blue-700' 
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          } ${checkingUpdate ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={
            checkingUpdate 
              ? "Vérification des mises à jour..." 
              : updateAvailable 
                ? "Mise à jour disponible ! Cliquez pour installer"
                : "Vérifier les mises à jour"
          }
        >
          <FontAwesomeIcon
            icon={checkingUpdate ? "spinner" : updateAvailable ? "download" : "sync"}
            className={`w-4 h-4 ${checkingUpdate ? 'animate-spin' : ''}`}
          />
        </button>

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

      {/* Update Dialog */}
      <Dialog 
        isOpen={showUpdateDialog} 
        onClose={() => setShowUpdateDialog(false)}
        title="Mise à jour disponible"
      >
        <div className="space-y-4">
          <p className="text-[var(--color-muted-foreground)]">
            Une nouvelle version de l'application est disponible. Souhaitez-vous l'installer maintenant ?
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            L'application sera redémarrée automatiquement après l'installation.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              disabled={isInstalling}
            >
              Annuler
            </Button>
            <Button
              onClick={handleInstallUpdate}
              disabled={isInstalling}
              className="min-w-[100px]"
            >
              {isInstalling ? (
                <>
                  <FontAwesomeIcon icon="spinner" className="animate-spin mr-2" />
                  Installation...
                </>
              ) : (
                'Installer'
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TitleBar;
