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
import * as ExcelJS from 'exceljs';

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
      console.error('Échec du chargement des produits :', error);
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
      console.error('Échec du chargement des rapports :', error);
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

  const exportToExcel = async () => {
    // Create a new workbook using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rapports');

    // Define column headers
    const headers = [
      'N° de rapport',
      'Date de la réclamation',
      'Ligne',
      'Produit',
      'Date de production',
      'Format',
      'Heure',
      'Type',
      'Détails de la description',
      'Équipe',
      'Quantité',
      'Origine de réclamation',
      'Valorisation',
      ...(canViewPerformance ? ['Performance'] : [])
    ];

    // Add headers to the worksheet
    worksheet.addRow(headers);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: '000000' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9EAD3' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    headerRow.height = 25;

    // Add data rows
    reports.forEach(report => {
      const rowData = [
        report.report_number,
        formatDate(report.report_date),
        report.line_name || 'Ligne inconnue',
        report.product_name || 'Produit inconnu',
        formatDate(report.production_date),
        report.format_display || '-',
        report.time || '-',
        report.description_type,
        report.description_details,
        `Équipe ${report.team}`,
        report.quantity,
        report.claim_origin,
        `${parseFloat(report.valuation).toFixed(2).replace('.', ',')} DZD`,
        ...(canViewPerformance ? [report.performance || '-'] : [])
      ];
      worksheet.addRow(rowData);
    });

    // Set column widths
    const columnWidths = [15, 18, 15, 25, 12, 10, 8, 15, 30, 10, 8, 20, 12];
    if (canViewPerformance) columnWidths.push(15);
    
    worksheet.columns.forEach((column, index) => {
      if (columnWidths[index]) {
        column.width = columnWidths[index];
      }
    });

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `rapports_${today}.xlsx`;

    // Write the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
      console.error('Échec de la mise à jour des performances :', error);
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
        <h1 className="text-2xl font-bold text-foreground">Rapports de non-conformité</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Exporter vers Excel
          </Button>
          <Button
            onClick={() => navigate('/reports/new')}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            Nouveau rapport
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            label="Rechercher"
            type="text"
            placeholder="Rechercher des rapports..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
          <Select
            label="Filtrer par produit"
            value={selectedProduct}
            onChange={(value) => {
              console.debug('[Reports] product selected:', value, 'type:', typeof value);
              setSelectedProduct(value);
              console.debug('[Reports] selectedProduct state after set:', selectedProduct);
              handleFilterChange();
            }}
            options={[
              { value: '', label: 'Tous les produits' },
              ...products.map((product) => ({
                value: product.id,
                label: product.code ? `${product.designation} (${product.code})` : product.designation
              }))
            ]}
          />
          <DatePicker
            label="Date de début"
            value={startDate}
            onChange={(value) => {
              console.debug('[Reports] start date selected:', value, 'type:', typeof value);
              const hasEnd = !!endDate;
              if (hasEnd && value && value > endDate) {
                // Keep the selected start date; adjust end date to match
                addToast('Date de fin ajustée pour maintenir une plage valide.', 'warning', 3000);
                setStartDate(value);
                setEndDate(value);
              } else {
                setStartDate(value);
              }
              console.debug('[Reports] startDate state after set:', startDate);
              handleFilterChange();
            }}
            placeholder="Sélectionner une date de début"
            maxDate={endDate && endDate < todayStr ? endDate : todayStr}
          />
          <DatePicker
            label="Date de fin"
            value={endDate}
            onChange={(value) => {
              console.debug('[Reports] end date selected:', value, 'type:', typeof value);
              const hasStart = !!startDate;
              if (hasStart && value && value < startDate) {
                // Keep the selected end date; adjust start date to match
                addToast('Date de début ajustée pour maintenir une plage valide.', 'warning', 3000);
                setStartDate(value);
                setEndDate(value);
              } else {
                setEndDate(value);
              }
              console.debug('[Reports] endDate state after set:', endDate);
              handleFilterChange();
            }}
            placeholder="Sélectionner une date de fin"
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
            Réinitialiser les filtres
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
            <p className="text-lg font-medium">Aucun rapport trouvé</p>
            <p className="text-sm">
              {selectedProduct || startDate || endDate || search 
                ? "Essayez d'ajuster vos filtres ou termes de recherche" 
                : "Aucun rapport n'a été créé pour le moment"}
            </p>
          </div>
        </div>
      ) : (
        <Table
          columns={[
          {
            key: 'report_number',
            header: 'N° de rapport',
            render: (value) => <span className="font-medium">{value}</span>
          },
          {
            key: 'report_date',
            header: 'Date de la réclamation',
            render: (value) => formatDate(value)
          },
          {
            key: 'line_name',
            header: 'Ligne',
            render: (value) => value || 'Ligne inconnue'
          },
          {
            key: 'product_name',
            header: 'Produit',
            render: (value) => value || 'Produit inconnu'
          },
          {
            key: 'production_date',
            header: 'Date de production',
            render: (value) => formatDate(value)
          },
          {
            key: 'format_display',
            header: 'Format',
            render: (value) => value || '-'
          },
          {
            key: 'team',
            header: 'Équipe',
            render: (value) => `Team ${value}`
          },
          {
            key: 'time',
            header: 'Heure',
            render: (value) => value || '-'
          },
          {
            key: 'description_type',
            header: 'Type'
          },
          {
            key: 'description_details',
            header: 'Détails de la description',
            render: (value) => (
              <span className="max-w-xs truncate block" title={value}>
                {value || '-'}
              </span>
            )
          },
          {
            key: 'quantity',
            header: 'Quantité'
          },
          {
            key: 'claim_origin',
            header: 'Origine'
          },
          {
            key: 'valuation',
            header: 'Évaluation',
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
                    Modifier
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
            <p className="text-sm font-medium">Chargement des rapports...</p>
          </div>
        </div>
      )}

      {/* Edit Performance Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modifier la performance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rapport : {editingReport?.report_number}
            </label>
            <textarea
              value={editPerformance}
              onChange={(e) => setEditPerformance(e.target.value)}
              placeholder="Saisissez les détails de performance..."
              className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={editLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSavePerformance}
              disabled={editLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};