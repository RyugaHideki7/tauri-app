import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from './Toast';

export const useUpdateManager = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
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
          addToast('Mise à jour disponible ! Cliquez pour installer.', 'info');
        }
      } else if (showToast) {
        addToast('Vous utilisez la dernière version.', 'success');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      if (showToast) {
        addToast('Échec de la vérification des mises à jour', 'error');
      }
    } finally {
      setChecking(false);
    }
  };

  const installUpdate = async () => {
    setInstalling(true);
    try {
      await invoke('install_update');
      addToast('Mise à jour installée ! L\'application va redémarrer.', 'success');
      setShowUpdateDialog(false);
    } catch (error) {
      console.error('Failed to install update:', error);
      addToast('Échec de l\'installation de la mise à jour', 'error');
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

  return {
    updateAvailable,
    checking,
    installing,
    showUpdateDialog,
    setShowUpdateDialog,
    checkForUpdates,
    installUpdate
  };
};
