import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";

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
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setBulkModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Form states
  const [formData, setFormData] = useState<CreateProductRequest>({
    designation: "",
    code: "",
  });
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await invoke<Product[]>("get_products");
      setProducts(result);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
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
      loadProducts();
    } catch (error) {
      console.error("Error creating/updating product:", error);
    }
  };

  const handleBulkCreate = async () => {
    try {
      const products = bulkText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const parts = line.split("|").map((p) => p.trim());
          return {
            designation: parts[0],
            code: parts[1] || "",
          };
        });

      if (products.length > 0) {
        await invoke("bulk_create_products", { request: { products } });
        setBulkModal(false);
        setBulkText("");
        loadProducts();
      }
    } catch (error) {
      console.error("Error bulk creating products:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await invoke("delete_product", { productId });
        loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (
      selectedProducts.length > 0 &&
      confirm(`Delete ${selectedProducts.length} selected products?`)
    ) {
      try {
        await invoke("delete_multiple_products", {
          productIds: selectedProducts,
        });
        setSelectedProducts([]);
        loadProducts();
      } catch (error) {
        console.error("Error deleting products:", error);
      }
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
        <h1 className="text-2xl font-bold text-notion-gray-900 dark:text-notion-gray-900">
          Products Management
        </h1>
        <div className="flex space-x-2">
          {selectedProducts.length > 0 && (
            <Button onClick={handleDeleteSelected} variant="danger">
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
          <Button onClick={() => setBulkModal(true)} variant="secondary">
            Bulk Create
          </Button>
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
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
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProducts(products.map((product) => product.id));
                  } else {
                    setSelectedProducts([]);
                  }
                }}
                checked={
                  selectedProducts.length === products.length &&
                  products.length > 0
                }
              />
            ) as any,
            width: "50px",
            render: (_, product) => (
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.id)}
                onChange={() => toggleProductSelection(product.id)}
              />
            ),
          },
          {
            key: "designation",
            header: "Designation",
            render: (value) => <span className="font-medium">{value}</span>,
          },
          {
            key: "code",
            header: "Code",
          },
          {
            key: "created_at",
            header: "Created",
            render: (value) => new Date(value).toLocaleDateString(),
          },
          {
            key: "actions",
            header: "Actions",
            render: (_, product) => (
              <div className="space-x-2">
                <button
                  onClick={() => openEditModal(product)}
                  className="text-notion-blue hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        data={products}
        hoverable={true}
      />

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-notion-gray-200 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "Edit Product" : "Create New Product"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-notion-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-notion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
                  placeholder="Product designation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-notion-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-notion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
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
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-notion-gray-200 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Bulk Create Products</h2>
            <div className="mb-4">
              <p className="text-sm text-notion-gray-600 mb-2">
                Enter one product per row. Format: Designation | Code
              </p>
              <p className="text-xs text-notion-gray-500 mb-4">
                Example: Product A | PA001
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full px-3 py-2 border border-notion-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-blue"
                placeholder="Product A | PA001&#10;Product B | PB002"
                rows={10}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setBulkModal(false);
                  setBulkText("");
                }}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
