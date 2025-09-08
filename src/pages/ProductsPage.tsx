import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Dialog from "../components/ui/Dialog";
import { PaginatedResponse } from "../types/pagination";

// Simple icon components - exported for use in the component
export const PlusIcon = () => <span>+</span>;
export const TrashIcon = () => <span>🗑️</span>;
export const UploadIcon = () => <span>⬆️</span>;

interface Product {
  id: string;
  designation: string;
  code: string;
  created_at: string;
  updated_at: string;
}

interface CreateProductRequest {
  designation: string;
  code: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [bulkText, setBulkText] = useState<string>("");
  const [formData, setFormData] = useState<CreateProductRequest>({
    designation: "",
    code: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadProducts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await invoke<PaginatedResponse<Product>>("get_products_paginated", {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: debouncedSearchTerm || null
      });
      setProducts(result.data || []);
      setPagination(prev => ({
        ...prev,
        totalItems: result.total,
        totalPages: result.total_pages
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des produits :", error);
      setProducts([]);
      setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  };

  const handleCreateProduct = async (): Promise<void> => {
    try {
      if (editingProduct) {
        await invoke("update_product", {
          request: {
            id: editingProduct.id,
            ...formData,
          },
        });
      } else {
        await invoke("create_product", { request: formData });
      }

      setShowCreateModal(false);
      setEditingProduct(null);
      setFormData({ designation: "", code: "" });
      await loadProducts();
    } catch (error) {
      console.error("Erreur lors de la création/mise à jour du produit :", error);
    }
  };

  const handleBulkCreate = useCallback(async (): Promise<void> => {
    try {
      const productsToCreate = bulkText
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => {
          const parts = line.split("|").map((p: string) => p.trim());
          return {
            designation: parts[0],
            code: parts[1] || "",
          };
        });

      if (productsToCreate.length > 0) {
        await invoke("bulk_create_products", { request: { products: productsToCreate } });
        setShowBulkModal(false);
        setBulkText("");
        await loadProducts();
      }
    } catch (error) {
      console.error("Erreur lors de la création groupée des produits :", error);
    }
  }, [bulkText, loadProducts]);

  const handleDeleteProduct = async (productId: string): Promise<void> => {
    try {
      await invoke("delete_product", { productId });
      await loadProducts();
    } catch (error) {
      console.error("Erreur lors de la suppression du produit :", error);
    }
  };

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedProducts.length === 0) return;
    try {
      await invoke("delete_multiple_products", {
        data: { productIds: selectedProducts },
      } as { data: { productIds: string[] } });
      setSelectedProducts([]);
      await loadProducts();
    } catch (error: any) {
      console.error("Erreur lors de la suppression des produits :", error);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      designation: product.designation,
      code: product.code,
    });
    setShowCreateModal(true);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des produits...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Produits
        </h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des produits..."
            className="w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {selectedProducts.length > 0 && (
            <Button onClick={() => setShowBulkDeleteModal(true)} variant="danger">
              Supprimer la sélection ({selectedProducts.length})
            </Button>
          )}
          <Button onClick={() => setShowBulkModal(true)} variant="secondary">
            Création groupée
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Ajouter un produit
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Table
        columns={[
          {
            key: "select",
            header: (
              <input
                type="checkbox"
                checked={selectedProducts.length > 0 && selectedProducts.length === products.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            ),
            render: (value, product: Product) => {
              void value;
              return (
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              );
            },
          },
          {
            key: "designation",
            header: "Désignation",
            render: (value: string) => value,
          },
          {
            key: "code",
            header: "Code",
            render: (value: string) => value,
          },
          {
            key: "actions",
            header: "Actions",
            render: (value, product: Product) => {
              void value;
              return (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openEditModal(product)}
                    size="sm"
                  >
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setProductToDelete(product);
                      setShowDeleteModal(true);
                    }}
                    size="sm"
                  >
                    Supprimer
                  </Button>
                </div>
              );
            },
          },
        ]}
        data={products}
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

      {/* Create Product Dialog */}
      <Dialog
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingProduct(null);
          setFormData({ designation: "", code: "" });
        }}
        title={editingProduct ? "Modifier le produit" : "Nouveau produit"}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Désignation
            </label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50"
              placeholder="Désignation du produit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50"
              placeholder="Code du produit"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              setEditingProduct(null);
              setFormData({ designation: "", code: "" });
            }}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCreateProduct}
          >
            {editingProduct ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </Dialog>

      {/* Bulk Create Products Dialog */}
      <Dialog
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Création groupée de produits"
        maxWidth="2xl"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Saisissez un produit par ligne. Format : Désignation | Code
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Exemple : Produit 1 | P001
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full px-4 py-3 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50 font-mono text-sm"
            placeholder="Produit 1 | P001\nProduit 2 | P002"
            rows={10}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowBulkModal(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleBulkCreate}
          >
            Créer les produits
          </Button>
        </div>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        title="Supprimer le produit"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Êtes-vous sûr de vouloir supprimer ce produit ?
          </p>
          {productToDelete && (
            <div className="text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Désignation :</span> {productToDelete.designation}
              </div>
              <div>
                <span className="font-medium text-foreground">Code :</span> {productToDelete.code}
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
              setProductToDelete(null);
            }}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (productToDelete) {
                await handleDeleteProduct(productToDelete.id);
                setShowDeleteModal(false);
                setProductToDelete(null);
              }
            }}
          >
            Supprimer
          </Button>
        </div>
      </Dialog>

      {/* Bulk Delete Products Dialog */}
      <Dialog
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Supprimer les produits sélectionnés"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Supprimer {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}?
          </p>
          <p className="text-xs text-muted-foreground">Cette action est irréversible.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowBulkDeleteModal(false)}
          >
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
            Supprimer Selected
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
