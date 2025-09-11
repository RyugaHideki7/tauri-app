import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchableSelect from '../components/ui/SearchableSelect';
import DatePicker from '../components/ui/DatePicker';
import IntuitiveTimePicker from '../components/ui/IntuitiveTimePicker';
import Table from '../components/ui/Table';
import Dialog from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
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
  claim_origin_detail?: string;
  claim_origin_client_id?: string;
  claim_origin_manual?: string;
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

interface ProductionLine {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Format {
  id: number;
  format_index: number;
  format_unit: string;
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
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [selectedLine, setSelectedLine] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Edit modal states
  const [editingReport, setEditingReport] = useState<NonConformityReport | null>(null);
  
  // Full edit modal states
  const [fullEditModalOpen, setFullEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<NonConformityReport>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editLines, setEditLines] = useState<ProductionLine[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);

  useEffect(() => {
    // Debug current filters
    console.debug('[Reports] loadReports with', { page, itemsPerPage, search, selectedProduct, selectedLine, startDate, endDate });
    loadReports();
  }, [page, search, selectedProduct, selectedLine, startDate, endDate, itemsPerPage]);

  useEffect(() => {
    loadProducts();
    loadLines();
    loadEditData();
  }, []);

  const loadEditData = async () => {
    try {
      const [linesData, formatsData] = await Promise.all([
        invoke<ProductionLine[]>('get_lines'),
        invoke<Format[]>('get_formats')
      ]);
      setEditLines(linesData);
      setFormats(formatsData);
    } catch (error) {
      console.error('Failed to load edit data:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await invoke<Product[]>('get_products');
      setProducts(productsData);
    } catch (error) {
      console.error('Échec du chargement des produits :', error);
    }
  };

  const loadLines = async () => {
    try {
      const linesData = await invoke<ProductionLine[]>('get_lines');
      setLines(linesData);
    } catch (error) {
      console.error('Échec du chargement des lignes :', error);
    }
  };

  // Debug effect for filter state changes (post-setState values)
  useEffect(() => {
    console.debug('[Reports] Filter state changed ->', {
      selectedProduct,
      selectedLine,
      startDate,
      endDate,
      search,
      page,
      itemsPerPage,
    });
  }, [selectedProduct, selectedLine, startDate, endDate, search, page, itemsPerPage]);

  const loadReports = async () => {
    setLoading(true);
    try {
      console.debug('[Reports] Raw filter values:', {
        search: `"${search}"`,
        selectedProduct: `"${selectedProduct}"`,
        selectedLine: `"${selectedLine}"`,
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
        line_id: selectedLine || null,
        lineId: selectedLine || null,
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
    setSelectedLine('');
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
      'Description de la NC',
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


  const handleFullEdit = (report: NonConformityReport) => {
    setEditingReport(report);
    setEditFormData({
      ...report,
      production_date: report.production_date.split('T')[0],
      report_date: report.report_date.split('T')[0]
    });
    setEditErrors({});
    setFullEditModalOpen(true);
  };

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (editErrors[field]) {
      setEditErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!editFormData.line_id) newErrors.line_id = 'La ligne de production est requise';
    if (!editFormData.product_id) newErrors.product_id = 'Le produit est requis';
    if (!editFormData.format_id) newErrors.format_id = 'Le format est requis';
    if (!editFormData.report_date) newErrors.report_date = 'La date de la réclamation est requise';
    if (!editFormData.production_date) newErrors.production_date = 'La date de production est requise';
    if (!editFormData.team) newErrors.team = "L'équipe est requise";
    if (!editFormData.time) newErrors.time = "L'heure est requise";
    if (!editFormData.description_type) newErrors.description_type = 'Le type de description est requis';
    if (!editFormData.description_details?.trim()) newErrors.description_details = 'Veuillez fournir des détails de description';
    if (!editFormData.quantity || editFormData.quantity <= 0) newErrors.quantity = 'La quantité doit être supérieure à 0';
    if (editFormData.valuation === undefined || (typeof editFormData.valuation === 'number' && editFormData.valuation < 0)) newErrors.valuation = 'La valorisation ne peut pas être négative';
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveFullEdit = async () => {
    if (!editingReport || !validateEditForm()) return;

    setLoading(true);
    try {
      await invoke('update_report', {
        report_id: editingReport.id,
        // Also send camelCase variant to be compatible with different backend expectations
        reportId: editingReport.id,
        request: {
          line_id: editFormData.line_id,
          product_id: editFormData.product_id,
          format_id: editFormData.format_id ? parseInt(editFormData.format_id.toString(), 10) : null,
          report_date: editFormData.report_date,
          production_date: editFormData.production_date,
          team: editFormData.team,
          time: ((editFormData.time || '').trim().slice(0, 5)),
          description_type: editFormData.description_type,
          description_details: editFormData.description_details,
          quantity: parseInt(editFormData.quantity?.toString() || '0', 10),
          claim_origin: editFormData.claim_origin,
          valuation: typeof editFormData.valuation === 'string' ? parseFloat(editFormData.valuation) : editFormData.valuation,
          performance: editFormData.performance
        }
      });
      
      // Reload reports to get updated data
      await loadReports();
      
      setFullEditModalOpen(false);
      setEditingReport(null);
      setEditFormData({});
      addToast('Rapport mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Échec de la mise à jour du rapport :', error);
      addToast('Échec de la mise à jour du rapport', 'error');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
  const canFullEdit = user?.role === 'performance' || user?.role === 'admin';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Input
            label="Rechercher"
            type="text"
            placeholder="Rechercher des rapports..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
          <SearchableSelect
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
            searchPlaceholder="Rechercher un produit..."
          />
          <SearchableSelect
            label="Filtrer par ligne"
            value={selectedLine}
            onChange={(value) => {
              console.debug('[Reports] line selected:', value, 'type:', typeof value);
              setSelectedLine(value);
              console.debug('[Reports] selectedLine state after set:', selectedLine);
              handleFilterChange();
            }}
            options={[
              { value: '', label: 'Toutes les lignes' },
              ...lines.map((line) => ({
                value: line.id,
                label: line.name
              }))
            ]}
            searchPlaceholder="Rechercher une ligne..."
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
              {selectedProduct || selectedLine || startDate || endDate || search 
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
            header: 'Description de la NC'
          },
          {
            key: 'quantity',
            header: 'Quantité'
          },
          {
            key: 'claim_origin',
            header: 'Origine de la réclamation',
            render: (value) => {
              const originMap: Record<string, string> = {
                'site01': 'Site 01',
                'site02': 'Site 02',
                'Réclamation client': 'Réclamation client',
                'Retour client': 'Retour client'
              };
              return originMap[value] || value || '-';
            }
          },
          {
            key: 'claim_origin_detail',
            header: 'Détail de l\'origine',
            render: (value, row) => {
              // For site01/site02, show the role name as detail
              if (['site01', 'site02'].includes(row.claim_origin)) {
                return row.claim_origin === 'site01' ? 'Site 01' : 'Site 02';
              }
              // For client claims, show the client details if available
              if (['Réclamation client', 'Retour client'].includes(row.claim_origin)) {
                return value || '-';
              }
              return '-';
            }
          },
          {
            key: 'description_details',
            header: 'Détails complémentaires',
            render: (value) => (
              <span className="max-w-xs truncate block" title={value}>
                {value || '-'}
              </span>
            )
          },
          ...(user?.role === 'performance' || user?.role === 'admin' ? [{
            key: 'valuation',
            header: 'Valorisation',
            render: (value: string) => `${parseFloat(value).toFixed(2)} DZD`
          }] : []),
          ...(canViewPerformance ? [{
            key: 'performance',
            header: 'Performance',
            render: (value: string) => (
              <div className="flex items-center gap-2">
                <span className="max-w-xs truncate block">
                  {value || '-'}
                </span>
              </div>
            )
          }] : []),
          ...(canFullEdit ? [{
            key: 'actions',
            header: 'Actions',
            render: (_value: any, row: NonConformityReport) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => handleFullEdit(row)}
                  className="h-12 w-12 p-2.5 flex items-center justify-center rounded-full bg-primary/5 hover:bg-primary/20 text-primary hover:scale-105 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-all duration-200"
                  title="Modifier le rapport"
                  aria-label="Modifier le rapport"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span className="sr-only">Modifier</span>
                </Button>
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


      {/* Full Edit Modal */}
      <Dialog
        isOpen={fullEditModalOpen}
        onClose={() => setFullEditModalOpen(false)}
        title="Modifier le rapport complet"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg border border-border/50 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-foreground">Modification du rapport : {editingReport?.report_number}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Vous pouvez modifier tous les champs de ce rapport. Les modifications seront sauvegardées immédiatement.
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Line */}
            <div>
              <Select
                label="Ligne de production *"
                value={editFormData.line_id || ''}
                onChange={(value) => handleEditInputChange('line_id', value)}
                options={[
                  { value: '', label: 'Sélectionnez une ligne' },
                  ...editLines.map(line => ({ value: line.id, label: line.name }))
                ]}
                error={editErrors.line_id}
              />
            </div>

            {/* Product */}
            <div>
              <Select
                label="Produit *"
                value={editFormData.product_id || ''}
                onChange={(value) => handleEditInputChange('product_id', value)}
                options={[
                  { value: '', label: 'Sélectionnez un produit' },
                  ...products.map(product => ({ 
                    value: product.id, 
                    label: product.code ? `${product.designation} (${product.code})` : product.designation 
                  }))
                ]}
                error={editErrors.product_id}
              />
            </div>

            {/* Format */}
            <div>
              <Select
                label="Format *"
                value={editFormData.format_id?.toString() || ''}
                onChange={(value) => handleEditInputChange('format_id', value ? parseInt(value) : undefined)}
                options={[
                  { value: '', label: 'Sélectionnez un format' },
                  ...formats.map(format => ({ 
                    value: format.id.toString(), 
                    label: `${format.format_index} ${format.format_unit}` 
                  }))
                ]}
                error={editErrors.format_id}
              />
            </div>

            {/* Report Date */}
            <div>
              <DatePicker
                label="Date de la réclamation *"
                value={editFormData.report_date || ''}
                onChange={(value) => handleEditInputChange('report_date', value)}
                error={editErrors.report_date}
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Production Date */}
            <div>
              <DatePicker
                label="Date de production *"
                value={editFormData.production_date || ''}
                onChange={(value) => handleEditInputChange('production_date', value)}
                error={editErrors.production_date}
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Team */}
            <div>
              <Select
                label="Équipe *"
                value={editFormData.team || ''}
                onChange={(value) => handleEditInputChange('team', value)}
                options={[
                  { value: 'A', label: 'Équipe A' },
                  { value: 'B', label: 'Équipe B' },
                  { value: 'C', label: 'Équipe C' }
                ]}
                error={editErrors.team}
              />
            </div>

            {/* Time */}
            <div>
              <IntuitiveTimePicker
                label="Heure *"
                value={editFormData.time || ''}
                onChange={(value) => handleEditInputChange('time', value)}
                error={editErrors.time}
                format="24"
              />
            </div>

            {/* Description Type */}
            <div>
              <Select
                label="Description de la NC *"
                value={editFormData.description_type || ''}
                onChange={(value) => handleEditInputChange('description_type', value)}
                options={[
                  { value: 'Physique', label: 'Physique' },
                  { value: 'Chimique', label: 'Chimique' },
                  { value: 'Biologique', label: 'Biologique' },
                  { value: 'Process', label: 'Process' }
                ]}
                error={editErrors.description_type}
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantité *</label>
              <Input
                type="number"
                min="1"
                value={editFormData.quantity?.toString() || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEditInputChange('quantity', parseInt(e.target.value) || 0)}
                error={editErrors.quantity}
              />
            </div>

            {/* Claim Origin */}
            <div>
              <Select
                label="Origine de la réclamation *"
                value={editFormData.claim_origin || ''}
                onChange={(value) => handleEditInputChange('claim_origin', value)}
                options={[
                  { value: 'client', label: 'Client' },
                  { value: 'site01', label: 'Site 01' },
                  { value: 'site02', label: 'Site 02' },
                  { value: 'consommateur', label: 'Consommateur' }
                ]}
                error={editErrors.claim_origin}
                disabled={true}
              />
            </div>

            {/* Valuation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Valorisation (DZD) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editFormData.valuation?.toString() || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEditInputChange('valuation', parseFloat(e.target.value) || 0)}
                error={editErrors.valuation}
              />
            </div>
          </div>

          {/* Description Details */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Détails de la description *</label>
            <textarea
              value={editFormData.description_details || ''}
              onChange={(e) => handleEditInputChange('description_details', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Détails de la non-conformité..."
            />
            {editErrors.description_details && <p className="text-destructive text-sm mt-1">{editErrors.description_details}</p>}
          </div>

          {/* Performance */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Performance</label>
            <textarea
              value={editFormData.performance || ''}
              onChange={(e) => handleEditInputChange('performance', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Notes de performance..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setFullEditModalOpen(false)}
              disabled={loading}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveFullEdit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};