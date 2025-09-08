import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  
  // Profile info state
  const [username, setUsername] = useState(user?.username || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError('');
    
    if (!username.trim()) {
      setProfileError('Le nom d\'utilisateur est requis');
      return;
    }
    
    if (username.trim().length < 3) {
      setProfileError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return;
    }
    
    try {
      setIsUpdatingProfile(true);
      
      await invoke('update_username', {
        userId: user?.id,
        newUsername: username.trim(),
      });
      
      // Update the user context and localStorage
      updateUser({ username: username.trim() });
      
      addToast('Nom d\'utilisateur mis à jour avec succès', 'success');
    } catch (error) {
      console.error("Erreur lors de la mise à jour du nom d'utilisateur :", error);
      setProfileError(error instanceof Error ? error.message : "Échec de la mise à jour du nom d'utilisateur");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError('');
    
    // Validate form
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont obligatoires');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      
      await invoke('change_password', {
        userId: user?.id,
        currentPassword,
        newPassword,
      });
      
      addToast('Mot de passe mis à jour avec succès', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe :', error);
      setPasswordError(error instanceof Error ? error.message : 'Échec de la mise à jour du mot de passe');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Paramètres du Profil
          </h1>
          <p className="text-muted-foreground">
            Gérez vos paramètres et préférences de compte
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-surface border border-border overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full">
                <span className="text-2xl font-bold text-muted-foreground">
                  {(username || user?.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {username || user?.username || 'Utilisateur'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {user?.role || 'Membre'}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border bg-muted">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Informations du Profil</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'password'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Sécurité</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Informations Personnelles
                  </h3>
                  
                  {profileError && (
                    <div className="mb-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{profileError}</span>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Input
                        label="Nom d'utilisateur"
                        type="text"
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        placeholder="Entrez votre nom d'utilisateur"
                        required
                        helperText="Ceci sera affiché dans toute l'application"
                      />
                      
                      <Input
                        label="Rôle"
                        type="text"
                        value={user?.role || 'Membre'}
                        disabled
                        helperText="Contactez un administrateur pour modifier votre rôle"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setUsername(user?.username || '')}
                        disabled={isUpdatingProfile}
                      >
                        Réinitialiser
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={isUpdatingProfile || username === user?.username}
                        isLoading={isUpdatingProfile}
                      >
                        Mettre à jour le profil
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Changer le mot de passe
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Assurez-vous que votre compte utilise un mot de passe long et aléatoire pour rester sécurisé.
                  </p>
                  
                  {passwordError && (
                    <div className="mb-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{passwordError}</span>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <Input
                      label="Mot de passe actuel"
                      type="password"
                      value={currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe actuel"
                      required
                    />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Input
                        label="Nouveau mot de passe"
                        type="password"
                        value={newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                        placeholder="Entrez un nouveau mot de passe"
                        required
                        helperText="Minimum 8 caractères"
                      />
                      
                      <Input
                        label="Confirmer le nouveau mot de passe"
                        type="password"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmer le nouveau mot de passe"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                        }}
                        disabled={isUpdatingPassword}
                      >
                        Effacer
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={isUpdatingPassword}
                        isLoading={isUpdatingPassword}
                      >
                        Mettre à jour le mot de passe
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
