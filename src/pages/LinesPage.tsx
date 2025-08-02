import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setBulkModal] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  // Form states
  const [formData, setFormData] = useState<CreateLineRequest>({
    name: '',
    description: '',
    is_active: true,
  });
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    try {
      setLoading(true);
      const result = await invoke<ProductionLine[]>('get_lines');
      setLines(result);
    } catch (error) {
      console.error('Error loading lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLine = async () => {
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
      loadLines();
    } catch (error) {
      console.error('Error creating/updating line:', error);
    }
  };

  const handleBulkCreate = async () => {
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
        loadLines();
      }
    } catch (error) {
      console.error('Error bulk creating lines:', error);
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    if (confirm('Are you sure you want to delete this line?')) {
      try {
        await invoke('delete_line', { lineId });
        loadLines();
      } catch (error) {
        console.error('Error deleting line:', error);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLines.length > 0 && confirm(`Delete ${selectedLines.length} selected lines?`)) {
      try {
        await invoke('delete_multiple_lines', { lineIds: selectedLines });
        setSelectedLines([]);
        loadLines();
      } catch (error) {
        console.error('Error deleting lines:', error);
      }
    }
  };

  const openEditModal = (line: ProductionLine) => {
    setEditingLine(line);
    setFormData({
      name: line.name,
      description: line.description || '',
      is_active: line.is_active,
    });
    setShowCreateModal(true);
  };

  const toggleLineSelection = (lineId: string) => {
    setSelectedLines(prev =>
      prev.includes(lineId)
        ? prev.filter(id => id !== lineId)
        : [...prev, lineId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading lines...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-notion-gray-900 dark:text-notion-gray-900">
          Production Lines Management
        </h1>
        <div className="flex space-x-2">
          {selectedLines.length > 0 && (
            <Button
              onClick={handleDeleteSelected}
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

      {/* Lines Table */}
      <Table
        columns={[
          {
            key: 'select',
            header: (
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedLines(lines.map(line => line.id));
                  } else {
                    setSelectedLines([]);
                  }
                }}
                checked={selectedLines.length === lines.length && lines.length > 0}
              />
            ) as any,
            width: '50px',
            render: (_, line) => (
              <input
                type="checkbox"
                checked={selectedLines.includes(line.id)}
                onChange={() => toggleLineSelection(line.id)}
              />
            ),
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
            render: (_, line) => (
              <div className="space-x-2">
                <button
                  onClick={() => openEditModal(line)}
                  className="text-notion-blue hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteLine(line.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        data={lines}
        hoverable={true}
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50 min-h-[100px]"
              placeholder="Optional description of the production line"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
            onChange={(e) => setBulkText(e.target.value)}
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
    </div>
  );
};

export default LinesPage;
