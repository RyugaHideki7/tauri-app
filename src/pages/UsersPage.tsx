import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Select from '../components/ui/Select';
import Dialog from '../components/ui/Dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserEdit, faUserTimes } from '@fortawesome/free-solid-svg-icons';

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

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'client', label: 'Client' },
  { value: 'site01', label: 'Site 01' },
  { value: 'site02', label: 'Site 02' },
  { value: 'performance', label: 'Performance' },
  { value: 'consommateur', label: 'Consumer' },
];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    password: '',
    role: 'client'
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const usersData = await invoke<User[]>('get_users');
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.username.trim() || !createForm.password.trim()) {
      toast.error('Username and password are required');
      return;
    }
    
    if (createForm.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsCreating(true);
      await invoke('create_user', {
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role
      });
      
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({ username: '', password: '', role: 'client' });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.username.trim()) {
      toast.error('Username is required');
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
          toast.error('Password must be at least 8 characters long');
          return;
        }
        await invoke('update_user_password', {
          userId: editForm.id,
          newPassword: editForm.newPassword
        });
      }
      
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setEditForm({ id: '', username: '', role: '', newPassword: '' });
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      await invoke('delete_user', { userId: userToDelete.id });
      
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role: string) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-muted text-muted-foreground border-muted/20';
      case 'performance':
        return 'bg-primary text-primary-foreground border-primary/20';
      case 'site01':
      case 'site02':
        return 'bg-secondary text-secondary-foreground border-secondary/20';
      case 'client':
        return 'bg-popover text-popover-foreground border-popover/20';
      case 'consommateur':
        return 'bg-accent text-accent-foreground border-accent/20';
      default:
        return 'bg-ring text-input border-ring/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-primary">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                User Management
              </h1>
              <p className="text-muted-foreground mb-6">
                Manage users, roles, and permissions
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add User</span>
            </Button>
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
              header: 'User',
              render: (_, user) => (
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
              )
            },
            {
              key: 'role',
              header: 'Role',
              render: (value) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(value)}`}>
                  {getRoleLabel(value)}
                </span>
              )
            },
            {
              key: 'created_at',
              header: 'Created At',
              render: (value) => formatDate(value)
            },
            {
              key: 'updated_at',
              header: 'Updated At',
              render: (value) => formatDate(value)
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (_, user) => (
                <div className="flex items-center justify-end space-x-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(user);
                    }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors duration-200"
                    title="Edit user"
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
                    title="Delete user"
                  >
                    <FontAwesomeIcon icon={faUserTimes} className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          ]}
          data={users}
          hoverable={true}
        />

        {/* Create User Dialog */}
        <Dialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New User"
          maxWidth="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              placeholder="Enter username"
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Enter password"
              required
              helperText="Minimum 8 characters"
            />
            
            <Select
              label="Role"
              value={createForm.role}
              onChange={(value) => setCreateForm({ ...createForm, role: value })}
              options={ROLES}
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating}
                isLoading={isCreating}
              >
                Create User
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User"
          maxWidth="md"
        >
          <form onSubmit={handleEditUser} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              placeholder="Enter username"
              required
            />
            
            <Select
              label="Role"
              value={editForm.role}
              onChange={(value) => setEditForm({ ...editForm, role: value })}
              options={ROLES}
            />
            
            <Input
              label="New Password (Optional)"
              type="password"
              value={editForm.newPassword || ''}
              onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
              placeholder="Leave empty to keep current password"
              helperText="Minimum 8 characters if changing"
            />
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                Update User
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog
          isOpen={isDeleteModalOpen && !!userToDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete User"
          maxWidth="md"
        >
          <div className="mb-6">
            <div className="flex items-start space-x-3 p-4 bg-destructive/10 dark:bg-destructive/20 rounded-lg border border-destructive/20">
              <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-destructive">
                  Are you sure you want to delete this user?
                </h3>
                <p className="text-sm text-destructive/80 mt-1">
                  User: <strong>{userToDelete?.username}</strong>
                </p>
                <p className="text-sm text-destructive/80">
                  This action cannot be undone.
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
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              isLoading={isDeleting}
            >
              Delete User
            </Button>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default UsersPage;
