import React, { useState, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { PlusIcon } from './common/Icons';
import NpcListItem from './NpcListItem';

const ANIMALS_PER_PAGE = 10;

const AnimalList: React.FC = () => {
  const { 
    gameState, 
    isEditMode, 
    generateRandomAnimal,
    addNpcToHaven,
    removeNpcFromHaven 
  } = useGameState();
  const { npcs } = gameState;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showAllAnimals, setShowAllAnimals] = useState(false);

  // Filter NPCs to show only animals (isAnimal: true)
  const animals = useMemo(() => {
    return npcs.filter(npc => npc.isAnimal === true);
  }, [npcs]);

  // Filter animals based on search query
  const filteredAnimals = useMemo(() => {
    if (!searchQuery) return animals;
    
    return animals.filter(animal => 
      animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.archetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.issues.some(issue => issue.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [animals, searchQuery]);

  // Calculate pagination
  const startIndex = currentPage * ANIMALS_PER_PAGE;
  const endIndex = startIndex + ANIMALS_PER_PAGE;
  const displayedAnimals = showAllAnimals ? filteredAnimals : filteredAnimals.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredAnimals.length / ANIMALS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-red-500 mb-2">🐾 Animals</h3>
            <p className="text-gray-400 text-sm">
              Manage animals that have the isAnimal flag. These use Attack Dice instead of skills.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditMode && (
              <button
                onClick={generateRandomAnimal}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <PlusIcon /> Random Animal
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search animals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
          />
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
          <span>Total: {animals.length}</span>
          <span>Filtered: {filteredAnimals.length}</span>
          {filteredAnimals.length > ANIMALS_PER_PAGE && !showAllAnimals && (
            <button
              onClick={() => setShowAllAnimals(true)}
              className="text-red-400 hover:text-red-300 underline"
            >
              Show all
            </button>
          )}
        </div>
      </Card>

      {/* Animals List */}
      <Card>
        <div className="space-y-4">
          {displayedAnimals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg mb-4">No animals found</p>
              <p className="text-gray-500 text-sm">
                {animals.length === 0 
                  ? "Generate some animals using the Random Animal button above!"
                  : "Try adjusting your search terms."
                }
              </p>
            </div>
          ) : (
            displayedAnimals.map((animal) => (
              <NpcListItem
                key={animal.id}
                npc={animal}
                isEditMode={isEditMode}
                showHavenManagement={true}
                onAddToHaven={() => addNpcToHaven(animal.id)}
                onRemoveFromHaven={() => removeNpcFromHaven(animal.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {!showAllAnimals && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              Previous
            </button>
            
            <span className="text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AnimalList;
