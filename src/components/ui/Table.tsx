import React from 'react';
import Pagination from './Pagination';

interface Column {
  key: string;
  header: React.ReactNode;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  // Pagination props
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    showItemsPerPage?: boolean;
  };
}

const Table: React.FC<TableProps> = ({ 
  columns, 
  data, 
  className = '',
  striped = false,
  hoverable = true,
  pagination
}) => {
  return (
    <div className={`overflow-hidden border border-border rounded-2xl shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-sm font-medium text-foreground/80 tracking-wide
                    ${index === 0 ? 'rounded-tl-2xl' : ''}
                    ${index === columns.length - 1 ? 'rounded-tr-2xl' : ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border/50">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  ${striped && rowIndex % 2 === 1 ? 'bg-muted/30' : ''}
                  ${hoverable ? 'hover:bg-muted/40 transition-colors duration-200' : ''}
                  ${rowIndex === data.length - 1 ? 'last:rounded-b-2xl' : ''}
                `}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-foreground/90
                      ${rowIndex === data.length - 1 && colIndex === 0 ? 'rounded-bl-2xl' : ''}
                      ${rowIndex === data.length - 1 && colIndex === columns.length - 1 ? 'rounded-br-2xl' : ''}`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-b-2xl">
          <div className="text-muted-foreground">
            <svg className="mx-auto h-14 w-14 mb-4 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-foreground/70">No data available</p>
            <p className="text-xs mt-1 text-muted-foreground/60">There are no items to display in this table.</p>
          </div>
        </div>
      )}
      
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
          onItemsPerPageChange={pagination.onItemsPerPageChange}
          showItemsPerPage={pagination.showItemsPerPage}
        />
      )}
    </div>
  );
};

export default Table;