import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DatePicker from '../components/ui/DatePicker';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import * as XLSX from 'xlsx';

interface NonConformityReport {
  id: string;
  report_number: string;
  report_date: string;
  line_id: string;
  line_name?: string;
  product_id: string;
  format_id?: number;
  production_date: string;
  team: string;
  time: string;
  description_type: string;
  description_details: string;
  quantity: number;
  claim_origin: string;
  valuation: string; // Decimal serializes as string from Rust
  performance?: string;
  status: string;
  reported_by: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  format_display?: string;
}

interface PaginatedResponse {
  data: NonConformityReport[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface Product {
  id: string;
  designation: string;
  code?: string;
}


export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];
  const [reports, setReports] = useState<NonConformityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<NonConformityReport | null>(null);
  const [editPerformance, setEditPerformance] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    // Debug current filters
    console.debug('[Reports] loadReports with', { page, itemsPerPage, search, selectedProduct, startDate, endDate });
    loadReports();
  }, [page, search, selectedProduct, startDate, endDate, itemsPerPage]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await invoke<Product[]>('get_products');
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  // Debug effect for filter state changes (post-setState values)
  useEffect(() => {
    console.debug('[Reports] Filter state changed ->', {
      selectedProduct,
      startDate,
      endDate,
      search,
      page,
      itemsPerPage,
    });
  }, [selectedProduct, startDate, endDate, search, page, itemsPerPage]);

  const loadReports = async () => {
    setLoading(true);
    try {
      console.debug('[Reports] Raw filter values:', {
        search: `"${search}"`,
        selectedProduct: `"${selectedProduct}"`,
        startDate: `"${startDate}"`,
        endDate: `"${endDate}"`
      });
      const payload = {
        page,
        limit: itemsPerPage,
        search: search.trim() || null,
        // Send both casings to diagnose mapping behavior
        product_id: selectedProduct || null,
        productId: selectedProduct || null,
        start_date: startDate || null,
        startDate: startDate || null,
        end_date: endDate || null,
        endDate: endDate || null,
      };
      console.debug('[Reports] Final payload being sent:', JSON.stringify(payload, null, 2));
      const response = await invoke<PaginatedResponse>('get_reports_paginated', payload);
      
      setReports(response.data);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = () => {
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setSelectedProduct('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const exportToExcel = () => {
    const exportData = reports.map(report => ({
      'Report Number': report.report_number,
      'Report Date': formatDate(report.report_date),
      'Production Date': formatDate(report.production_date),
      'Product': report.product_name || 'Unknown Product',
      'Format': report.format_display || '-',
      'Time': report.time || '-',
      'Description Type': report.description_type,
      'Description Details': report.description_details,
      'Team': `Team ${report.team}`,
      'Quantity': report.quantity,
      'Claim Origin': report.claim_origin,
      'Valuation': `${parseFloat(report.valuation).toFixed(2)} DZD`,
      ...(canViewPerformance && { 'Performance': report.performance || '-' }),
      'Status': report.status.replace('_', ' '),
      'Created': formatDateTime(report.created_at)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    XLSX.writeFile(wb, `reports_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleEditPerformance = (report: NonConformityReport) => {
    setEditingReport(report);
    setEditPerformance(report.performance || '');
    setEditModalOpen(true);
  };

  const handleSavePerformance = async () => {
    if (!editingReport) return;

    setEditLoading(true);
    try {
      await invoke('update_report_performance', {
        reportId: editingReport.id,
        performance: editPerformance
      });
      
      // Update the report in the local state
      setReports(prev => prev.map(report => 
        report.id === editingReport.id 
          ? { ...report, performance: editPerformance }
          : report
      ));
      
      setEditModalOpen(false);
      setEditingReport(null);
      setEditPerformance('');
    } catch (error) {
      console.error('Failed to update performance:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // ============================================
  // KEPT FOR REFERENCE - NOT CURRENTLY USED
  // Status color mapping function for report status indicators
  // Uncomment if status column is re-added to the table
  // ============================================
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'open':
  //       return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  //     case 'in_progress':
  //       return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  //     case 'resolved':
  //       return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  //     case 'closed':
  //       return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  //     default:
  //       return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
  //   }
  // };

  const canViewPerformance = user?.role === 'performance' || user?.role === 'admin';
  const canEditPerformance = user?.role === 'performance' || user?.role === 'admin';

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">Non-Conformity Reports</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Export to Excel
          </Button>
          <Button
            onClick={() => navigate('/reports/new')}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            Create New Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            label="Search"
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
          <Select
            label="Filter by Product"
            value={selectedProduct}
            onChange={(value) => {
              console.debug('[Reports] product selected:', value, 'type:', typeof value);
              setSelectedProduct(value);
              console.debug('[Reports] selectedProduct state after set:', selectedProduct);
              handleFilterChange();
            }}
            options={[
              { value: '', label: 'All Products' },
              ...products.map((product) => ({
                value: product.id,
                label: product.code ? `${product.designation} (${product.code})` : product.designation
              }))
            ]}
          />
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(value) => {
              console.debug('[Reports] start date selected:', value, 'type:', typeof value);
              const hasEnd = !!endDate;
              if (hasEnd && value && value > endDate) {
                // Keep the selected start date; adjust end date to match
                addToast('Adjusted end date to keep a valid range.', 'warning', 3000);
                setStartDate(value);
                setEndDate(value);
              } else {
                setStartDate(value);
              }
              console.debug('[Reports] startDate state after set:', startDate);
              handleFilterChange();
            }}
            placeholder="Select start date"
            maxDate={endDate && endDate < todayStr ? endDate : todayStr}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(value) => {
              console.debug('[Reports] end date selected:', value, 'type:', typeof value);
              const hasStart = !!startDate;
              if (hasStart && value && value < startDate) {
                // Keep the selected end date; adjust start date to match
                addToast('Adjusted start date to keep a valid range.', 'warning', 3000);
                setStartDate(value);
                setEndDate(value);
              } else {
                setEndDate(value);
              }
              console.debug('[Reports] endDate state after set:', endDate);
              handleFilterChange();
            }}
            placeholder="Select end date"
            minDate={startDate || undefined}
            maxDate={todayStr}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      {reports.length === 0 && !loading ? (
        <div className="text-center py-16 border border-border rounded-lg bg-background">
          <div className="text-muted-foreground">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No reports found</p>
            <p className="text-sm">
              {selectedProduct || startDate || endDate || search 
                ? "Try adjusting your filters or search terms" 
                : "No reports have been created yet"}
            </p>
          </div>
        </div>
      ) : (
        <Table
          columns={[
          {
            key: 'report_number',
            header: 'Report Number',
            render: (value) => <span className="font-medium">{value}</span>
          },
          {
            key: 'report_date',
            header: 'Report Date',
            render: (value) => formatDate(value)
          },
          {
            key: 'line_name',
            header: 'Line',
            render: (value) => value || 'Unknown Line'
          },
          {
            key: 'product_name',
            header: 'Product',
            render: (value) => value || 'Unknown Product'
          },
          {
            key: 'production_date',
            header: 'Production Date',
            render: (value) => formatDate(value)
          },
          {
            key: 'format_display',
            header: 'Format',
            render: (value) => value || '-'
          },
          {
            key: 'team',
            header: 'Team',
            render: (value) => `Team ${value}`
          },
          {
            key: 'time',
            header: 'Time',
            render: (value) => value || '-'
          },
          {
            key: 'description_type',
            header: 'Type'
          },
          {
            key: 'description_details',
            header: 'Description Details',
            render: (value) => (
              <span className="max-w-xs truncate block" title={value}>
                {value || '-'}
              </span>
            )
          },
          {
            key: 'quantity',
            header: 'Quantity'
          },
          {
            key: 'claim_origin',
            header: 'Origin'
          },
          {
            key: 'valuation',
            header: 'Valuation',
            render: (value) => `${parseFloat(value).toFixed(2)} DZD`
          },
          ...(canViewPerformance ? [{
            key: 'performance',
            header: 'Performance',
            render: (value: string, row: NonConformityReport) => (
              <div className="flex items-center gap-2">
                <span className="max-w-xs truncate block">
                  {value || '-'}
                </span>
                {canEditPerformance && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPerformance(row)}
                    className="h-6 px-2 text-xs"
                  >
                    Edit
                  </Button>
                )}
              </div>
            )
          }] : [])
        ]}
        data={loading ? [] : reports}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: itemsPerPage,
          onPageChange: setPage,
          onItemsPerPageChange: setItemsPerPage,
          showItemsPerPage: true
        }}
        />
      )}
      
      {loading && (
        <div className="text-center py-16">
          <div className="text-muted-foreground">
            <p className="text-sm font-medium">Loading reports...</p>
          </div>
        </div>
      )}

      {/* Edit Performance Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Performance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report: {editingReport?.report_number}
            </label>
            <textarea
              value={editPerformance}
              onChange={(e) => setEditPerformance(e.target.value)}
              placeholder="Enter performance details..."
              className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePerformance}
              disabled={editLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};