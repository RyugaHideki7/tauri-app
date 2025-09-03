import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Dialog from "../components/ui/Dialog";

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
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [bulkText, setBulkText] = useState<string>("");
  const [formData, setFormData] = useState<CreateProductRequest>({
    designation: "",
    code: "",
  });

  const filteredProducts = products.filter(
    (product: Product) =>
      product.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadProducts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await invoke<Product[]>("get_products");
      setProducts(result || []);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
      console.error("Error creating/updating product:", error);
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
      console.error("Error bulk creating products:", error);
    }
  }, [bulkText, loadProducts]);

  const handleDeleteProduct = async (productId: string): Promise<void> => {
    try {
      await invoke("delete_product", { productId });
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
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
      console.error("Error deleting products:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Produits
        </h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {selectedProducts.length > 0 && (
            <Button onClick={() => setShowBulkDeleteModal(true)} variant="danger">
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
          <Button onClick={() => setShowBulkModal(true)} variant="secondary">
            Bulk Create
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            Add Product
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
                checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProducts(filteredProducts.map(p => p.id));
                  } else {
                    setSelectedProducts([]);
                  }
                }}
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
            header: "Designation",
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
                    Edit
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
                    Delete
                  </Button>
                </div>
              );
            },
          },
        ]}
        data={filteredProducts}
      />

      {/* Create Product Dialog */}
      <Dialog
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingProduct(null);
          setFormData({ designation: "", code: "" });
        }}
        title={editingProduct ? "Edit Product" : "Create New Product"}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Designation
            </label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50"
              placeholder="Product designation"
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
              placeholder="Product code"
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
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCreateProduct}
          >
            {editingProduct ? "Update" : "Create"}
          </Button>
        </div>
      </Dialog>

      {/* Bulk Create Products Dialog */}
      <Dialog
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Create Products"
        maxWidth="2xl"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Enter one product per line. Format: Designation | Code
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Example: Product 1 | P001
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full px-4 py-3 bg-background/50 dark:bg-background/70 border border-border/50 dark:border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50 font-mono text-sm"
            placeholder="Product 1 | P001\nProduct 2 | P002"
            rows={10}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowBulkModal(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleBulkCreate}
          >
            Create Products
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
        title="Delete Product"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Are you sure you want to delete this product?
          </p>
          {productToDelete && (
            <div className="text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Designation:</span> {productToDelete.designation}
              </div>
              <div>
                <span className="font-medium text-foreground">Code:</span> {productToDelete.code}
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
              setProductToDelete(null);
            }}
          >
            Cancel
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
            Delete
          </Button>
        </div>
      </Dialog>

      {/* Bulk Delete Products Dialog */}
      <Dialog
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Delete Selected Products"
        maxWidth="md"
      >
        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Delete {selectedProducts.length} selected {selectedProducts.length === 1 ? 'product' : 'products'}?
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

export default ProductsPage;
