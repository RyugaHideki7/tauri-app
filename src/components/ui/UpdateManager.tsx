import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Button from './Button';
import Dialog from './Dialog';
import { useToast } from './Toast';

interface UpdateManagerProps {
  children?: React.ReactNode;
}

export const UpdateManager: React.FC<UpdateManagerProps> = ({ children }) => {
  const [, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const { addToast } = useToast();

  const checkForUpdates = async (showToast = false) => {
    setChecking(true);
    try {
      const hasUpdate = await invoke<boolean>('check_for_updates');
      setUpdateAvailable(hasUpdate);
      
      if (hasUpdate) {
        setShowUpdateDialog(true);
        if (showToast) {
          addToast('Update available! Click to install.', 'info');
        }
      } else if (showToast) {
        addToast('You are running the latest version.', 'success');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      if (showToast) {
        addToast('Failed to check for updates', 'error');
      }
    } finally {
      setChecking(false);
    }
  };

  const installUpdate = async () => {
    setInstalling(true);
    try {
      await invoke('install_update');
      addToast('Update installed! The app will restart.', 'success');
      setShowUpdateDialog(false);
    } catch (error) {
      console.error('Failed to install update:', error);
      addToast('Failed to install update', 'error');
    } finally {
      setInstalling(false);
    }
  };

  // Check for updates on component mount
  useEffect(() => {
    // Check for updates 5 seconds after the app starts
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Check for updates every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {children}
      
      {/* Manual update check button - can be placed in settings or menu */}
      <Button
        onClick={() => checkForUpdates(true)}
        disabled={checking}
        variant="outline"
        size="sm"
        className="text-xs"
      >
        {checking ? 'Checking...' : 'Check for Updates'}
      </Button>

      {/* Update available dialog */}
      <Dialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        title="Update Available"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-blue-600 dark:text-blue-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" 
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                New Update Available
              </h3>
              <p className="text-sm text-muted-foreground">
                A new version of the application is ready to install.
              </p>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This update may include:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Bug fixes and performance improvements</li>
                <li>New features and enhancements</li>
                <li>Security updates</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowUpdateDialog(false)}
              variant="outline"
              disabled={installing}
            >
              Later
            </Button>
            <Button
              onClick={installUpdate}
              disabled={installing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {installing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Installing...
                </div>
              ) : (
                'Install Update'
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default UpdateManager;
