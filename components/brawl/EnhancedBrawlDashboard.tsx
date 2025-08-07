// Enhanced Brawl Dashboard - Simplified System with Character/NPC Integration
import React, { useState, useCallback, useMemo } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { Skill, DiceRollResult, Character, NPC } from '../../types';
import { BrawlParticipant } from '../../types/brawl';
import { BRAWL_PHASES } from '../../data/brawlPhases';
import { calculateDicePool, rollSkillCheck, pushRoll as diceServicePushRoll } from '../../services/diceService';
import { GridlessBattlemap } from './GridlessBattlemap';
import { EnhancedGridlessBattlemap } from './EnhancedGridlessBattlemap';
import Card from '../common/Card';
import DiceRollCard from '../common/DiceRollCard';
import { twdStyles, cn } from '../../utils/twdStyles';

interface EnhancedBrawlDashboard {
  isActive: boolean;
  currentRound: number;
  currentPhaseIndex: number;
  participants: BrawlParticipant[];
  battlemapObjects: any[];
}

const INITIAL_BRAWL_STATE: EnhancedBrawlDashboard = {
  isActive: false,
  currentRound: 1,
  currentPhaseIndex: 0,
  participants: [],
  battlemapObjects: []
};

export const EnhancedBrawlDashboard: React.FC = () => {
  const { gameState, addChatMessage, updateCharacter, updateNpc } = useGameState();
  const { characters, npcs } = gameState;

  // Local brawl state
  const [brawlState, setBrawlState] = useState<EnhancedBrawlDashboard>(INITIAL_BRAWL_STATE);
  
  // UI state
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.CloseCombat);
  const [helpDice, setHelpDice] = useState<number>(0);
  const [rollHistory, setRollHistory] = useState<Array<{
    id: string;
    characterId: string;
    characterName: string;
    skill: Skill;
    result: DiceRollResult;
    timestamp: string;
    canPush: boolean;
  }>>([]);

  // Get current phase info
  const currentPhase = BRAWL_PHASES[brawlState.currentPhaseIndex] || BRAWL_PHASES[0];
  
  // Get available characters and NPCs for selection
  const availableEntities = useMemo(() => {
    const allEntities = [
      ...characters.map(char => ({ ...char, type: 'PC' as const })),
      ...npcs.filter(npc => !npc.isAnimal).map(npc => ({ ...npc, type: 'NPC' as const }))
    ];
    return allEntities.filter(entity => entity.health > 0);
  }, [characters, npcs]);

  const selectedEntity = availableEntities.find(e => e.id === selectedCharacterId);

  // Brawl control functions
  const startBrawl = useCallback(() => {
    setBrawlState(prev => ({
      ...prev,
      isActive: true,
      currentRound: 1,
      currentPhaseIndex: 0,
      participants: []
    }));
    setRollHistory([]);
    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: '⚔️ **BRAWL INITIATED!** Use the battlemap to position participants and begin combat.',
      type: 'SYSTEM'
    });
  }, [addChatMessage]);

  const endBrawl = useCallback(() => {
    setBrawlState(INITIAL_BRAWL_STATE);
    setRollHistory([]);
    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: '🏁 **BRAWL ENDED** - Combat has concluded.',
      type: 'SYSTEM'
    });
  }, [addChatMessage]);

  const nextPhase = useCallback(() => {
    setBrawlState(prev => {
      const nextPhaseIndex = prev.currentPhaseIndex + 1;
      if (nextPhaseIndex >= BRAWL_PHASES.length) {
        // New round
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `🔄 **ROUND ${prev.currentRound + 1}** begins! All participants reset their actions.`,
          type: 'SYSTEM'
        });
        return {
          ...prev,
          currentRound: prev.currentRound + 1,
          currentPhaseIndex: 0,
          participants: prev.participants.map(p => ({ ...p, hasActed: false, coverStatus: 'none' as const }))
        };
      } else {
        const phase = BRAWL_PHASES[nextPhaseIndex];
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `📋 **${phase.name} Phase** - ${phase.description}`,
          type: 'SYSTEM'
        });
        return {
          ...prev,
          currentPhaseIndex: nextPhaseIndex
        };
      }
    });
  }, [addChatMessage]);

  // Dice rolling function
  const rollForCharacter = useCallback(() => {
    if (!selectedEntity) return;

    const entityData = selectedEntity.type === 'PC' 
      ? selectedEntity as Character 
      : selectedEntity as NPC;

    let result: DiceRollResult;

    if (selectedEntity.type === 'PC') {
      const char = entityData as Character;
      const dicePool = calculateDicePool(char, selectedSkill, helpDice);
      result = rollSkillCheck(
        dicePool.baseDicePool,
        dicePool.stressDicePool,
        selectedSkill,
        false,
        helpDice
      );
    } else {
      // Simplified NPC rolling
      const npc = entityData as NPC;
      const expertise = npc.skillExpertise[selectedSkill];
      let baseDice = 2;
      
      switch (expertise) {
        case 'Trained': baseDice = 3; break;
        case 'Expert': baseDice = 4; break;
        case 'Master': baseDice = 5; break;
        default: baseDice = 2; break;
      }

      const dice = Array.from({ length: baseDice + helpDice }, () => Math.floor(Math.random() * 6) + 1);
      const successes = dice.filter(d => d === 6).length;

      result = {
        baseDice: dice,
        stressDice: [],
        successes,
        messedUp: false,
        pushed: false,
        skill: selectedSkill,
        helpDiceCount: helpDice,
        baseDicePool: baseDice,
        stressDicePool: 0
      };
    }

    // Add to roll history
    const rollEntry = {
      id: `roll-${Date.now()}`,
      characterId: selectedEntity.id,
      characterName: selectedEntity.name,
      skill: selectedSkill,
      result,
      timestamp: new Date().toLocaleTimeString(),
      canPush: selectedEntity.type === 'PC' && result.successes === 0 && !result.messedUp && !result.pushed
    };

    setRollHistory(prev => [rollEntry, ...prev]);

    // Add to chat log
    addChatMessage({
      characterId: selectedEntity.id,
      characterName: selectedEntity.name,
      content: `🎲 **${selectedSkill}** roll${helpDice !== 0 ? ` with ${helpDice > 0 ? '+' : ''}${helpDice} help dice` : ''}`,
      type: 'ROLL',
      rollResult: result,
      canBePushed: rollEntry.canPush
    });

    // Handle special results
    if (result.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `⚠️ **${selectedEntity.name}** messed up! A complication arises...`,
        type: 'SYSTEM'
      });
    }

    // Reset help dice
    setHelpDice(0);
  }, [selectedEntity, selectedSkill, helpDice, addChatMessage]);

  // Push roll function
  const pushRoll = useCallback((rollId: string) => {
    const rollEntry = rollHistory.find(r => r.id === rollId);
    if (!rollEntry || rollEntry.result.pushed || rollEntry.result.successes > 0) return;

    const char = characters.find(c => c.id === rollEntry.characterId);
    if (!char) return;

    // Increase stress
    const newStress = Math.min(char.stress + 1, 5);
    updateCharacter(char.id, { stress: newStress });

    // Push the roll
    const pushedResult = diceServicePushRoll(rollEntry.result);
    
    // Update roll history
    setRollHistory(prev => prev.map(r => 
      r.id === rollId 
        ? { ...r, result: pushedResult, canPush: false }
        : r
    ));

    // Add to chat
    addChatMessage({
      characterId: rollEntry.characterId,
      characterName: rollEntry.characterName,
      content: `🔥 **PUSHED** ${rollEntry.skill} roll (+1 Stress)`,
      type: 'ROLL',
      rollResult: pushedResult,
      canBePushed: false
    });

    if (pushedResult.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `⚠️ **${rollEntry.characterName}** messed up on the pushed roll! A serious complication arises...`,
        type: 'SYSTEM'
      });
    }
  }, [rollHistory, characters, updateCharacter, addChatMessage]);

  // Battlemap handlers
  const handleParticipantMove = useCallback((participantId: string, newPosition: { x: number; y: number }) => {
    setBrawlState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.id === participantId ? { ...p, position: newPosition } : p
      )
    }));
  }, []);

  const handleObjectMove = useCallback((objectId: string, newPosition: { x: number; y: number }) => {
    setBrawlState(prev => ({
      ...prev,
      battlemapObjects: prev.battlemapObjects.map(obj => 
        obj.id === objectId ? { ...obj, position: newPosition } : obj
      )
    }));
  }, []);

  const handleAddParticipant = useCallback((entityId: string) => {
    const entity = availableEntities.find(e => e.id === entityId);
    if (!entity) return;

    const participant: BrawlParticipant = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      health: entity.health,
      maxHealth: entity.maxHealth,
      position: { x: 200 + brawlState.participants.length * 60, y: 300 },
      tokenImage: entity.tokenImage,
      isActive: true,
      hasActed: false,
      coverStatus: 'none'
    };

    setBrawlState(prev => ({
      ...prev,
      participants: [...prev.participants, participant]
    }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `➕ **${entity.name}** joined the brawl`,
      type: 'SYSTEM'
    });
  }, [availableEntities, brawlState.participants.length, addChatMessage]);

  const handleParticipantDelete = useCallback((participantId: string) => {
    const participant = brawlState.participants.find(p => p.id === participantId);
    if (!participant) return;

    setBrawlState(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== participantId)
    }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `➖ **${participant.name}** left the brawl`,
      type: 'SYSTEM'
    });
  }, [brawlState.participants, addChatMessage]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900 rounded-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-orange-400">⚔️ Enhanced Brawl System</h2>
          {brawlState.isActive && (
            <div className="text-sm text-gray-300">
              Round {brawlState.currentRound} • {currentPhase.name} Phase
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {!brawlState.isActive ? (
            <button
              onClick={startBrawl}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Start Brawl
            </button>
          ) : (
            <>
              <button
                onClick={nextPhase}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Resolve Phase & Continue
              </button>
              <button
                onClick={endBrawl}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                End Brawl
              </button>
            </>
          )}
        </div>
      </div>

      {brawlState.isActive && (
        <>
          {/* Phase Progress Bar */}
          <Card title="Brawl Phases">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Phase Progress</span>
                <span>{brawlState.currentPhaseIndex + 1} / {BRAWL_PHASES.length}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((brawlState.currentPhaseIndex + 1) / BRAWL_PHASES.length) * 100}%` }}
                />
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <h4 className="font-bold text-orange-400 mb-2">{currentPhase.name}</h4>
                <p className="text-sm text-gray-300 mb-2">{currentPhase.description}</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  {currentPhase.actions.map((action, idx) => (
                    <li key={idx}>• {action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Character/NPC Selection and Rolling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Character Actions">
              <div className="space-y-4">
                {/* Character Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Character/NPC:
                  </label>
                  <select
                    value={selectedCharacterId}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">Choose a character...</option>
                    {availableEntities.map(entity => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} ({entity.type}) - HP: {entity.health}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add to Brawl */}
                {selectedEntity && !brawlState.participants.find(p => p.id === selectedEntity.id) && (
                  <button
                    onClick={() => handleAddParticipant(selectedEntity.id)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Add {selectedEntity.name} to Brawl
                  </button>
                )}

                {/* Skill Selection */}
                {selectedEntity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Skill to Roll:
                    </label>
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value as Skill)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value={Skill.CloseCombat}>Close Combat</option>
                      <option value={Skill.RangedCombat}>Ranged Combat</option>
                      <option value={Skill.Mobility}>Mobility</option>
                      <option value={Skill.Medicine}>Medicine</option>
                      <option value={Skill.Leadership}>Leadership</option>
                      <option value={Skill.Stealth}>Stealth</option>
                      <option value={Skill.Scout}>Scout</option>
                      <option value={Skill.Survival}>Survival</option>
                      <option value={Skill.Tech}>Tech</option>
                      <option value={Skill.Force}>Force</option>
                      <option value={Skill.Endure}>Endure</option>
                      <option value={Skill.Manipulation}>Manipulation</option>
                    </select>
                  </div>
                )}

                {/* Help Dice */}
                {selectedEntity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Help/Hurt Dice: {helpDice}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHelpDice(prev => Math.max(-3, prev - 1))}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => setHelpDice(0)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setHelpDice(prev => Math.min(3, prev + 1))}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                )}

                {/* Roll Button */}
                {selectedEntity && (
                  <button
                    onClick={rollForCharacter}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-lg font-semibold"
                  >
                    🎲 Roll {selectedSkill} for {selectedEntity.name}
                  </button>
                )}
              </div>
            </Card>

            {/* Roll History */}
            <Card title="Roll History">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rollHistory.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    No rolls yet. Select a character and make a roll!
                  </div>
                ) : (
                  rollHistory.map(roll => (
                    <DiceRollCard
                      key={roll.id}
                      result={roll.result}
                      command={`${roll.characterName}: ${roll.skill}`}
                      timestamp={roll.timestamp}
                      canPush={roll.canPush}
                      onPushRoll={roll.canPush ? () => pushRoll(roll.id) : undefined}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Battlemap */}
          <Card title="Battlemap" className="flex-1">
            <div className="relative">
              <EnhancedGridlessBattlemap
                participants={brawlState.participants}
                objects={brawlState.battlemapObjects}
                width={800}
                height={600}
                onParticipantMove={handleParticipantMove}
                onObjectMove={handleObjectMove}
                onParticipantDelete={handleParticipantDelete}
                onBackgroundGenerate={(prompt) => {
                  console.log('Background generation requested:', prompt);
                }}
                isEditMode={true}
              />
            </div>
          </Card>
        </>
      )}

      {!brawlState.isActive && (
        <div className="text-center py-16 text-gray-400">
          <h3 className="text-xl mb-4">⚔️ Brawl System Ready</h3>
          <p>Click "Start Brawl" to begin combat with the enhanced system.</p>
          <p className="text-sm mt-2">This system integrates directly with your characters and NPCs.</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedBrawlDashboard;
