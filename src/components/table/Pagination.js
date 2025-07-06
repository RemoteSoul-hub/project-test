import styles from '@/styles/table.module.css';

/**
 * Pagination Component
 * 
 * This component renders a responsive pagination control for tables.
 * It adapts to different screen sizes and provides a user-friendly interface
 * for navigating through multiple pages of data.
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current active page
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Function to call when page changes
 * @param {number} props.totalItems - Optional total number of items
 * @param {number} props.pageSize - Optional items per page
 */
export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  totalItems,
  pageSize
}) {
  // Ensure currentPage and totalPages are valid numbers
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const validTotalPages = Math.max(1, totalPages);

  // Calculate visible page numbers
  const getVisiblePageNumbers = () => {
    if (validTotalPages <= 5) {
      return Array.from({ length: validTotalPages }, (_, i) => i + 1);
    }

    if (validCurrentPage <= 3) {
      return [1, 2, 3, 4, '...', validTotalPages];
    }

    if (validCurrentPage >= validTotalPages - 2) {
      return [1, '...', validTotalPages - 3, validTotalPages - 2, validTotalPages - 1, validTotalPages];
    }

    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', validTotalPages];
  };

  const visiblePageNumbers = getVisiblePageNumbers();

  if (validTotalPages <= 1) return null;

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 px-2 ${styles.paginationContainer}`}>
      {/* Page info - hidden on very small screens */}
      {totalItems && pageSize && (
        <div className="text-sm text-gray-500 hidden sm:block">
          Showing {Math.min((validCurrentPage - 1) * pageSize + 1, totalItems)} to {Math.min(validCurrentPage * pageSize, totalItems)} of {totalItems} entries
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Previous button */}
        <button
          disabled={validCurrentPage === 1}
          onClick={() => onPageChange(validCurrentPage - 1)}
          className="p-1 sm:p-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          &lt;
        </button>

        {/* Page numbers - responsive */}
        <div className="flex gap-1 sm:gap-2">
          {visiblePageNumbers.map((pageNum, i) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${i}`} className="p-1 sm:p-2 text-sm">...</span>
            ) : (
              <button
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                className={`p-1 sm:p-2 min-w-[32px] border rounded-md text-sm ${
                  validCurrentPage === pageNum ? 'bg-blue-50 text-blue-600 border-blue-200' : ''
                }`}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        {/* Next button */}
        <button
          disabled={validCurrentPage === validTotalPages}
          onClick={() => onPageChange(validCurrentPage + 1)}
          className="p-1 sm:p-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
