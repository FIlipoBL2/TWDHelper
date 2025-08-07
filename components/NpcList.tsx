
import React, { useState, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import NpcListItem from './NpcListItem';
import { PlusIcon } from './common/Icons';
import { NPC, Skill, SkillExpertise } from '../types';

const SURVIVORS_PER_PAGE = 10;

interface NpcListProps {
    showOnlyHavenSurvivors?: boolean;
    title?: string;
    emptyMessage?: string;
    allowHavenManagement?: boolean;
}

const NpcList: React.FC<NpcListProps> = ({ 
    showOnlyHavenSurvivors = false, 
    title = "NPCs & Animals",
    emptyMessage = "No NPCs or animals found. Use the buttons above to add some!",
    allowHavenManagement = false
}) => {
    const { 
        gameState, 
        isEditMode, 
        generateRandomNpc, 
        generateRandomAnimal, 
        generateStartingNpcs, 
        addCustomNpc,
        addNpcToHaven,
        removeNpcFromHaven
    } = useGameState();
    const { npcs } = gameState;
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [showAllSurvivors, setShowAllSurvivors] = useState(false);
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customNpcName, setCustomNpcName] = useState('');
    const [customNpcArchetype, setCustomNpcArchetype] = useState('');

    // Filter NPCs based on context (haven survivors vs all NPCs)
    const contextFilteredNpcs = useMemo(() => {
        if (showOnlyHavenSurvivors) {
            // Show only NPCs that are marked as being in the haven
            return npcs.filter(npc => npc.isInHaven === true);
        }
        return npcs; // Show all NPCs and animals
    }, [npcs, showOnlyHavenSurvivors]);

    // Filter NPCs based on search query
    const filteredNpcs = useMemo(() => {
        if (!searchQuery) return contextFilteredNpcs;
        
        return contextFilteredNpcs.filter(npc =>
            npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            npc.archetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (npc.issues && npc.issues.some(issue => 
                issue.toLowerCase().includes(searchQuery.toLowerCase())
            )) ||
            (npc.inventory && npc.inventory.some(item => 
                item.toLowerCase().includes(searchQuery.toLowerCase())
            ))
        );
    }, [contextFilteredNpcs, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredNpcs.length / SURVIVORS_PER_PAGE);
    const displayedNpcs = useMemo(() => {
        if (showAllSurvivors || filteredNpcs.length <= SURVIVORS_PER_PAGE) return filteredNpcs;
        
        const startIndex = currentPage * SURVIVORS_PER_PAGE;
        return filteredNpcs.slice(startIndex, startIndex + SURVIVORS_PER_PAGE);
    }, [filteredNpcs, currentPage, showAllSurvivors]);

    // Reset pagination when search changes
    React.useEffect(() => {
        setCurrentPage(0);
        setShowAllSurvivors(false);
    }, [searchQuery]);

    const handleCreateCustomNpc = () => {
        if (!customNpcName.trim()) return;
        
        const newNpc: Omit<NPC, 'id'> = {
            name: customNpcName.trim(),
            archetype: customNpcArchetype.trim() || 'Survivor',
            health: 3,
            maxHealth: 3,
            issues: [],
            inventory: [],
            skillExpertise: {
                [Skill.CloseCombat]: SkillExpertise.None,
                [Skill.Endure]: SkillExpertise.None,
                [Skill.Force]: SkillExpertise.None,
                [Skill.Mobility]: SkillExpertise.None,
                [Skill.RangedCombat]: SkillExpertise.None,
                [Skill.Stealth]: SkillExpertise.None,
                [Skill.Scout]: SkillExpertise.None,
                [Skill.Survival]: SkillExpertise.None,
                [Skill.Tech]: SkillExpertise.None,
                [Skill.Leadership]: SkillExpertise.None,
                [Skill.Manipulation]: SkillExpertise.None,
                [Skill.Medicine]: SkillExpertise.None,
                [Skill.ManualRoll]: SkillExpertise.None,
            },
            isInHaven: false, // New NPCs start in global pool
        };
        
        addCustomNpc(newNpc as NPC);
        setCustomNpcName('');
        setCustomNpcArchetype('');
        setShowCustomForm(false);
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-xl font-bold text-red-500">{title}</h3>
              {isEditMode && (
                  <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                          onClick={() => setShowCustomForm(!showCustomForm)}
                          className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-md text-sm flex items-center justify-center gap-1"
                      >
                          <PlusIcon /> Custom {showOnlyHavenSurvivors ? 'Survivor' : 'NPC'}
                      </button>
                      <button 
                          onClick={generateRandomNpc}
                          className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-md text-sm flex items-center justify-center gap-1"
                      >
                          <PlusIcon /> Random Survivor
                      </button>
                      {!showOnlyHavenSurvivors && (
                          <button 
                              onClick={generateRandomAnimal}
                              className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-md text-sm flex items-center justify-center gap-1"
                          >
                              <PlusIcon /> Random Animal
                          </button>
                      )}
                  </div>
              )}
            </div>

            {/* Custom NPC Creation Form */}
            {isEditMode && showCustomForm && (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-3">Create Custom {showOnlyHavenSurvivors ? 'Haven Survivor' : 'NPC'}</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="NPC Name"
                            value={customNpcName}
                            onChange={e => setCustomNpcName(e.target.value)}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <input
                            type="text"
                            placeholder="Archetype (e.g., Doctor, Soldier, Survivor)"
                            value={customNpcArchetype}
                            onChange={e => setCustomNpcArchetype(e.target.value)}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateCustomNpc}
                                disabled={!customNpcName.trim()}
                                className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md text-sm"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowCustomForm(false);
                                    setCustomNpcName('');
                                    setCustomNpcArchetype('');
                                }}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            {npcs.length > 0 && (
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search NPCs and animals by name, archetype, issues, or inventory..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                </div>
            )}

            {/* Pagination Controls */}
            {filteredNpcs.length > SURVIVORS_PER_PAGE && (
                <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-400">
                            {showAllSurvivors ? `Showing all ${filteredNpcs.length} survivors` : `Showing ${displayedNpcs.length} of ${filteredNpcs.length} survivors`}
                        </span>
                        <button
                            onClick={() => setShowAllSurvivors(!showAllSurvivors)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                        >
                            {showAllSurvivors ? 'Show Pages' : 'Show All'}
                        </button>
                    </div>
                    
                    {!showAllSurvivors && totalPages > 1 && (
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                Previous
                            </button>
                            
                            <span className="text-xs text-gray-400">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2 max-h-[40rem] overflow-y-auto pr-2 -mr-2">
              {displayedNpcs.length > 0 ? (
                displayedNpcs.map(npc => (
                    <NpcListItem 
                        key={npc.id} 
                        npc={npc} 
                        showOnlyHavenSurvivors={showOnlyHavenSurvivors}
                        allowHavenManagement={allowHavenManagement}
                    />
                ))
              ) : npcs.length > 0 && filteredNpcs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No survivors or animals found matching "{searchQuery}". Try a different search term.
                  </p>
              ) : (
                  <p className="text-center text-gray-500 py-4">
                    {emptyMessage}
                  </p>
              )}
            </div>
        </Card>
    );
};

export default NpcList;
