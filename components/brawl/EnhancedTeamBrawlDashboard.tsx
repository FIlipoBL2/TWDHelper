// Enhanced Team-Based Brawl Dashboard with Advanced Battlemap
import React, { useState, useCallback, useMemo } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { Skill, DiceRollResult, Character, NPC } from '../../types';
import { BrawlParticipant } from '../../types/brawl';
import { BRAWL_PHASES } from '../../data/brawlPhases';
import { calculateDicePool, rollSkillCheck, pushRoll as diceServicePushRoll } from '../../services/diceService';
import Card from '../common/Card';
import DiceRollCard from '../common/DiceRollCard';
import { SimpleBattlemap } from './SimpleBattlemap';
import { twdStyles, cn } from '../../utils/twdStyles';

interface TeamMember extends BrawlParticipant {
  team: 'A' | 'B';
}

interface EnhancedTeamBrawlState {
  isActive: boolean;
  currentRound: number;
  currentPhaseIndex: number;
  teamA: TeamMember[];
  teamB: TeamMember[];
  battlemapObjects: any[];
}

interface CharacterActionSheet {
  characterId: string;
  characterName: string;
  characterType: 'PC' | 'NPC' | 'Animal';
  rollHistory: Array<{
    id: string;
    skill: Skill;
    result: DiceRollResult;
    timestamp: string;
    canPush: boolean;
  }>;
}

const INITIAL_TEAM_BRAWL_STATE: EnhancedTeamBrawlState = {
  isActive: false,
  currentRound: 1,
  currentPhaseIndex: 0,
  teamA: [],
  teamB: [],
  battlemapObjects: []
};

