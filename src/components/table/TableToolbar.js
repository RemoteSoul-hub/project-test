import { Plus } from 'lucide-react';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';
import DownloadButton from './DownloadButton';

/**
 * Responsive Table Toolbar Component
 * 
 * This component organizes table controls like search, filters, and action buttons
 * in a responsive layout that works well on all screen sizes.
 * All controls are positioned on the right side on desktop.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Table title
 * @param {string} props.subtitle - Optional subtitle
 * @param {Object} props.search - Search props { searchTerm, onSearch, results, loading, onShowAllResults, totalCount, renderResult, onResultClick }
 * @param {Object} props.filter - Filter props { onClick, isActive, buttonRef }
 * @param {Object} props.download - Download props { onClick, format }
 * @param {Object} props.addNew - Add new button props { onClick, label }
 */
export default function TableToolbar({ 
  title, 
  subtitle,
  search,
  filter,
  download,
  addNew
}) {
  return (
    <div className="space-y-2 md:space-y-4 mb-2 md:mb-4">
      {/* Title and controls in a single row on desktop */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-semibold">
            {title} {subtitle && <span className="text-gray-400">({subtitle})</span>}
          </h1>
        </div>
        
        {/* Controls section - stacked on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search bar - full width on mobile, normal width on desktop */}
          {search && (
            <div className="w-full sm:w-auto order-1">
              <SearchBar
                searchTerm={search.searchTerm}
                onSearch={search.onSearch}
                results={search.results || []}
                loading={search.loading || false}
                onShowAllResults={search.onShowAllResults}
                totalCount={search.totalCount || 0}
                renderResult={search.renderResult}
                onResultClick={search.onResultClick} // Pass the new prop
              />
            </div>
          )}
          
          {/* Action buttons - horizontal row, always on the right */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0 order-2">
            {filter && (
              <FilterButton
                onClick={filter.onClick}
                isActive={filter.isActive}
                buttonRef={filter.buttonRef}
                filterFields={filter.filterFields}
              />
            )}
            
            {download && (
              <DownloadButton 
                onDownloadXLSX={download.onDownloadXLSX || download.onClick} 
                onDownloadCSV={download.onDownloadCSV || download.onClick} 
              />
            )}
            
            {/* Add new button - always visible */}
            {addNew && (
              <button 
                onClick={addNew.onClick} 
                className="flex items-center gap-1 bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-sm whitespace-nowrap"
              >
                <Plus size={16} /> 
                <span className="hidden sm:inline">{addNew.label || 'Add New'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
