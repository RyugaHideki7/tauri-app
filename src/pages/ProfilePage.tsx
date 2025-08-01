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
      setProfileError('Username is required');
      return;
    }
    
    if (username.trim().length < 3) {
      setProfileError('Username must be at least 3 characters long');
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
      
      addToast('Username updated successfully', 'success');
    } catch (error) {
      console.error('Error updating username:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to update username');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError('');
    
    // Validate form
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      
      await invoke('change_password', {
        userId: user?.id,
        currentPassword,
        newPassword,
      });
      
      addToast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
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
                  {username || user?.username || 'User'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {user?.role || 'Member'}
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
                  <span>Profile Info</span>
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
                  <span>Security</span>
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
                    Personal Information
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
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        helperText="This will be displayed throughout the application"
                      />
                      
                      <Input
                        label="Role"
                        type="text"
                        value={user?.role || 'Member'}
                        disabled
                        helperText="Contact an administrator to change your role"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setUsername(user?.username || '')}
                        disabled={isUpdatingProfile}
                      >
                        Reset
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={isUpdatingProfile || username === user?.username}
                        isLoading={isUpdatingProfile}
                      >
                        Update Profile
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
                    Change Password
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Ensure your account is using a long, random password to stay secure.
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
                      label="Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                    />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Input
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        helperText="Minimum 8 characters"
                      />
                      
                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
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
                        Clear
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={isUpdatingPassword}
                        isLoading={isUpdatingPassword}
                      >
                        Update Password
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
