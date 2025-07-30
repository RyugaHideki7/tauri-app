import React from 'react';

interface Column {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

const Table: React.FC<TableProps> = ({ 
  columns, 
  data, 
  className = '',
  striped = false,
  hoverable = true
}) => {
  return (
    <div className={`overflow-hidden rounded-lg border border-notion-gray-300 dark:border-notion-gray-400 ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-notion-gray-300 dark:divide-notion-gray-400">
          <thead className="bg-notion-gray-200 dark:bg-notion-gray-300">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-notion-gray-700 dark:text-notion-gray-700 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-notion-gray-200 divide-y divide-notion-gray-200 dark:divide-notion-gray-300">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  ${striped && rowIndex % 2 === 1 ? 'bg-notion-gray-100 dark:bg-notion-gray-250' : ''}
                  ${hoverable ? 'hover:bg-notion-gray-100 dark:hover:bg-notion-gray-250 transition-colors duration-150' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm text-notion-gray-900 dark:text-notion-gray-900"
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
        <div className="text-center py-12">
          <div className="text-notion-gray-500 dark:text-notion-gray-500">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">No data available</p>
            <p className="text-xs mt-1">There are no items to display in this table.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;