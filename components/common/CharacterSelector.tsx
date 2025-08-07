import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { Character, NPC } from '../../types';
import { ChevronDownIcon } from './Icons';

interface CharacterSelectorProps {
    characters: Character[];
    npcs: NPC[];
    selectedCharacterId: string;
    onSelect: (characterId: string) => void;
    className?: string;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
    characters,
    npcs,
    selectedCharacterId,
    onSelect,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [openUpward, setOpenUpward] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Get current character name
    const getCharacterName = useCallback((id: string) => {
        if (id === 'GM') return 'GM';
        const character = characters.find(c => c.id === id);
        if (character) return character.name;
        const npc = npcs.find(n => n.id === id);
        if (npc) return npc.name;
        return 'Unknown';
    }, [characters, npcs]);

    // Filter characters based on search - memoized to prevent re-renders
    const allCharacters = useMemo(() => [
        { id: 'GM', name: 'GM', type: 'GM' as const },
        ...characters.map(c => ({ id: c.id, name: c.name, type: 'PC' as const })),
        ...npcs.map(n => ({ id: n.id, name: n.name, type: 'NPC' as const }))
    ], [characters, npcs]);

    const filteredCharacters = useMemo(() => 
        allCharacters.filter(char => char.name.toLowerCase().includes(search.toLowerCase())),
        [allCharacters, search]
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredCharacters.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const displayedCharacters = filteredCharacters.slice(startIndex, startIndex + itemsPerPage);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(0);
    }, [search]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus the search input when opened - improved focus handling
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            // Use requestAnimationFrame for better timing after DOM updates
            timeoutRef.current = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select(); // Select all text for easier typing
                }
                timeoutRef.current = null;
            }, 10); // Slightly longer delay for better reliability
            
            // Determine if dropdown should open upward
            if (buttonRef.current) {
                const buttonRect = buttonRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                const dropdownHeight = 280; // Approximate height of dropdown
                
                // Open upward if there's more space above or not enough space below
                setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Additional effect to maintain focus on search input
    useEffect(() => {
        if (isOpen && inputRef.current) {
            const interval = setInterval(() => {
                if (inputRef.current && document.activeElement !== inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);

            return () => clearInterval(interval);
        }
    }, [isOpen, search]); // Re-run when search changes to maintain focus

    const handleSelect = useCallback((characterId: string) => {
        onSelect(characterId);
        setIsOpen(false);
        setSearch('');
        setCurrentPage(0);
    }, [onSelect]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    }, [currentPage, totalPages]);

    const handlePreviousPage = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    }, [currentPage]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
            setCurrentPage(0);
            buttonRef.current?.focus();
        } else if (e.key === 'Enter' && displayedCharacters.length > 0) {
            e.preventDefault();
            handleSelect(displayedCharacters[0].id);
        }
    }, [displayedCharacters, handleSelect]);

    // Handle search input change with focus preservation
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        // Ensure focus stays on input after state update
        setTimeout(() => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
    }, []);

    const getCharacterTypeColor = useCallback((type: 'GM' | 'PC' | 'NPC') => {
        switch (type) {
            case 'GM': return 'text-purple-400';
            case 'PC': return 'text-blue-400';
            case 'NPC': return 'text-orange-400';
        }
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-left text-white focus:ring-red-500 focus:border-red-500 flex justify-between items-center"
            >
                <span className="truncate">{getCharacterName(selectedCharacterId)}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden ${
                    openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                }`}>
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-600">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search characters..."
                            value={search}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            onBlur={(e) => {
                                // Prevent blur if clicking within the dropdown
                                const relatedTarget = e.relatedTarget as HTMLElement;
                                if (relatedTarget && dropdownRef.current?.contains(relatedTarget)) {
                                    e.preventDefault();
                                    inputRef.current?.focus();
                                }
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:ring-red-500 focus:border-red-500"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                    </div>

                    {/* Character List */}
                    <div className="max-h-48 overflow-y-auto">
                        {displayedCharacters.length === 0 ? (
                            <div className="p-2 text-gray-400 text-sm text-center">
                                {filteredCharacters.length === 0 ? 'No characters found' : 'No characters on this page'}
                            </div>
                        ) : (
                            displayedCharacters.map((char) => (
                                <button
                                    key={char.id}
                                    onClick={() => handleSelect(char.id)}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus from input
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors flex justify-between items-center ${
                                        selectedCharacterId === char.id ? 'bg-gray-700' : ''
                                    }`}
                                >
                                    <span className="text-white truncate">{char.name}</span>
                                    <span className={`text-xs ${getCharacterTypeColor(char.type)}`}>
                                        {char.type}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-2 border-t border-gray-600 flex justify-between items-center text-xs">
                            <span className="text-gray-400">
                                Page {currentPage + 1} of {totalPages} ({filteredCharacters.length} total)
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 0}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-xs transition-colors"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage >= totalPages - 1}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-xs transition-colors"
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
};

export default memo(CharacterSelector);
