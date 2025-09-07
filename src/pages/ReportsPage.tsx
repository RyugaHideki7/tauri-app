import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';

interface NonConformityReport {
  id: string;
  report_number: string;
  report_date: string;
  line_id: string;
  product_id: string;
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
}

interface PaginatedResponse {
  data: NonConformityReport[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<NonConformityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadReports();
  }, [page, search]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await invoke<PaginatedResponse>('get_reports_paginated', {
        page,
        limit,
        search: search.trim() || null,
      });
      
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
    }
  };

  const canViewPerformance = user?.role === 'performance' || user?.role === 'admin';

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">Non-Conformity Reports</h1>
        <Button
          onClick={() => navigate('/reports/new')}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          Create New Report
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search reports by number or description..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          className="w-full sm:max-w-md"
        />
      </div>

      {/* Reports Table */}
      <Table
        columns={[
          {
            key: 'report_number',
            header: 'Report Number',
            render: (value) => <span className="font-medium">{value}</span>
          },
          {
            key: 'production_date',
            header: 'Date',
            render: (value) => formatDate(value)
          },
          {
            key: 'product_name',
            header: 'Product',
            render: (value) => value || 'Unknown Product'
          },
          {
            key: 'description_type',
            header: 'Type'
          },
          {
            key: 'team',
            header: 'Team',
            render: (value) => `Team ${value}`
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
            render: (value: string) => (
              <span className="max-w-xs truncate block">
                {value || '-'}
              </span>
            )
          }] : []),
          {
            key: 'status',
            header: 'Status',
            render: (value) => (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
                {value.replace('_', ' ')}
              </span>
            )
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (value) => formatDateTime(value)
          }
        ]}
        data={loading ? [] : reports}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          onPageChange: setPage,
          showItemsPerPage: false
        }}
      />
      
      {loading && (
        <div className="text-center py-16">
          <div className="text-muted-foreground">
            <p className="text-sm font-medium">Loading reports...</p>
          </div>
        </div>
      )}
    </div>
  );
};