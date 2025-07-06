"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, FileText, Monitor, Mail, ChevronDown, ChevronRight, User, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import styles from '@/styles/table.module.css';

/**
 * Responsive Table Component
 * 
 * This component renders a responsive table that works well on all screen sizes.
 * On mobile, it provides horizontal scrolling and optimized display of content.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.columns - Array of column definitions
 * @param {Array} props.data - Array of data rows
 * @param {Array} props.dropdownActions - Array of actions for the dropdown menu
 * @param {boolean} props.isLoading - Optional loading state
 * @param {boolean} props.loading - Alternative prop name for loading state
 * @param {boolean} props.expandable - Whether rows can be expanded
 * @param {Function} props.expandedContent - Function to render expanded content (row) => ReactNode
 */
export default function Table({
  columns,
  data,
  dropdownActions,
  isLoading = false,
  loading = false,
  expandable = false,
  expandedContent,
  filteredData = null // Optional pre-filtered data
}) {
  // Use either isLoading or loading prop
  const isTableLoading = isLoading || loading;
  
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const dropdownRefs = useRef([]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownOpen !== null &&
        dropdownRefs.current[dropdownOpen] &&
        !dropdownRefs.current[dropdownOpen].contains(event.target)
      ) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Toggle expanded row
  const toggleRowExpansion = (rowIndex) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };

  // Styling for permissions
  const getPermissionStyles = (permission) => {
    switch (permission) {
      case 'Administrator':
        return 'bg-blue-100 text-blue-600';
      case 'Read & Write':
        return 'bg-green-100 text-green-600';
      case 'Read Only':
        return 'bg-gray-100 text-gray-600';
      default:
        return '';
    }
  };

  // Render skeleton rows for loading state
  const renderSkeletonRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        {expandable && (
          <td className="p-2 md:p-3 border-b w-10 text-center">
            <div className="h-5 w-5 bg-gray-200 rounded-full mx-auto"></div>
          </td>
        )}
        {columns.map((col, colIndex) => (
          <td 
            key={`skeleton-cell-${colIndex}`} 
            className={`p-2 md:p-3 border-b ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
          >
            <div className="flex items-center space-x-3">
              {colIndex === 0 && (
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
              )}
              <div className={`h-4 bg-gray-200 rounded ${
                colIndex === 0 ? 'w-24' : 
                colIndex === 1 ? 'w-32' : 
                colIndex === 2 ? 'w-20' : 
                'w-16'
              }`}></div>
            </div>
          </td>
        ))}
        {dropdownActions && (
          <td className="p-2 md:p-3 border-b text-right">
            <div className="h-8 w-8 bg-gray-200 rounded-full ml-auto"></div>
          </td>
        )}
      </tr>
    ));
  };

  // Render the table structure with appropriate content
  return (
    <div className={styles.tableContainer}>
      <div className={`overflow-x-auto ${styles.contentPreserveHeight}`}>
        <table className="min-w-full bg-white border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {expandable && (
                <th className="p-2 md:p-3 border-b w-10 text-center"></th>
              )}
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`p-2 md:p-3 border-b text-left text-gray-600 font-medium ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                >
                  {col.headerCell ? col.headerCell() : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isTableLoading ? (
              // Skeleton loading state
              renderSkeletonRows()
            ) : !data || data.length === 0 ? (
              // No data available message
              <tr>
                <td colSpan={columns.length + (dropdownActions ? 1 : 0) + (expandable ? 1 : 0)} className="p-6 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              // Data rows - use filteredData if provided, otherwise use original data
              (() => {
                const displayData = filteredData || data;
                console.log('Table rendering with data:', { 
                  dataLength: data?.length, 
                  filteredDataLength: filteredData?.length,
                  usingFilteredData: !!filteredData,
                  displayDataLength: displayData?.length
                });
                return displayData;
              })().map((row, rowIndex) => (
                  <React.Fragment key={`row-${rowIndex}`}>
                  <tr 
                    className={`hover:bg-gray-50 ${expandable ? 'cursor-pointer' : ''}`}
                    onClick={expandable ? () => toggleRowExpansion(rowIndex) : undefined}
                  >
                    {expandable && (
                      <td className="p-2 md:p-3 border-b w-10 text-center">
                        {expandedRows[rowIndex] ? (
                          <ChevronDown size={18} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-500" />
                        )}
                      </td>
                    )}
                    {columns.map((col) => (
                      <td 
                        key={col.accessor} 
                        className={`p-2 md:p-3 border-b ${col.className || ''} ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                      >
                        {col.cell ? (
                          col.cell(row[col.accessor], row, rowIndex)
                        ) : (
                          <div className="truncate max-w-[150px] sm:max-w-none">
                            {row[col.accessor]}
                          </div>
                        )}
                      </td>
                    ))}
                    {dropdownActions && (
                      <td 
                        className="p-2 md:p-3 border-b text-right relative"
                        onClick={(e) => {
                          // Stop propagation to prevent row expansion when clicking dropdown
                          e.stopPropagation();
                        }}
                      >
                        <button
                          className="p-2 rounded-full hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === rowIndex ? null : rowIndex);
                            // Store the button reference for positioning
                            dropdownRefs.current[rowIndex] = e.currentTarget;
                          }}
                          aria-label="More options"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {dropdownOpen === rowIndex && (
                          <div
                            className="fixed w-48 bg-white rounded-md shadow-lg overflow-visible"
                            style={{
                              top: dropdownRefs.current[rowIndex]?.getBoundingClientRect().bottom + window.scrollY + 5 || 0,
                              left: Math.max(10, dropdownRefs.current[rowIndex]?.getBoundingClientRect().left - 160) || 0,
                              zIndex: 99999, // Extremely high z-index to ensure it's above everything
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            <ul className="py-1">
                              {dropdownActions.map((action, index) => (
                                <li 
                                  key={index} 
                                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${action.className || ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row.id || rowIndex, row);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  {action.icon}
                                  <span className="ml-2">{action.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                  {expandable && expandedRows[rowIndex] && (
                    <tr key={`expanded-${rowIndex}`}>
                      <td 
                        colSpan={columns.length + (dropdownActions ? 1 : 0) + 1} 
                        className="p-0 border-b"
                      >
                        <div className="p-2 md:p-4 bg-gray-50">
                          {expandedContent ? expandedContent(row) : (
                            <div className="text-gray-500">No expanded content provided</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
