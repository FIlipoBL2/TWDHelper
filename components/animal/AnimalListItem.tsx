// AnimalListItem - Refactored to follow SOLID principles with original beautiful UI
import React, { useState, useCallback } from 'react';
import { NPC, DiceRollResult } from '../../types';
import { AnimalCombatService, AnimalManagementService } from '../../utils/animalUtils';
import { useGameState } from '../../context/GameStateContext';
import { ChevronDownIcon, TrashIcon } from '../common/Icons';
import InlineConfirmation from '../common/InlineConfirmation';
import Die from '../common/Die';

// Inline dice roller component for animals
interface AnimalInlineDiceRollerProps {
  animal: NPC;
}

const AnimalInlineDiceRoller: React.FC<AnimalInlineDiceRollerProps> = ({ animal }) => {
  const { addChatMessage } = useGameState();
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);

  const handleAttackRoll = async () => {
    if (!AnimalCombatService.canAttack(animal)) {
      return;
    }

    setIsRolling(true);
    
    try {
      const result = AnimalCombatService.performAttack(animal);
      setLastResult(result);
      
      // Add to chat log
      const description = AnimalCombatService.getAttackDescription(animal, result);
      addChatMessage({
        characterId: animal.id,
        characterName: animal.name,
        content: description,
        type: 'ROLL',
        rollResult: result
      });
      
    } catch (error) {
      console.error('Error rolling animal attack:', error);
    } finally {
      setIsRolling(false);
    }
  };

  const combatStats = AnimalCombatService.getCombatStats(animal);
  const canAttack = AnimalCombatService.canAttack(animal);

  return (
    <div className="space-y-2">
      <button
        onClick={handleAttackRoll}
        disabled={!canAttack || isRolling}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:text-gray-400 text-white px-3 py-2 rounded-lg transition-colors text-sm"
      >
        {isRolling ? '🎲 Rolling...' : `🎲 Attack Roll (${combatStats.attackDice} dice)`}
      </button>
      
      {lastResult && (
        <div className="bg-gray-700/50 p-2 rounded-lg text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Last Roll:</span>
            <div className="flex gap-1">
              {lastResult.baseDice.map((die, index) => (
                <Die key={index} value={die} size="sm" />
              ))}
            </div>
          </div>
          <div className="text-center mt-1">
            <span className="text-green-400 font-bold">{lastResult.successes} successes</span>
            {lastResult.successes > 0 && (
              <span className="text-red-400 ml-2">({lastResult.successes} damage)</span>
            )}
          </div>
        </div>
      )}
      
      {!canAttack && (
        <p className="text-gray-500 text-xs italic">Animal cannot attack (health too low or no attack dice)</p>
      )}
    </div>
  );
};

interface AnimalListItemProps {
  animal: NPC;
  showHavenControls?: boolean;
  onEdit?: (animal: NPC) => void;
  showOnlyHavenSurvivors?: boolean;
  allowHavenManagement?: boolean;
  isEditMode?: boolean;
}