export const EnhancedTeamBrawlDashboard: React.FC = () => {
  const { gameState, addChatMessage, updateCharacter, updateNpc, endCombat } = useGameState();
  const { characters, npcs, combat } = gameState;

  // Local brawl state
  const [brawlState, setBrawlState] = useState<EnhancedTeamBrawlState>(INITIAL_TEAM_BRAWL_STATE);
  
  // Character action sheets
  const [actionSheets, setActionSheets] = useState<CharacterActionSheet[]>([]);
  const [selectedCharacterSheet, setSelectedCharacterSheet] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.CloseCombat);
  const [helpDice, setHelpDice] = useState<number>(0);

  // Get current phase info
  const currentPhase = BRAWL_PHASES[brawlState.currentPhaseIndex] || BRAWL_PHASES[0];
  
  // Automatically convert existing combatants to teams based on their position
  // Left side (x < 500) = Team A, Right side (x >= 500) = Team B
  const autoAssignTeams = useCallback(() => {
    if (!combat.isActive || combat.combatants.length === 0) {
      return { teamA: [], teamB: [] };
    }

    const teamA: TeamMember[] = [];
    const teamB: TeamMember[] = [];

    // Check if combatants have meaningful positions (not all at origin)
    const hasValidPositions = combat.combatants.some(c => c.position.x !== 0 || c.position.y !== 0);
    
    combat.combatants.forEach((combatant, index) => {
      const teamMember: TeamMember = {
        id: combatant.id,
        name: combatant.name,
        type: combatant.type,
        health: combatant.health,
        maxHealth: combatant.type === 'PC' ? 
          (characters.find(c => c.id === combatant.id)?.maxHealth || 3) :
          (npcs.find(n => n.id === combatant.id)?.maxHealth || 3),
        position: combatant.position,
        tokenImage: combatant.tokenImage,
        isActive: true,
        hasActed: combatant.hasActed,
        coverStatus: 'none',
        team: hasValidPositions ? 
          (combatant.position.x < 500 ? 'A' : 'B') : // Use position if valid
          (index % 2 === 0 ? 'A' : 'B') // Fallback: alternate assignment
      };

      if (teamMember.team === 'A') {
        teamA.push(teamMember);
      } else {
        teamB.push(teamMember);
      }
    });

    // Ensure both teams have at least one member if we have combatants
    if (teamA.length === 0 && teamB.length > 0) {
      // Move last member from B to A
      const member = teamB.pop()!;
      member.team = 'A';
      teamA.push(member);
    } else if (teamB.length === 0 && teamA.length > 0) {
      // Move last member from A to B
      const member = teamA.pop()!;
      member.team = 'B';
      teamB.push(member);
    }

    return { teamA, teamB };
  }, [combat, characters, npcs]);

  const selectedEntity = [...characters, ...npcs].find(e => e.id === selectedCharacterSheet);

  // Team assignment functions (removed - now automatic based on position)

  // Brawl control functions
  const startBrawl = useCallback(() => {
    // Debug current combatant positions
    console.log('🚀 Starting brawl - Current combatants:', combat.combatants.map(c => ({
      name: c.name,
      position: c.position,
      x: c.position.x
    })));
    
    // Auto-assign teams based on existing combatant positions
    const { teamA, teamB } = autoAssignTeams();
    
    console.log('🏆 Team assignments:');
    console.log('Team A:', teamA);
    console.log('Team B:', teamB);
    
    if (teamA.length === 0 || teamB.length === 0) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: '⚠️ Cannot start team brawl: Both teams need at least one member. Make sure combatants are positioned on both sides of the battlefield.',
        type: 'SYSTEM'
      });
      return;
    }

    setBrawlState(prev => ({
      ...prev,
      isActive: true,
      currentRound: 1,
      currentPhaseIndex: 0,
      teamA,
      teamB
    }));

    // Initialize action sheets for all participants
    const newActionSheets: CharacterActionSheet[] = [
      ...teamA,
      ...teamB
    ].map(participant => ({
      characterId: participant.id,
      characterName: participant.name,
      characterType: participant.type,
      rollHistory: []
    }));

    setActionSheets(newActionSheets);

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `⚔️ **TEAM BRAWL INITIATED!** Team A (${teamA.length}) vs Team B (${teamB.length}) - Auto-assigned based on battlefield positions`,
      type: 'SYSTEM'
    });
  }, [autoAssignTeams, addChatMessage]);

  const endBrawl = useCallback(() => {
    setBrawlState(INITIAL_TEAM_BRAWL_STATE);
    setActionSheets([]);
    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: '🏁 **TEAM BRAWL ENDED** - Combat has concluded.',
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
          teamA: prev.teamA.map(p => ({ ...p, hasActed: false, coverStatus: 'none' as const })),
          teamB: prev.teamB.map(p => ({ ...p, hasActed: false, coverStatus: 'none' as const }))
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
  const rollForCharacter = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    const npc = npcs.find(n => n.id === characterId);
    const entity = character || npc;
    
    if (!entity) return;

    let result: DiceRollResult;

    if (character) {
      const dicePool = calculateDicePool(character, selectedSkill, helpDice);
      result = rollSkillCheck(
        dicePool.baseDicePool,
        dicePool.stressDicePool,
        selectedSkill,
        false,
        helpDice
      );
    } else if (npc) {
      // Simplified NPC rolling
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
    } else {
      return;
    }

    // Add to character's action sheet
    const rollEntry = {
      id: `roll-${Date.now()}`,
      skill: selectedSkill,
      result,
      timestamp: new Date().toLocaleTimeString(),
      canPush: character && result.successes === 0 && !result.messedUp && !result.pushed
    };

    setActionSheets(prev => prev.map(sheet => 
      sheet.characterId === characterId 
        ? { ...sheet, rollHistory: [rollEntry, ...sheet.rollHistory] }
        : sheet
    ));

    // Add to chat log
    addChatMessage({
      characterId: entity.id,
      characterName: entity.name,
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
        content: `⚠️ **${entity.name}** messed up! A complication arises...`,
        type: 'SYSTEM'
      });
    }

    // Reset help dice
    setHelpDice(0);
  }, [selectedSkill, helpDice, characters, npcs, addChatMessage]);

  // Push roll function
  const pushRoll = useCallback((characterId: string, rollId: string) => {
    const char = characters.find(c => c.id === characterId);
    if (!char) return;

    const actionSheet = actionSheets.find(sheet => sheet.characterId === characterId);
    const rollEntry = actionSheet?.rollHistory.find(r => r.id === rollId);
    if (!rollEntry || rollEntry.result.pushed || rollEntry.result.successes > 0) return;

    // Increase stress
    const newStress = Math.min(char.stress + 1, 5);
    updateCharacter(char.id, { stress: newStress });

    // Push the roll
    const pushedResult = diceServicePushRoll(rollEntry.result);
    
    // Update action sheet
    setActionSheets(prev => prev.map(sheet => 
      sheet.characterId === characterId 
        ? {
            ...sheet,
            rollHistory: sheet.rollHistory.map(r => 
              r.id === rollId 
                ? { ...r, result: pushedResult, canPush: false }
                : r
            )
          }
        : sheet
    ));

    // Add to chat
    addChatMessage({
      characterId: characterId,
      characterName: actionSheet?.characterName || '',
      content: `🔥 **PUSHED** ${rollEntry.skill} roll (+1 Stress)`,
      type: 'ROLL',
      rollResult: pushedResult,
      canBePushed: false
    });

    if (pushedResult.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `⚠️ **${actionSheet?.characterName || 'Unknown'}** messed up on the pushed roll! A serious complication arises...`,
        type: 'SYSTEM'
      });
    }
  }, [actionSheets, characters, updateCharacter, addChatMessage]);

  // Enhanced skill roll handler for team brawl
  const handleSkillRoll = useCallback((characterId: string, skill: Skill, characterType: 'PC' | 'NPC') => {
    const entity = characterType === 'PC' 
      ? characters.find(c => c.id === characterId)
      : npcs.find(n => n.id === characterId);
    
    if (!entity) return;

    let result: DiceRollResult;

    if (characterType === 'PC') {
      const character = entity as Character;
      const dicePool = calculateDicePool(character, skill, 0);
      result = rollSkillCheck(
        dicePool.baseDicePool,
        dicePool.stressDicePool,
        skill
      );
    } else {
      // NPC roll
      const npc = entity as NPC;
      const skillLevel = npc.skillExpertise[skill] || 'None';
      let baseDice = 2;
      
      switch (skillLevel) {
        case 'None': baseDice = 2; break;
        case 'Trained': baseDice = 3; break;
        case 'Expert': baseDice = 4; break;
        case 'Master': baseDice = 5; break;
        default: baseDice = 2; break;
      }

      const dice = Array.from({ length: baseDice }, () => Math.floor(Math.random() * 6) + 1);
      const successes = dice.filter(d => d === 6).length;

      result = {
        baseDice: dice,
        stressDice: [],
        successes,
        messedUp: false,
        pushed: false,
        skill,
        helpDiceCount: 0,
        baseDicePool: baseDice,
        stressDicePool: 0
      };
    }

    // Create roll entry
    const rollEntry = {
      id: `brawl-roll-${Date.now()}`,
      skill,
      result,
      timestamp: new Date().toLocaleTimeString(),
      canPush: characterType === 'PC' && result.successes === 0 && !result.messedUp && !result.pushed
    };

    // Update action sheet
    setActionSheets(prev => prev.map(sheet => 
      sheet.characterId === characterId 
        ? { ...sheet, rollHistory: [rollEntry, ...sheet.rollHistory] }
        : sheet
    ));

    // Add to chat log
    addChatMessage({
      characterId: characterId,
      characterName: entity.name,
      content: `🎲 **${skill}** roll (Team Brawl)`,
      type: 'ROLL',
      rollResult: result,
      canBePushed: rollEntry.canPush
    });

    // Handle special results
    if (result.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `⚠️ **${entity.name}** messed up! A complication arises in the brawl...`,
        type: 'SYSTEM'
      });
    }
  }, [characters, npcs, actionSheets, addChatMessage]);

  // Push roll handler for team brawl
  const handlePushRoll = useCallback((characterId: string, rollId: string) => {
    const char = characters.find(c => c.id === characterId);
    if (!char) return;

    const actionSheet = actionSheets.find(sheet => sheet.characterId === characterId);
    const rollEntry = actionSheet?.rollHistory.find(r => r.id === rollId);
    if (!rollEntry || rollEntry.result.pushed || rollEntry.result.successes > 0) return;

    // Increase stress
    const newStress = Math.min(char.stress + 1, 5);
    updateCharacter(char.id, { stress: newStress });

    // Push the roll
    const pushedResult = diceServicePushRoll(rollEntry.result);
    
    // Update action sheet
    setActionSheets(prev => prev.map(sheet => 
      sheet.characterId === characterId 
        ? {
            ...sheet,
            rollHistory: sheet.rollHistory.map(r => 
              r.id === rollId 
                ? { ...r, result: pushedResult, canPush: false }
                : r
            )
          }
        : sheet
    ));

    // Add to chat
    addChatMessage({
      characterId: characterId,
      characterName: actionSheet?.characterName || '',
      content: `🔥 **PUSHED** ${rollEntry.skill} roll (+1 Stress)`,
      type: 'ROLL',
      rollResult: pushedResult,
      canBePushed: false
    });

    if (pushedResult.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `⚠️ **${actionSheet?.characterName || 'Unknown'}** messed up on the pushed roll! A serious complication arises...`,
        type: 'SYSTEM'
      });
    }
  }, [actionSheets, characters, updateCharacter, addChatMessage]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900 rounded-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-orange-400">⚔️ Enhanced Team Brawl System</h2>
          {brawlState.isActive && (
            <div className="text-sm text-gray-300">
              Round {brawlState.currentRound} • {currentPhase.name} Phase
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {!brawlState.isActive ? (
            <>
              <button
                onClick={startBrawl}
                disabled={!combat.isActive || combat.combatants.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                Start Team Brawl
              </button>
              {/* Cancel Brawl Button */}
              <button
                onClick={() => {
                  // End the current combat encounter entirely
                  endCombat();
                  setBrawlState(INITIAL_TEAM_BRAWL_STATE);
                  setActionSheets([]);
                  addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: '❌ **COMBAT CANCELLED** - Combat encounter has been ended.',
                    type: 'SYSTEM'
                  });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Cancel the current combat encounter"
              >
                Cancel Brawl
              </button>
            </>
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

      {!brawlState.isActive ? (
        // Pre-Brawl Setup Display
        <div className="space-y-4">
          {!combat.isActive ? (
            <Card title="No Active Combat" className="border-l-4 border-yellow-500">
              <div className="text-center py-8 text-gray-400">
                <h3 className="text-xl mb-4">⚠️ No Combat in Progress</h3>
                <p>You need to have an active combat encounter before starting a team brawl.</p>
                <p className="text-sm mt-2">Go to Chat Log and start a new encounter first.</p>
              </div>
            </Card>
          ) : (
            <>
              <Card title="Team Assignment Preview" className="border-l-4 border-blue-500">
                <div className="text-center py-4 text-gray-300">
                  <h3 className="text-lg mb-4">🎯 Automatic Team Assignment</h3>
                  <p>Teams will be automatically assigned based on combatant positions:</p>
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="text-blue-400">
                      <div className="font-bold">🔵 Team A (Left Side)</div>
                      <div className="text-sm">Position X &lt; 500</div>
                    </div>
                    <div className="text-red-400">
                      <div className="font-bold">🔴 Team B (Right Side)</div>
                      <div className="text-sm">Position X ≥ 500</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Current Combatants" className="border-l-4 border-gray-500">
                {(() => {
                  const { teamA, teamB } = autoAssignTeams();
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-bold text-blue-400 mb-2">🔵 Team A ({teamA.length})</h4>
                        {teamA.map(member => (
                          <div key={member.id} className="flex justify-between items-center bg-blue-900/30 p-2 rounded mb-1">
                            <span>{member.name} ({member.type})</span>
                            <span className="text-sm">HP: {member.health}</span>
                          </div>
                        ))}
                        {teamA.length === 0 && (
                          <div className="text-gray-400 text-sm">No combatants assigned to Team A</div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-red-400 mb-2">🔴 Team B ({teamB.length})</h4>
                        {teamB.map(member => (
                          <div key={member.id} className="flex justify-between items-center bg-red-900/30 p-2 rounded mb-1">
                            <span>{member.name} ({member.type})</span>
                            <span className="text-sm">HP: {member.health}</span>
                          </div>
                        ))}
                        {teamB.length === 0 && (
                          <div className="text-gray-400 text-sm">No combatants assigned to Team B</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </>
          )}
        </div>
      ) : (
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

          {/* Compact Combatant Action Cards - 2 Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {actionSheets.map((sheet, index) => {
              // First try to find participant in brawl state
              let participant = [...brawlState.teamA, ...brawlState.teamB].find(p => p.id === sheet.characterId);
              let participantTeam: 'A' | 'B' = 'A';
              
              // If not found, determine team from original combatant position
              if (!participant) {
                const originalCombatant = combat.combatants.find(c => c.id === sheet.characterId);
                if (originalCombatant) {
                  participantTeam = originalCombatant.position.x < 500 ? 'A' : 'B';
                }
              } else {
                participantTeam = participant.team;
              }
              
              const teamColor = participantTeam === 'A' ? 'border-blue-500' : 'border-red-500';
              const entity = [...characters, ...npcs].find(e => e.id === sheet.characterId);
              const isPC = sheet.characterType === 'PC';
              const character = isPC ? characters.find(c => c.id === sheet.characterId) : null;
              const npc = !isPC ? npcs.find(n => n.id === sheet.characterId) : null;
              
              // Get equipped weapons and armor
              const equippedWeapons = character?.inventory.filter(item => item.equipped && (item.type === 'Close' || item.type === 'Ranged')) || [];
              const equippedArmor = character?.inventory.find(item => item.equipped && item.type === 'Armor');
              
              return (
                <div key={sheet.characterId} className={`bg-gray-800/50 border-l-4 ${teamColor} rounded-lg border border-gray-700`}>
                  {/* Combatant Header */}
                  <div className="p-4 bg-gray-800/30 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Token Image */}
                        {entity?.tokenImage ? (
                          <img 
                            src={entity.tokenImage} 
                            alt={entity.name}
                            className="w-12 h-12 rounded-full border-2 border-gray-600"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full border-2 border-gray-600 flex items-center justify-center text-lg font-bold ${
                            participantTeam === 'A' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {entity?.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-lg">{sheet.characterName}</h3>
                          <div className="text-sm text-gray-400">
                            {sheet.characterType} • Team {participantTeam} • HP: {participant?.health || 'Unknown'}/{participant?.maxHealth || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Cover Status Toggle */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-gray-400">Cover</div>
                        <div className="flex gap-1">
                          {['none', 'partial', 'full'].map((coverType) => (
                            <label key={coverType} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`cover-${sheet.characterId}`}
                                value={coverType}
                                checked={participant?.coverStatus === coverType}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBrawlState(prev => ({
                                      ...prev,
                                      teamA: prev.teamA.map(p => p.id === sheet.characterId ? { ...p, coverStatus: coverType as any } : p),
                                      teamB: prev.teamB.map(p => p.id === sheet.characterId ? { ...p, coverStatus: coverType as any } : p)
                                    }));
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                participant?.coverStatus === coverType 
                                  ? 'bg-orange-600 border-orange-500 text-white' 
                                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
                              }`}>
                                {coverType === 'none' ? 'N' : coverType === 'partial' ? 'P' : 'F'}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Equipment Display */}
                    {isPC && (equippedWeapons.length > 0 || equippedArmor) && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex flex-wrap gap-4 text-sm">
                          {equippedWeapons.length > 0 && (
                            <div>
                              <span className="text-gray-400">Weapons: </span>
                              <span className="text-orange-400">
                                {equippedWeapons.map(w => w.name).join(', ')}
                              </span>
                            </div>
                          )}
                          {equippedArmor && (
                            <div>
                              <span className="text-gray-400">Armor: </span>
                              <span className="text-blue-400">{equippedArmor.name} (L{equippedArmor.armorLevel})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="p-4 space-y-3">
                    {/* Skill Selection Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Skill</label>
                        <select
                          value={selectedSkill}
                          onChange={(e) => setSelectedSkill(e.target.value as Skill)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
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

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Help/Hurt Dice: {helpDice}
                        </label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setHelpDice(prev => Math.max(-3, prev - 1))}
                            className="flex-1 px-2 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => setHelpDice(0)}
                            className="flex-1 px-2 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            0
                          </button>
                          <button
                            onClick={() => setHelpDice(prev => Math.min(3, prev + 1))}
                            className="flex-1 px-2 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Roll Button */}
                    <button
                      onClick={() => rollForCharacter(sheet.characterId)}
                      className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm font-semibold"
                    >
                      🎲 Roll {selectedSkill}
                    </button>

                    {/* Dice Roll History */}
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {sheet.rollHistory.length === 0 ? (
                        <div className="text-gray-400 text-center py-4 text-sm">
                          No rolls yet
                        </div>
                      ) : (
                        sheet.rollHistory.map(roll => (
                          <div key={roll.id} className="bg-gray-900/50 rounded p-2">
                            <DiceRollCard
                              result={roll.result}
                              command={`${roll.skill}`}
                              timestamp={roll.timestamp}
                              canPush={roll.canPush && isPC}
                              onPushRoll={roll.canPush && isPC ? () => pushRoll(sheet.characterId, roll.id) : undefined}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Battlemap */}
          <Card title="Team Battlemap" className="flex-1">
            <SimpleBattlemap
              teamA={brawlState.teamA}
              teamB={brawlState.teamB}
              objects={brawlState.battlemapObjects}
              width={1000}
              height={500}
              onParticipantMove={(participantId, newPosition) => {
                setBrawlState(prev => ({
                  ...prev,
                  teamA: prev.teamA.map(p => p.id === participantId ? { ...p, position: newPosition } : p),
                  teamB: prev.teamB.map(p => p.id === participantId ? { ...p, position: newPosition } : p)
                }));
              }}
              onObjectsChange={(newObjects) => {
                setBrawlState(prev => ({ ...prev, battlemapObjects: newObjects }));
              }}
            />
          </Card>
        </>
      )}

      {!brawlState.isActive && !combat.isActive && (
        <div className="text-center py-8 text-gray-400">
          <h3 className="text-xl mb-4">⚔️ Team Brawl Setup</h3>
          <p>Start an encounter from Chat Log to begin team-based combat.</p>
          <p className="text-sm mt-2">Combatants will be automatically assigned to teams based on their battlefield positions.</p>
        </div>
      )}

      {!brawlState.isActive && combat.isActive && (() => {
        const { teamA, teamB } = autoAssignTeams();
        const isUnbalanced = teamA.length === 0 || teamB.length === 0;
        
        console.log('🔍 Team Balance Check:');
        console.log('Team A:', teamA.map(c => ({ name: c.name, team: c.team })));
        console.log('Team B:', teamB.map(c => ({ name: c.name, team: c.team })));
        console.log('Is unbalanced:', isUnbalanced);
        
        return isUnbalanced;
      })() && (
        <div className="text-center py-8 text-orange-400">
          <h3 className="text-xl mb-4">⚠️ Unbalanced Teams</h3>
          <p>Both teams need at least one combatant to start a team brawl.</p>
          <p className="text-sm mt-2">Move combatants to different sides of the battlefield and try again.</p>
          <div className="mt-4 text-xs text-gray-400">
            <div>Team A: {(() => { const { teamA } = autoAssignTeams(); return teamA.length; })()} combatants</div>
            <div>Team B: {(() => { const { teamB } = autoAssignTeams(); return teamB.length; })()} combatants</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTeamBrawlDashboard;
