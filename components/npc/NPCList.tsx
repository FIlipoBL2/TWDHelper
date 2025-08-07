// NPCList - Refactored to follow SOLID principles with original beautiful UI
import React, { useState } from 'react';
import { NPC } from '../../types';
import { useNPCs } from '../../hooks/useNPCs';
import { usePagination } from '../../hooks/useAnimals';
import { useGameState } from '../../context/GameStateContext';
import { NPCListItem } from './NPCListItem';

interface NPCListProps {
  showHavenControls?: boolean;
  inHavenOnly?: boolean;
  companionsOnly?: boolean;
  maxDisplayed?: number;
  title?: string;
  showOnlyHavenSurvivors?: boolean;
  allowHavenManagement?: boolean;
  isEditMode?: boolean;
}

export const NPCList: React.FC<NPCListProps> = ({
  showHavenControls = true,
  inHavenOnly = false,
  companionsOnly = false,
  maxDisplayed = 10,
  title = 'NPCs',
  showOnlyHavenSurvivors = false,
  allowHavenManagement = true,
  isEditMode = true
}) => {
  const { generateRandomNpc } = useGameState();
  const { 
    npcs, 
    filteredNPCs, 
    companions,
    havenNPCs,
    wildNPCs,
    searchQuery, 
    setSearchQuery,
    totalNPCs 
  } = useNPCs();
  
  const [editingNPC, setEditingNPC] = useState<NPC | null>(null);

  // Filter NPCs based on props
  const getDisplayNPCs = () => {
    if (companionsOnly) return companions;
    if (inHavenOnly) return havenNPCs;
    return filteredNPCs;
  };

  const displayNPCs = getDisplayNPCs();

  const {
    displayedItems,
    currentPage,
    totalPages,
    showAll,
    setShowAll,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious
  } = usePagination(displayNPCs, maxDisplayed);

  const handleGenerateNPC = () => {
    generateRandomNpc();
  };

  const handleEditNPC = (npc: NPC) => {
    setEditingNPC(npc);
  };

  const handleCloseEdit = () => {
    setEditingNPC(null);
  };

  const getEmptyStateMessage = () => {
    if (companionsOnly) return "No companions found. Create some NPCs and mark them as companions.";
    if (inHavenOnly) return "No NPCs in haven. Use the '↙' button to move NPCs here.";
    return "No NPCs found. Generate some NPCs to get started!";
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">
            {title} ({displayNPCs.length} 
            {companionsOnly ? ' companions' : inHavenOnly ? ' in haven' : ' total'})
          </h3>
          
          <button
            onClick={handleGenerateNPC}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            title="Generate Random NPC"
          >
            🎲 Generate NPC
          </button>
        </div>

        {!inHavenOnly && !companionsOnly && (
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NPCs..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div className="p-4">
        {displayNPCs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>{getEmptyStateMessage()}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedItems.map(npc => (
                <NPCListItem
                  key={npc.id}
                  npc={npc}
                  showHavenControls={showHavenControls}
                  onEdit={handleEditNPC}
                  showOnlyHavenSurvivors={showOnlyHavenSurvivors}
                  allowHavenManagement={allowHavenManagement}
                  isEditMode={isEditMode}
                />
              ))}
            </div>

            {!showAll && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={previousPage}
                  disabled={!canGoPrevious}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                
                <span className="text-gray-300">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <button
                  onClick={nextPage}
                  disabled={!canGoNext}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
                
                <button
                  onClick={() => setShowAll(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Show All
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="font-bold text-red-400 mb-2">NPC Summary:</p>
          <div className="text-sm text-gray-300 grid grid-cols-2 gap-2">
            <div>Total NPCs: <span className="text-white font-medium">{totalNPCs}</span></div>
            <div>Companions: <span className="text-green-400 font-medium">{companions.length}</span></div>
            <div>In Haven: <span className="text-blue-400 font-medium">{havenNPCs.length}</span></div>
            <div>In Wild: <span className="text-orange-400 font-medium">{wildNPCs.length}</span></div>
          </div>
        </div>
      </div>

      {editingNPC && (
        <NPCEditModal
          npc={editingNPC}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};

// Simple edit modal component (could be extracted to its own file)
interface NPCEditModalProps {
  npc: NPC;
  onClose: () => void;
}

const NPCEditModal: React.FC<NPCEditModalProps> = ({ npc, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Edit {npc.name}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <p className="text-gray-300">NPC editing functionality will be implemented here.</p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Archetype: <span className="text-white">{npc.archetype}</span></p>
            <p>Health: <span className="text-white">{npc.health}/{npc.maxHealth}</span></p>
            <p>Is Companion: <span className="text-white">{npc.isCompanion ? 'Yes' : 'No'}</span></p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
