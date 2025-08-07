import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import NpcList from './NpcList';
import AnimalList from './AnimalList';
import { NPCList } from './npc/NPCList';
import { AnimalList as NewAnimalList } from './animal/AnimalList';

const NPCDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'npcs' | 'animals'>('npcs');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('npcs')}
            className={`flex-1 py-3 px-6 text-center font-semibold transition-colors ${
              activeTab === 'npcs'
                ? 'bg-red-700 text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            NPC Survivors
          </button>
          <button
            onClick={() => setActiveTab('animals')}
            className={`flex-1 py-3 px-6 text-center font-semibold transition-colors ${
              activeTab === 'animals'
                ? 'bg-red-700 text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Animals
          </button>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'npcs' && (
        <div>
          <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">NPC & Animal Management</h3>
            <p className="text-gray-400 mb-4">
              Create and manage all NPCs and animals. Move NPCs to/from the Haven using the arrow buttons.
            </p>
            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
              <p className="text-yellow-400 text-sm">
                <strong>Haven Management:</strong> Use the arrows (↙) to move NPCs to the Haven. 
                Visit the Haven Status tab to see haven-specific survivors and remove them (↗) from the haven.
              </p>
            </div>
            
            {/* Use the new NPCList component or fallback to legacy */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-red-400 mb-2">NPCs</h4>
                <NPCList 
                  showHavenControls={true}
                  maxDisplayed={10}
                  title="NPC Survivors"
                />
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-red-400 mb-2">Animals</h4>
                <NewAnimalList 
                  showHavenControls={true}
                  maxDisplayed={10}
                  title="Wild Animals"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'animals' && (
        <div>
          <NewAnimalList 
            showHavenControls={true}
            title="Animal Management"
          />
        </div>
      )}
    </div>
  );
};

export default NPCDashboard;
