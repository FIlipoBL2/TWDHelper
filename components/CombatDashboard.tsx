import React, { useState, lazy, Suspense } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { PlusIcon } from './common/Icons';
import { Combatant, CombatType, RangeCategory, Skill, BrawlActionType, SkillExpertise, GridObject } from '../types';
import { BRAWL_PHASES, BRAWL_ACTION_DEFINITIONS } from '../constants';
import InlineConfirmation from './common/InlineConfirmation';
import DuelCard from './DuelCard';

// Lazy load heavy components
const CombatGrid = lazy(() => import('./CombatGrid'));
const EnhancedBattlemap = lazy(() => import('./common/EnhancedBattlemap'));
const EnhancedBrawlDashboard = lazy(() => import('./brawl/EnhancedTeamBrawlDashboard'));

const CombatDashboard: React.FC = () => {
  const {
    gameState,
    isEditMode,
    endCombat,
    initiateCombatSetup,
    generateAndSetBattlemap,
    setCombatantAction,
    resolveNextBrawlPhase,
    nextTurn
  } = useGameState();
  const [activeCombatantId, setActiveCombatantId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [mapPrompt, setMapPrompt] = useState('abandoned highway');
  
  const combat = gameState.combat;
  
  // If no active combat, show setup button
  if (!combat.isActive) {
    return (
      <Card>
        <h2 className="text-2xl font-bold text-red-500 mb-4">No Active Encounter</h2>
        <p className="text-gray-400 mb-4">Start a new combat encounter from the chat log.</p>
        <button 
            onClick={initiateCombatSetup} 
            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors active:scale-95"
        >
            Start New Encounter Setup
        </button>
      </Card>
    );
  }

  const currentPhaseName = BRAWL_PHASES[combat.currentPhaseIndex];
  const activeCombatant = combat.combatants.find(c => c.id === activeCombatantId);

  // Helper functions
  const getCombatantsByPhase = (phaseIndex: number) => {
    return combat.combatants.filter(c => {
      return c.plannedAction && BRAWL_ACTION_DEFINITIONS[c.plannedAction.type].phaseIndex === phaseIndex;
    });
  };

  const canActInCurrentPhase = (combatant: Combatant) => {
    if (combat.type !== 'Brawl') return false;
    return !combatant.plannedAction || BRAWL_ACTION_DEFINITIONS[combatant.plannedAction.type].phaseIndex === combat.currentPhaseIndex;
  };

  const getAvailableActionsForPhase = (phaseIndex: number) => {
    return Object.entries(BRAWL_ACTION_DEFINITIONS)
      .filter(([_, def]) => def.phaseIndex === phaseIndex)
      .map(([action, def]) => ({ action: action as BrawlActionType, ...def }));
  };

  const handleSetAction = (combatantId: string, action: BrawlActionType | null, targetId?: string) => {
    setCombatantAction(combatantId, action, targetId);
    setSelectedTargetId(null);
  };

  const handleNextPhase = () => {
    if (combat.type === 'Brawl') {
      resolveNextBrawlPhase();
    }
  };

  const allActionsPlanned = () => {
    return combat.combatants.every(c => c.plannedAction !== null || c.health <= 0);
  };

  // Helper function to get phase instructions
  const getPhaseInstructions = (phaseIndex: number): string => {
    switch (phaseIndex) {
      case 0: // Taking Cover
        return "Characters attempt to find cover. Roll Mobility. Success means immediate cover (+1 defense against ranged attacks).";
      case 1: // Ranged Combat  
        return "NPCs declare targets first, then PCs. Resolve opposed rolls. Overwatch: secure an area to shoot anyone who enters.";
      case 2: // Close Combat
        return "Only possible at Short range. Resolve as opposed rolls. Cover doesn't protect against close combat.";
      case 3: // Movement
        return "Move one range category closer/further. Requires Mobility roll. In chases, use opposed Mobility rolls.";
      case 4: // First Aid
        return "Provide first aid to anyone within Short range (not yourself). Medicine roll - success heals 1 Health.";
      case 5: // Other
        return "Any other action: barricading, hotwiring, explosives, etc. GM decides if skill roll needed.";
      default:
        return "Unknown phase";
    }
  };

  // DUEL SYSTEM (simplified turn-based)
  if (combat.type === 'Duel') {
    return (
      <div className="space-y-4">
        <DuelCard
          combatants={combat.combatants}
          currentTurn={combat.currentTurnIndex}
          round={combat.round}
          onEndDuel={endCombat}
          onNextTurn={nextTurn}
        />
        
        {/* Optional battlemap for duels - can be toggled */}
        {combat.backgroundImage && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Duel Battlemap</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapPrompt}
                  onChange={(e) => setMapPrompt(e.target.value)}
                  placeholder="Map description..."
                  className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                />
                <button
                  onClick={() => generateAndSetBattlemap(mapPrompt)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  Generate Map
                </button>
              </div>
            </div>
            <Suspense fallback={<div className="flex items-center justify-center p-8 text-gray-400">Loading battlemap...</div>}>
              <CombatGrid 
                activeCombatantId={activeCombatantId}
                onSelectCombatant={setActiveCombatantId}
                placingObject={null}
                onObjectPlaced={() => {}}
                onSetPlacingObject={() => {}}
              />
            </Suspense>
          </Card>
        )}
      </div>
    );
  }

  // BRAWL SYSTEM (phase-based) - Enhanced System
  if (combat.type === 'Brawl') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8 text-gray-400">Loading enhanced brawl system...</div>}>
        <EnhancedBrawlDashboard />
      </Suspense>
    );
  }

  // SWARM COMBAT (unchanged for now)
  if (combat.type === 'Swarm') {
    return (
      <Card>
        <h2 className="text-2xl font-bold text-red-500 mb-4">Swarm Combat - Not Implemented</h2>
        <p className="text-gray-400">Swarm combat system coming soon...</p>
      </Card>
    );
  }

  // Fallback for unknown combat types or invalid states
  return (
    <Card>
      <h2 className="text-2xl font-bold text-yellow-500 mb-4">Unknown Combat State</h2>
      <p className="text-gray-400 mb-4">
        Combat is active but type is unknown: {combat.type}
      </p>
      <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto">
        {JSON.stringify(combat, null, 2)}
      </pre>
      <button 
        onClick={endCombat}
        className="mt-4 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md"
      >
        End Combat
      </button>
    </Card>
  );
};

export default CombatDashboard;