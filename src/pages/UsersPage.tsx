import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Select from '../components/ui/Select';
import Dialog from '../components/ui/Dialog';
import { ROLES } from '../types/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserEdit, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import { PaginatedResponse } from '../types/pagination';

interface User {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface CreateUserForm {
  username: string;
  password: string;
  role: string;
}

interface EditUserForm {
  id: string;
  username: string;
  role: string;
  newPassword?: string;
}

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: 'Administrateur' },
  { value: ROLES.RECLAMATION_CLIENT, label: 'Réclamation client' },
  { value: ROLES.RETOUR_CLIENT, label: 'Retour client' },
  { value: ROLES.SITE01, label: 'Site 01' },
  { value: ROLES.SITE02, label: 'Site 02' },
  { value: ROLES.PERFORMANCE, label: 'Performance' },
  { value: ROLES.CONSOMMATEUR, label: 'Consommateur' },
];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    password: '',
    role: ROLES.RECLAMATION_CLIENT,
  });
  const [editForm, setEditForm] = useState<EditUserForm>({
    id: '',
    username: '',
    role: '',
    newPassword: ''
  });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await invoke<PaginatedResponse<User>>('get_users_paginated', {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: debouncedSearchTerm || null
      });
      setUsers(result.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: result.total,
        totalPages: result.total_pages
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs :', error);
      setError('Échec du chargement des utilisateurs');
      setUsers([]);
      setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
      toast.error('Échec du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.username.trim() || !createForm.password.trim()) {
      toast.error('Le nom d\'utilisateur et le mot de passe sont requis');
      return;
    }
    
    if (createForm.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    try {
      setIsCreating(true);
      await invoke('create_user', {
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role
      });
      
      toast.success('Utilisateur créé avec succès');
      setIsCreateModalOpen(false);
      setCreateForm({ username: '', password: '', role: ROLES.RECLAMATION_CLIENT });
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      toast.error(error instanceof Error ? error.message : 'Échec de la création de l\'utilisateur');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.username.trim()) {
      toast.error('Le nom d\'utilisateur est requis');
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Update username if changed
      const originalUser = users.find(u => u.id === editForm.id);
      if (originalUser && originalUser.username !== editForm.username.trim()) {
        await invoke('update_username', {
          userId: editForm.id,
          newUsername: editForm.username.trim()
        });
      }
      
      // Update role if changed
      if (originalUser && originalUser.role !== editForm.role) {
        await invoke('update_user_role', {
          userId: editForm.id,
          newRole: editForm.role
        });
      }
      
      // Update password if provided
      if (editForm.newPassword && editForm.newPassword.trim()) {
        if (editForm.newPassword.length < 8) {
          toast.error('Le mot de passe doit contenir au moins 8 caractères');
          return;
        }
        await invoke('update_user_password', {
          userId: editForm.id,
          newPassword: editForm.newPassword
        });
      }
      
      toast.success('Utilisateur mis à jour avec succès');
      setIsEditModalOpen(false);
      setEditForm({ id: '', username: '', role: ROLES.RECLAMATION_CLIENT, newPassword: '' });
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur :', error);
      toast.error(error instanceof Error ? error.message : 'Échec de la mise à jour de l\'utilisateur');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      await invoke('delete_user', { userId: userToDelete.id });
      
      toast.success('Utilisateur supprimé avec succès');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur :', error);
      toast.error(error instanceof Error ? error.message : 'Échec de la suppression de l\'utilisateur');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditForm({
      id: user.id,
      username: user.username,
      role: user.role,
      newPassword: ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role: string) => {
    const roleObj = ROLE_OPTIONS.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-muted text-muted-foreground border-muted/20';
      case ROLES.PERFORMANCE:
        return 'bg-primary text-primary-foreground border-primary/20';
      case ROLES.SITE01:
      case ROLES.SITE02:
        return 'bg-secondary text-secondary-foreground border-secondary/20';
      case ROLES.RECLAMATION_CLIENT:
      case ROLES.RETOUR_CLIENT:
        return 'bg-popover text-popover-foreground border-popover/20';
      case ROLES.CONSOMMATEUR:
        return 'bg-accent text-accent-foreground border-accent/20';
      default:
        return 'bg-ring text-input border-ring/20';
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-primary">Chargement des utilisateurs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Gestion des utilisateurs
              </h1>
              <p className="text-muted-foreground mb-6">
                Gérez les utilisateurs, rôles et permissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher des utilisateurs..."
                className="w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Ajouter un utilisateur</span>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive text-destructive-foreground rounded-lg border border-destructive/20">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Users Table */}
        <Table
          columns={[
            {
              key: 'username',
              header: 'Utilisateur',
              render: (value, user) => {
                void value;
                return (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-foreground">
                        {user.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                );
              }
            },
            {
              key: 'role',
              header: 'Rôle',
              render: (value) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(value)}`}>
                  {getRoleLabel(value)}
                </span>
              )
            },
            {
              key: 'created_at',
              header: 'Créé le',
              render: (value) => formatDate(value)
            },
            {
              key: 'updated_at',
              header: 'Mis à jour le',
              render: (value) => formatDate(value)
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (value, user) => {
                void value;
                return (
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(user);
                      }}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors duration-200"
                      title="Modifier l'utilisateur"
                    >
                      <FontAwesomeIcon icon={faUserEdit} className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(user);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors duration-200"
                      title="Supprimer l'utilisateur"
                    >
                      <FontAwesomeIcon icon={faUserTimes} className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
            }
          ]}
          data={users}
          hoverable={true}
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems,
            itemsPerPage: pagination.itemsPerPage,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange,
            showItemsPerPage: true
          }}
        />

        {/* Create User Dialog */}
        <Dialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Nouvel utilisateur"
          maxWidth="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
              label="Nom d'utilisateur"
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              placeholder="Saisissez un nom d'utilisateur"
              required
            />
            
            <Input
              label="Mot de passe"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Saisissez un mot de passe"
              helperText="Minimum 8 caractères"
            />
            
            <Select
              label="Rôle"
              value={createForm.role}
              onChange={(value) => setCreateForm({ ...createForm, role: value })}
              options={ROLE_OPTIONS}
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating}
                isLoading={isCreating}
              >
                Créer l'utilisateur
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier l'utilisateur"
          maxWidth="md"
        >
          <form onSubmit={handleEditUser} className="space-y-4">
            <Input
              label="Nom d'utilisateur"
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              placeholder="Saisissez un nom d'utilisateur"
              required
            />
            
            <Select
              label="Rôle"
              value={editForm.role}
              onChange={(value) => setEditForm({ ...editForm, role: value })}
              options={ROLE_OPTIONS}
            />
            
            <Input
              label="Nouveau mot de passe (Optionnel)"
              type="password"
              value={editForm.newPassword || ''}
              onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
              placeholder="Laisser vide pour conserver le mot de passe actuel"
              helperText="Minimum 8 caractères si changement"
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                Mettre à jour
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog
          isOpen={isDeleteModalOpen && !!userToDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Supprimer l'utilisateur"
          maxWidth="md"
        >
          <div className="mb-6">
            <div className="flex items-start space-x-3 p-4 bg-destructive/10 dark:bg-destructive/20 rounded-lg border border-destructive/20">
              <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-destructive">
                  Êtes-vous sûr de vouloir supprimer cet utilisateur ?
                </h3>
                <p className="text-sm text-destructive/80 mt-1">
                  Utilisateur : <strong>{userToDelete?.username}</strong>
                </p>
                <p className="text-sm text-destructive/80">
                  Cette action est irréversible.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              isLoading={isDeleting}
            >
              Supprimer l'utilisateur
            </Button>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default UsersPage;
