import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Dialog from "../components/ui/Dialog";
import { PaginatedResponse } from "../types/pagination";

interface Client {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CreateClientRequest {
  name: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [bulkText, setBulkText] = useState<string>("");

  const [formData, setFormData] = useState<CreateClientRequest>({
    name: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadClients = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await invoke<PaginatedResponse<Client>>("get_clients_paginated", {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: debouncedSearchTerm || null
      });
      setClients(result.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: result.total,
        totalPages: result.total_pages
      }));
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
      setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  };

  const handleCreateClient = async (): Promise<void> => {
    try {
      if (editingClient) {
        await invoke("update_client", {
          request: {
            id: editingClient.id,
            name: formData.name,
          },
        });
      } else {
        await invoke("create_client", { request: formData });
      }

      setShowCreateModal(false);
      setEditingClient(null);
      setFormData({ name: "" });
      await loadClients();
    } catch (error) {
      console.error("Error creating/updating client:", error);
    }
  };

  const handleBulkCreate = useCallback(async (): Promise<void> => {
    try {
      const clientsToCreate = bulkText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => ({ name: line }));

      if (clientsToCreate.length > 0) {
        await invoke("bulk_create_clients", { request: { clients: clientsToCreate } });
        setShowBulkModal(false);
        setBulkText("");
        await loadClients();
      }
    } catch (error) {
      console.error("Error bulk creating clients:", error);
    }
  }, [bulkText, loadClients]);

  const handleDeleteClient = async (clientId: string): Promise<void> => {
    try {
      await invoke("delete_client", { clientId });
      await loadClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedClients.length === 0) return;
    try {
      await invoke("delete_multiple_clients", { clientIds: selectedClients });
      setSelectedClients([]);
      await loadClients();
    } catch (error) {
      console.error("Error deleting clients:", error);
    }
  };

  const openEditModal = (client: Client): void => {
    setEditingClient(client);
    setFormData({ name: client.name });
    setShowCreateModal(true);
  };

  const toggleClientSelection = (clientId: string): void => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients.map((c) => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients..."
            className="w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {selectedClients.length > 0 && (
            <Button onClick={() => setShowBulkDeleteModal(true)} variant="danger">
              Delete Selected ({selectedClients.length})
            </Button>
          )}
          <Button onClick={() => setShowBulkModal(true)} variant="secondary">
            Bulk Create
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Add Client
          </Button>
        </div>
      </div>

      <Table
        columns={[
          {
            key: "select",
            header: (
              <input
                type="checkbox"
                checked={
                  selectedClients.length > 0 && selectedClients.length === clients.length
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            ),
            render: (_value: unknown, client: Client) => (
              <input
                type="checkbox"
                checked={selectedClients.includes(client.id)}
                onChange={() => toggleClientSelection(client.id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            ),
          },
          {
            key: "name",
            header: "Name",
            render: (value: string) => value,
          },
          {
            key: "created_at",
            header: "Created",
            render: (value: string) => new Date(value).toLocaleDateString(),
          },
          {
            key: "updated_at",
            header: "Updated",
            render: (value: string) => new Date(value).toLocaleDateString(),
          },
          {
            key: "actions",
            header: "Actions",
            render: (_value: unknown, client: Client) => (
              <div className="flex items-center space-x-2">
                <Button type="button" variant="secondary" onClick={() => openEditModal(client)} size="sm">
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setClientToDelete(client);
                    setShowDeleteModal(true);
                  }}
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={clients}
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

      {/* Create/Edit Client Dialog */}
      <Dialog
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingClient(null);
          setFormData({ name: "" });
        }}
        title={editingClient ? "Edit Client" : "Create New Client"}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50"
              placeholder="Client name"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              setEditingClient(null);
              setFormData({ name: "" });
            }}
          >
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleCreateClient}>
            {editingClient ? "Update" : "Create"}
          </Button>
        </div>
      </Dialog>

      {/* Bulk Create Clients Dialog */}
      <Dialog
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Create Clients"
        maxWidth="2xl"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">Enter one client name per line.</p>
          <p className="text-xs text-muted-foreground mb-4">Example: Client 1</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full px-4 py-3 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50 font-mono text-sm"
            placeholder={"Client 1\nClient 2"}
            rows={10}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleBulkCreate}>
            Create Clients
          </Button>
        </div>
      </Dialog>

      {/* Delete Client Dialog */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setClientToDelete(null);
        }}
        title="Delete Client"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">Are you sure you want to delete this client?</p>
          {clientToDelete && (
            <div className="text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Name:</span> {clientToDelete.name}
              </div>
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
              setClientToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (clientToDelete) {
                await handleDeleteClient(clientToDelete.id);
                setShowDeleteModal(false);
                setClientToDelete(null);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>

      {/* Bulk Delete Clients Dialog */}
      <Dialog
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Delete Selected Clients"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Delete {selectedClients.length} selected {selectedClients.length === 1 ? "client" : "clients"}?
          </p>
          <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={() => setShowBulkDeleteModal(false)}>
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

export default ClientsPage;
