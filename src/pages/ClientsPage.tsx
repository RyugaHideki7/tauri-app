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
      console.error("Erreur lors du chargement des clients :", error);
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
      console.error("Erreur lors de la création/mise à jour du client :", error);
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
      console.error("Erreur lors de la création multiple des clients :", error);
    }
  }, [bulkText, loadClients]);

  const handleDeleteClient = async (clientId: string): Promise<void> => {
    try {
      await invoke("delete_client", { clientId });
      await loadClients();
    } catch (error) {
      console.error("Erreur lors de la suppression du client :", error);
    }
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedClients.length === 0) return;
    try {
      await invoke("delete_multiple_clients", { clientIds: selectedClients });
      setSelectedClients([]);
      await loadClients();
    } catch (error) {
      console.error("Erreur lors de la suppression des clients :", error);
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
        <div className="text-lg">Chargement des clients...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des clients..."
            className="w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {selectedClients.length > 0 && (
            <Button onClick={() => setShowBulkDeleteModal(true)} variant="danger">
              Supprimer la sélection ({selectedClients.length})
            </Button>
          )}
          <Button onClick={() => setShowBulkModal(true)} variant="secondary">
            Création multiple
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Ajouter un client
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
            header: "Nom",
            render: (value: string) => value,
          },
          {
            key: "created_at",
            header: "Créé le",
            render: (value: string) => new Date(value).toLocaleDateString(),
          },
          {
            key: "updated_at",
            header: "Mis à jour le",
            render: (value: string) => new Date(value).toLocaleDateString(),
          },
          {
            key: "actions",
            header: "Actions",
            render: (_value: unknown, client: Client) => (
              <div className="flex items-center space-x-2">
                <Button type="button" variant="secondary" onClick={() => openEditModal(client)} size="sm">
                  Modifier
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
                  Supprimer
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
        title={editingClient ? "Modifier le client" : "Nouveau client"}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50"
              placeholder="Nom du client"
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
            Annuler
          </Button>
          <Button type="button" variant="primary" onClick={handleCreateClient}>
            {editingClient ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </Dialog>

      {/* Bulk Create Clients Dialog */}
      <Dialog
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Création multiple de clients"
        maxWidth="2xl"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">Saisissez un nom de client par ligne.</p>
          <p className="text-xs text-muted-foreground mb-4">Exemple : Client 1</p>
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
            Annuler
          </Button>
          <Button type="button" variant="primary" onClick={handleBulkCreate}>
            Créer les clients
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
        title="Supprimer le client"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">Êtes-vous sûr de vouloir supprimer ce client ?</p>
          {clientToDelete && (
            <div className="text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Nom :</span> {clientToDelete.name}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">Cette action est irréversible.</p>
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
            Annuler
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
        title="Supprimer les clients sélectionnés"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Supprimer {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''} sélectionné{selectedClients.length > 1 ? 's' : ''} ?
          </p>
          <p className="text-xs text-muted-foreground">Cette action est irréversible.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={() => setShowBulkDeleteModal(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              await handleDeleteSelected();
              setShowBulkDeleteModal(false);
            }}
          >
Supprimer la sélection
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