export const AnimalListItem: React.FC<AnimalListItemProps> = ({
  animal,
  showHavenControls = true,
  onEdit,
  showOnlyHavenSurvivors = false,
  allowHavenManagement = true,
  isEditMode = true
}) => {
  const { addNpcToHaven, removeNpcFromHaven, removeNpc } = useGameState();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMoveToHaven = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (AnimalManagementService.canBeMovedToHaven(animal)) {
      addNpcToHaven(animal.id);
    }
  }, [animal, addNpcToHaven]);

  const handleRemoveFromHaven = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (AnimalManagementService.canBeRemovedFromHaven(animal)) {
      removeNpcFromHaven(animal.id);
    }
  }, [animal, removeNpcFromHaven]);

  const handleDelete = useCallback(() => {
    removeNpc(animal.id, animal.name);
  }, [animal.id, animal.name, removeNpc]);

  const headerBg = animal.health > 0 ? 'bg-gray-700/50 hover:bg-gray-700/80' : 'bg-red-900/40 hover:bg-red-900/60';
  const headerTextColor = animal.health > 0 ? 'text-white' : 'text-red-300';
  
  const combatStats = AnimalCombatService.getCombatStats(animal);
  const speciesName = AnimalManagementService.getSpeciesFromArchetype(animal.archetype);

  const ReadOnlyView = () => (
    <div className="space-y-3 text-sm animate-fade-in">
      <div>
        <h4 className="font-bold text-red-400">Behavioral Issues</h4>
        <p className="text-gray-300 italic">
          {animal.issues && animal.issues.length > 0 ? animal.issues.join(', ') : 'None'}
        </p>
      </div>
      
      <div>
        <h4 className="font-bold text-red-400">Combat Stats</h4>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="bg-blue-500/20 p-2 rounded-lg text-center">
            <div className="text-xl font-bold text-white">{combatStats.attackDice}</div>
            <div className="text-xs uppercase text-gray-400">Attack Dice</div>
          </div>
          <div className="bg-red-500/20 p-2 rounded-lg text-center">
            <div className="text-xl font-bold text-red-400">{combatStats.damage}</div>
            <div className="text-xs uppercase text-gray-400">Damage</div>
          </div>
        </div>
      </div>

      {animal.inventory && animal.inventory.length > 0 && (
        <div>
          <h4 className="font-bold text-red-400">Items</h4>
          <p className="text-gray-300">{animal.inventory.join(', ')}</p>
        </div>
      )}

      <div className="mt-4">
        <h4 className="font-bold text-red-400 mb-2">Combat Actions</h4>
        <AnimalInlineDiceRoller animal={animal} />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <header 
        className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${headerBg}`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`animal-details-${animal.id}`}
      >
        <div className="flex-grow flex items-center gap-2">
          <div>
            <p className={`font-bold ${headerTextColor}`}>
              <span className="text-green-400">🐾 </span>
              {animal.name}
              <span className="text-xs text-green-400"> (Animal)</span>
            </p>
            <p className="text-sm font-normal text-gray-400">{speciesName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0 ml-2">
          <div className="text-center">
            <p className="font-bold text-lg">{animal.health}</p>
            <p className="text-xs text-gray-400 uppercase">HP</p>
          </div>
          
          {combatStats.attackDice > 0 && (
            <div className="text-center">
              <p className="font-bold text-lg text-green-400">{combatStats.attackDice}</p>
              <p className="text-xs text-gray-400 uppercase">ATK</p>
            </div>
          )}
          
          {combatStats.damage && (
            <div className="text-center">
              <p className="font-bold text-lg text-red-400">{combatStats.damage}</p>
              <p className="text-xs text-gray-400 uppercase">DMG</p>
            </div>
          )}

          {isEditMode && (
            <InlineConfirmation
              question="Delete?"
              onConfirm={handleDelete}
            >
              {(startConfirmation) => (
                <button
                  onClick={(e) => { e.stopPropagation(); startConfirmation(e); }}
                  className="text-gray-400 hover:text-red-400 p-2 rounded-full"
                  aria-label={`Delete ${animal.name}`}
                >
                  <TrashIcon />
                </button>
              )}
            </InlineConfirmation>
          )}
          
          {/* Haven Management Buttons */}
          {isEditMode && allowHavenManagement && showHavenControls && (
            <>
              {showOnlyHavenSurvivors ? (
                <button
                  onClick={handleRemoveFromHaven}
                  className="text-orange-400 hover:text-orange-300 p-2 rounded-full text-xs"
                  aria-label={`Remove ${animal.name} from haven`}
                  title="Remove from Haven"
                >
                  ↗
                </button>
              ) : (
                animal.isInHaven === false && (
                  <button
                    onClick={handleMoveToHaven}
                    className="text-green-400 hover:text-green-300 p-2 rounded-full text-xs"
                    aria-label={`Add ${animal.name} to haven`}
                    title="Add to Haven"
                  >
                    ↙
                  </button>
                )
              )}
            </>
          )}
          
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </div>
        </div>
      </header>

      {isExpanded && (
        <section 
          id={`animal-details-${animal.id}`} 
          className="border-t border-gray-600 bg-gray-800/50"
        >
          <div className="p-4">
            <ReadOnlyView />
          </div>
        </section>
      )}
    </div>
  );
};
