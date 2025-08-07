// SearchablePaginatedSelector - A reusable dropdown with search and pagination
import React, { useState, useEffect, useRef } from 'react';

interface SelectableItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface SearchablePaginatedSelectorProps<T extends SelectableItem> {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  label?: string;
  itemsPerPage?: number;
  className?: string;
  renderItem?: (item: T) => React.ReactNode;
}

export function SearchablePaginatedSelector<T extends SelectableItem>({
  items,
  selectedId,
  onSelect,
  placeholder = "Select an item...",
  label,
  itemsPerPage = 5,
  className = "",
  renderItem
}: SearchablePaginatedSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter items based on search query
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const selectedItem = items.find(item => item.id === selectedId);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setCurrentPage(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchQuery('');
    setCurrentPage(0);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-3">{label}</label>
      )}
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-600 rounded-md p-4 text-left text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 flex justify-between items-center hover:bg-gray-700 transition-colors"
      >
        <span className="font-medium truncate">
          {selectedItem?.name || placeholder}
        </span>
        <svg 
          className={`w-5 h-5 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 bg-gray-900 border border-gray-700 rounded-md mt-2 z-20 shadow-xl">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-700">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Items List */}
          <div className="max-h-60 overflow-y-auto">
            {displayedItems.length === 0 ? (
              <div className="px-4 py-3 text-gray-400 text-sm text-center">
                {filteredItems.length === 0 ? 'No items found' : 'No items on this page'}
              </div>
            ) : (
              displayedItems.map(item => (
                <div
                  key={item.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-red-700 transition-colors ${
                    item.id === selectedId ? 'bg-red-800 text-white' : 'text-gray-200'
                  }`}
                  onClick={() => handleSelect(item.id)}
                >
                  {renderItem ? renderItem(item) : (
                    <span className="font-medium">{item.name}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-700 flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Page {currentPage + 1} of {totalPages} ({filteredItems.length} items)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-xs transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-xs transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
