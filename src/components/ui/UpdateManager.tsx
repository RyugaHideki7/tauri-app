import { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useToast } from './Toast';

export const useUpdateManager = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { addToast } = useToast();

  const checkForUpdates = async (showToast = false) => {
    setChecking(true);
    try {
      const update = await check();
      
      if (update) {
        console.log(`Found update ${update.version} from ${update.date} with notes ${update.body}`);
        setUpdateAvailable(true);
        setUpdateInfo(update);
        setShowUpdateDialog(true);
        if (showToast) {
          addToast('Mise à jour disponible ! Cliquez pour installer.', 'info');
        }
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
        if (showToast) {
          addToast('Vous utilisez la dernière version.', 'success');
        }
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
    if (!updateInfo) return;
    
    setInstalling(true);
    setDownloadProgress(0);
    
    try {
      let downloaded = 0;
      let contentLength = 0;
      
      // Download and install the update with progress tracking
      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength;
            console.log(`Started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            setDownloadProgress(Math.round(progress));
            console.log(`Downloaded ${downloaded} from ${contentLength}`);
            break;
          case 'Finished':
            console.log('Download finished');
            setDownloadProgress(100);
            break;
        }
      });
      
      console.log('Update installed');
      addToast('Mise à jour installée ! L\'application va redémarrer.', 'success');
      setShowUpdateDialog(false);
      
      // Restart the application
      await relaunch();
    } catch (error) {
      console.error('Failed to install update:', error);
      addToast('Échec de l\'installation de la mise à jour', 'error');
    } finally {
      setInstalling(false);
      setDownloadProgress(0);
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
    installUpdate,
    updateInfo,
    downloadProgress
  };
};
