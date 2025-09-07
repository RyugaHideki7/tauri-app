import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import { SearchBar } from '../components/ui/SearchBar';
import { PaginatedResponse } from '../types/pagination';

interface ProductionLine {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateLineRequest {
  name: string;
  description?: string;
  is_active: boolean;
}

const LinesPage: React.FC = () => {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setBulkModal] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [lineToDelete, setLineToDelete] = useState<ProductionLine | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Form states
  const [formData, setFormData] = useState<CreateLineRequest>({
    name: '',
    description: '',
    is_active: true,
  });
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    loadLines();
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  const loadLines = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await invoke<PaginatedResponse<ProductionLine>>('get_lines_paginated', {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: debouncedSearchTerm || null
      });
      setLines(result.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: result.total,
        totalPages: result.total_pages
      }));
    } catch (error) {
      console.error('Error loading lines:', error);
      setLines([]);
      setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  const handleCreateLine = async (): Promise<void> => {
    try {
      if (editingLine) {
        await invoke('update_line', {
          request: {
            id: editingLine.id,
            ...formData,
          },
        });
      } else {
        await invoke('create_line', { request: formData });
      }
      
      setShowCreateModal(false);
      setEditingLine(null);
      setFormData({ name: '', description: '', is_active: true });
      await loadLines();
    } catch (error) {
      console.error('Error creating/updating line:', error);
    }
  };

  const handleBulkCreate = async (): Promise<void> => {
    try {
      const lines = bulkText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split('|').map(p => p.trim());
          return {
            name: parts[0],
            description: parts[1] || undefined,
            is_active: parts[2] ? parts[2].toLowerCase() === 'true' : true,
          };
        });

      if (lines.length > 0) {
        await invoke('bulk_create_lines', { request: { lines } });
        setBulkModal(false);
        setBulkText('');
        await loadLines();
      }
    } catch (error) {
      console.error('Error bulk creating lines:', error);
    }
  };

  const handleDeleteLine = async (lineId: string): Promise<void> => {
    try {
      await invoke('delete_line', { lineId });
      await loadLines();
    } catch (error) {
      console.error('Error deleting line:', error);
    }
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedLines.length === 0) return;
    try {
      await invoke('delete_multiple_lines', { lineIds: selectedLines });
      setSelectedLines([]);
      await loadLines();
    } catch (error) {
      console.error('Error deleting lines:', error);
    }
  };

  const openEditModal = (line: ProductionLine): void => {
    setEditingLine(line);
    setFormData({
      name: line.name,
      description: line.description || '',
      is_active: line.is_active,
    });
    setShowCreateModal(true);
  };

  const toggleLineSelection = (lineId: string): void => {
    setSelectedLines(prev =>
      prev.includes(lineId)
        ? prev.filter(id => id !== lineId)
        : [...prev, lineId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLines(lines.map(line => line.id));
    } else {
      setSelectedLines([]);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading lines...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Lignes de Production
        </h1>
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder="Search lines..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-64"
          />
          <div className="flex space-x-2">
            {selectedLines.length > 0 && (
              <Button
                onClick={() => setShowBulkDeleteModal(true)}
                variant="danger"
              >
                Delete Selected ({selectedLines.length})
              </Button>
            )}
            <Button
              onClick={() => setBulkModal(true)}
              variant="secondary"
            >
              Bulk Create
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
            >
              Add Line
            </Button>
          </div>
        </div>
      </div>

      {/* Lines Table */}
      <Table
        columns={[
          {
            key: 'select',
            header: (
              <input
                type="checkbox"
                checked={selectedLines.length > 0 && selectedLines.length === lines.length}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            ),
            width: '50px',
            render: (value, line: ProductionLine) => {
              void value;
              return (
                <input
                  type="checkbox"
                  checked={selectedLines.includes(line.id)}
                  onChange={() => toggleLineSelection(line.id)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              );
            },
          },
          {
            key: 'name',
            header: 'Name',
            render: (value) => <span className="font-medium">{value}</span>,
          },
          {
            key: 'description',
            header: 'Description',
            render: (value) => value || '-',
          },
          {
            key: 'is_active',
            header: 'Status',
            render: (value) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                value 
                  ? 'bg-notion-blue-light text-notion-blue' 
                  : 'bg-notion-red-light text-notion-red'
              }`}>
                {value ? 'Active' : 'Inactive'}
              </span>
            ),
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (value) => new Date(value).toLocaleDateString(),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (value, line: ProductionLine) => {
              void value;
              return (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openEditModal(line)}
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setLineToDelete(line);
                      setShowDeleteModal(true);
                    }}
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              );
            },
          },
        ]}
        data={lines}
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

      {/* Create/Edit Dialog */}
      <Dialog
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingLine(null);
          setFormData({ name: '', description: '', is_active: true });
        }}
        title={editingLine ? 'Edit Line' : 'Create New Line'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50"
              placeholder="e.g., Assembly Line 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50 min-h-[100px]"
              placeholder="Optional description of the production line"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-border/50 dark:border-border/30 focus:ring-primary/50 text-primary"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-foreground">
              Active
            </label>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              setEditingLine(null);
              setFormData({ name: '', description: '', is_active: true });
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCreateLine}
          >
            {editingLine ? 'Update' : 'Create'}
          </Button>
        </div>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog
        isOpen={showBulkModal}
        onClose={() => {
          setBulkModal(false);
          setBulkText('');
        }}
        title="Bulk Create Lines"
        maxWidth="2xl"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Enter one line per row. Format: Name | Description | Active (true/false)
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Example: Assembly Line 1 | Main production line for electronics | true
          </p>
          <textarea
            value={bulkText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkText(e.target.value)}
            className="w-full px-4 py-3 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50 font-mono text-sm"
            placeholder="Assembly Line 1 | Main production line | true&#10;Packaging Line | Final packaging station | true"
            rows={10}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setBulkModal(false);
              setBulkText('');
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleBulkCreate}
            disabled={!bulkText.trim()}
          >
            Create Lines
          </Button>
        </div>
      </Dialog>

      {/* Delete Line Dialog */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setLineToDelete(null);
        }}
        title="Delete Line"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Are you sure you want to delete this line?
          </p>
          {lineToDelete && (
            <div className="text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Name:</span> {lineToDelete.name}
              </div>
              {lineToDelete.description && (
                <div>
                  <span className="font-medium text-foreground">Description:</span> {lineToDelete.description}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setLineToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (lineToDelete) {
                await handleDeleteLine(lineToDelete.id);
                setShowDeleteModal(false);
                setLineToDelete(null);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>

      {/* Bulk Delete Lines Dialog */}
      <Dialog
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Delete Selected Lines"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Delete {selectedLines.length} selected {selectedLines.length === 1 ? 'line' : 'lines'}?
          </p>
          <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowBulkDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              await handleDeleteSelected();
              setShowBulkDeleteModal(false);
            }}
          >
            Delete Selected
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default LinesPage;
