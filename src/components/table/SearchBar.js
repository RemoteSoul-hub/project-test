import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Responsive Search Bar Component
 *
 * This component renders a search input with dropdown results that works well on all screen sizes.
 *
 * @param {Object} props - Component props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearch - Function called when search term changes
 * @param {Array} props.results - Search results to display in dropdown
 * @param {boolean} props.loading - Whether search is in progress
 * @param {Function} props.onShowAllResults - Function to show all search results
 * @param {number} props.totalCount - Total count of search results
 * @param {Function} props.renderResult - Function to render each result (result) => ReactNode
 * @param {Function} [props.onResultClick] - Optional function to handle click on a result item (result) => void
 */
export default function SearchBar({
  searchTerm,
  onSearch,
  results = [],
  loading,
  onShowAllResults,
  totalCount = 0,
  renderResult = (result) => <div>{result}</div>,
  onResultClick 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const showDropdown = searchTerm.length > 0 && isDropdownOpen;
  const displayResults = results.slice(0, 5);
  const hasMoreResults = totalCount > 5;

  const handleShowAllResults = () => {
    setIsDropdownOpen(false);
    onShowAllResults();
  };

  return (
    <div className="relative w-full sm:w-auto">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search"
          className="pl-8 pr-8 py-2 border rounded-md text-sm w-full sm:w-[220px] md:w-[300px]"
          value={searchTerm}
          onChange={(e) => {
            onSearch(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        />
        {searchTerm && (
          <button
            onClick={() => {
              onSearch('');
              setIsDropdownOpen(false);
            }}
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border right-0">
          <div className="py-1">
            <div className="px-3 py-2 text-sm text-gray-700">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="px-2 py-1 text-xs text-gray-500">
                    {totalCount} {totalCount === 1 ? 'result' : 'results'} found
                  </div>
                  {displayResults.map((result) => (
                    <div
                      key={result.id || JSON.stringify(result)}
                      className="px-2 py-2 hover:bg-gray-100 cursor-pointer rounded-md block"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onResultClick) {
                          onResultClick(result);
                        }
                      }}
                    >
                      {renderResult(result)}
                    </div>
                  ))}
                  {hasMoreResults && (
                    <button
                      onClick={handleShowAllResults}
                      className="w-full text-center py-2 text-sm text-blue-600 hover:bg-gray-50 border-t"
                    >
                      Show all results
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className="text-base font-medium">No results found</div>
                  <div className="text-sm text-gray-500">No matches found. Please try again.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
