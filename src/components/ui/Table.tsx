import React from "react";
import Pagination from "./Pagination";

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
  className = "",
  striped = false,
  hoverable = true,
  pagination,
}) => {
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const stickyScrollRef = React.useRef<HTMLDivElement>(null);
  const [showStickyScroll, setShowStickyScroll] = React.useState(false);

  React.useEffect(() => {
    const checkScrollNeeded = () => {
      if (tableScrollRef.current) {
        const hasHorizontalScroll =
          tableScrollRef.current.scrollWidth >
          tableScrollRef.current.clientWidth;
        setShowStickyScroll(hasHorizontalScroll);
      }
    };

    checkScrollNeeded();
    window.addEventListener("resize", checkScrollNeeded);
    return () => window.removeEventListener("resize", checkScrollNeeded);
  }, [data]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (stickyScrollRef.current) {
      stickyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleStickyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <>
      <div
        className={`w-full overflow-hidden border border-border rounded-2xl shadow-sm ${className}`}
      >
        <div
          ref={tableScrollRef}
          className="overflow-x-auto scrollbar-none"
          onScroll={handleTableScroll}
        >
          <table className="w-full divide-y divide-border min-w-max">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-sm font-medium text-foreground/80 tracking-wide
                    ${index === 0 ? "rounded-tl-2xl" : ""}
                    ${index === columns.length - 1 ? "rounded-tr-2xl" : ""}`}
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
                  ${striped && rowIndex % 2 === 1 ? "bg-muted/30" : ""}
                  ${
                    hoverable
                      ? "hover:bg-muted/40 transition-colors duration-200"
                      : ""
                  }
                  ${rowIndex === data.length - 1 ? "last:rounded-b-2xl" : ""}
                `}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm text-foreground/90
                      ${
                        rowIndex === data.length - 1 && colIndex === 0
                          ? "rounded-bl-2xl"
                          : ""
                      }
                      ${
                        rowIndex === data.length - 1 &&
                        colIndex === columns.length - 1
                          ? "rounded-br-2xl"
                          : ""
                      }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
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
              <svg
                className="mx-auto h-14 w-14 mb-4 text-muted-foreground/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-medium text-foreground/70">
                No data available
              </p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                There are no items to display in this table.
              </p>
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

      {/* Sticky horizontal scrollbar - positioned to cover main content area only */}
      {showStickyScroll && (
        <div className="fixed bottom-0 left-64 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/50 shadow-lg">
          <div className="px-4 py-2">
            <div
              ref={stickyScrollRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/60 scrollbar-track-muted/30"
              onScroll={handleStickyScroll}
            >
              <div
                style={{
                  width: tableScrollRef.current?.scrollWidth || "100%",
                  height: "1px",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Table;
