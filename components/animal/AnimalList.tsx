// AnimalList - Refactored to follow SOLID principles with original beautiful UI
import React, { useState } from 'react';
import { NPC } from '../../types';
import { useAnimals, usePagination } from '../../hooks/useAnimals';
import { useGameState } from '../../context/GameStateContext';
import { AnimalListItem } from './AnimalListItem';
import { AnimalEditor } from './AnimalEditor';

interface AnimalListProps {
  showHavenControls?: boolean;
  inHavenOnly?: boolean;
  maxDisplayed?: number;
  title?: string;
  showOnlyHavenSurvivors?: boolean;
  allowHavenManagement?: boolean;
  isEditMode?: boolean;
}

export const AnimalList: React.FC<AnimalListProps> = ({
  showHavenControls = true,
  inHavenOnly = false,
  maxDisplayed = 10,
  title = 'Animals',
  showOnlyHavenSurvivors = false,
  allowHavenManagement = true,
  isEditMode = true
}) => {
  const { generateRandomAnimal } = useGameState();
  const { 
    animals, 
    filteredAnimals, 
    searchQuery, 
    setSearchQuery,
    totalAnimals 
  } = useAnimals();
  
  const [editingAnimal, setEditingAnimal] = useState<NPC | null>(null);

  // Filter animals based on location if specified
  const displayAnimals = inHavenOnly 
    ? filteredAnimals.filter(animal => animal.isInHaven)
    : filteredAnimals;

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
  } = usePagination(displayAnimals, maxDisplayed);

  const handleGenerateAnimal = () => {
    generateRandomAnimal();
  };

  const handleEditAnimal = (animal: NPC) => {
    setEditingAnimal(animal);
  };

  const handleCloseEdit = () => {
    setEditingAnimal(null);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">
            {title} ({totalAnimals} total{inHavenOnly ? ', showing haven only' : ''})
          </h3>
          
          <button
            onClick={handleGenerateAnimal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            title="Generate Random Animal"
          >
            🎲 Generate Animal
          </button>
        </div>

        {!inHavenOnly && (
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search animals..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div className="p-4">
        {displayAnimals.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>
              {inHavenOnly 
                ? "No animals in haven. Use the '↙' button in the NPC & Animals tab to move animals here."
                : "No animals found. Generate some animals to get started!"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayedItems.map(animal => (
                <AnimalListItem
                  key={animal.id}
                  animal={animal}
                  showHavenControls={showHavenControls}
                  onEdit={handleEditAnimal}
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
          <p className="font-bold text-red-400 mb-2">Animal Combat Instructions:</p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>🎲 Click the expand arrow to access combat rolls</li>
            <li>Animals use Attack Dice (no skills required)</li>
            <li>🐾 Icon indicates this is an animal (not NPC)</li>
            <li>ATK shows dice count, DMG shows damage dealt on hit</li>
          </ul>
        </div>
      </div>

      {editingAnimal && (
        <AnimalEditor
          animal={editingAnimal}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};

// Default export for backward compatibility
const AnimalListDefault: React.FC = () => (
  <AnimalList />
);

export default AnimalListDefault;
