import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';
import CharacterSheet from './CharacterSheet';
import CharacterCreator from './CharacterCreator';
import { SearchablePaginatedSelector } from './common/SearchablePaginatedSelector';

const PlayerView: React.FC = () => {
  const { gameState, isEditMode, addCharacter, addRandomCharacter } = useGameState();
  const { characters: playerCharacters, gameMode } = gameState;
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(playerCharacters[0]?.id || '');

  useEffect(() => {
    if (!playerCharacters.find(c => c.id === selectedCharacterId)) {
      setSelectedCharacterId(playerCharacters[0]?.id || '');
    } else if (!selectedCharacterId && playerCharacters.length > 0) {
      setSelectedCharacterId(playerCharacters[0].id);
    }
  }, [playerCharacters, selectedCharacterId]);

  const handleAddCharacter = () => {
    const newId = addCharacter();
    setSelectedCharacterId(newId);
  };
  
  const handleAddRandomCharacter = () => {
    const newId = addRandomCharacter();
    setSelectedCharacterId(newId);
  };

  const selectedCharacter = playerCharacters.find(c => c.id === selectedCharacterId);

  return (
    <div className="space-y-8">
      {/* Character Selection and Action Buttons */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        {playerCharacters.length > 0 && (
          <div className="flex-grow max-w-md">
            <SearchablePaginatedSelector
              items={playerCharacters}
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
              label="Select Character"
              placeholder="Select a character..."
              itemsPerPage={5}
              renderItem={(char) => (
                <div>
                  <span className="font-medium">{char.name}</span>
                  <div className="text-xs text-gray-400 mt-1">
                    {char.archetype} • Health: {char.health}/{char.maxHealth}
                  </div>
                </div>
              )}
            />
          </div>
        )}
        
        {isEditMode && (gameMode === 'Campaign' || gameMode === 'Solo') && (
          <div className="flex flex-col gap-4">
            {playerCharacters.length > 0 && (
              <div className="text-sm text-gray-400 text-right">
                <span>Quick Actions</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 min-w-max">
              <button
                onClick={handleAddCharacter}
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-md transition-all duration-200 whitespace-nowrap flex items-center gap-2 shadow-lg hover:shadow-red-800/25"
              >
                <span>➕</span>
                Add New Character
              </button>
              <button
                onClick={handleAddRandomCharacter}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-md transition-all duration-200 whitespace-nowrap flex items-center gap-2 shadow-lg hover:shadow-blue-800/25 border border-blue-500/50"
                title="Generate a random character with pre-filled stats and background"
              >
                <span className="text-lg">🎲</span>
                Generate Random
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Character Content */}
      <div>
        {selectedCharacter ? (
          selectedCharacter.creationComplete === false ? (
            <CharacterCreator character={selectedCharacter} />
          ) : (
            <CharacterSheet character={selectedCharacter} />
          )
        ) : (
          <div className="text-center py-20">
            <div className="bg-gray-800/50 rounded-xl p-10 max-w-lg mx-auto border border-gray-700">
              <div className="text-6xl mb-6">👤</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-4">Ready to Start Your Journey?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {isEditMode && (gameMode === 'Campaign' || gameMode === 'Solo') 
                  ? "Create your first survivor to begin your story in The Walking Dead Universe. Choose to craft a custom character or let fate decide with a random generation." 
                  : "No player characters are available for this mode."}
              </p>
              {isEditMode && (gameMode === 'Campaign' || gameMode === 'Solo') && (
                <div className="space-y-4">
                  <button
                    onClick={handleAddCharacter}
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-4 px-8 rounded-md transition-all duration-200 text-lg shadow-lg hover:shadow-red-800/25 flex items-center justify-center gap-3 w-full"
                  >
                    <span>✏️</span>
                    Create Custom Character
                  </button>
                  <button
                    onClick={handleAddRandomCharacter}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-md transition-all duration-200 text-lg flex items-center justify-center gap-3 w-full shadow-lg hover:shadow-blue-800/25 border border-blue-500/50"
                  >
                    <span className="text-2xl">🎲</span>
                    Generate Random Character
                  </button>
                  <div className="text-sm text-gray-400 text-center mt-6 p-4 bg-gray-900/50 rounded-lg">
                    <strong>💡 Pro Tip:</strong> Random characters come with pre-filled stats, skills, and background stories - perfect for jumping straight into the action!
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerView;