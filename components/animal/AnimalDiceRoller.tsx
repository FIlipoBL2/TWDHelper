// AnimalDiceRoller - Component for animal combat rolls
import React, { useState } from 'react';
import { NPC, DiceRollResult } from '../../types';
import { AnimalCombatService } from '../../utils/animalUtils';
import { useGameState } from '../../context/GameStateContext';
import Card from '../common/Card';

interface AnimalDiceRollerProps {
  animal: NPC;
  onClose: () => void;
}

const AnimalDiceRoller: React.FC<AnimalDiceRollerProps> = ({
  animal,
  onClose
}) => {
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
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `Error: ${animal.name} couldn't perform attack`,
        type: 'SYSTEM'
      });
    } finally {
      setIsRolling(false);
    }
  };

  const combatStats = AnimalCombatService.getCombatStats(animal);

  return (
    <Card className="animal-dice-roller">
      <div className="dice-roller-header">
        <h4>{animal.name} - Combat Roll</h4>
        <button onClick={onClose} className="btn-close">×</button>
      </div>

      <div className="combat-info">
        <p><strong>Attack Dice:</strong> {combatStats.attackDice}</p>
        <p><strong>Damage:</strong> {combatStats.damage}</p>
        <p><strong>Health:</strong> {animal.health}/{animal.maxHealth}</p>
      </div>

      {lastResult && (
        <div className="last-result">
          <h5>Last Roll:</h5>
          <div className="dice-results">
            <p><strong>Dice:</strong> [{lastResult.baseDice.join(', ')}]</p>
            <p><strong>Successes:</strong> {lastResult.successes}</p>
            <p><strong>Result:</strong> {lastResult.successes > 0 ? `Hit for ${combatStats.damage} damage!` : 'Miss!'}</p>
          </div>
        </div>
      )}

      <div className="dice-actions">
        <button
          onClick={handleAttackRoll}
          disabled={isRolling || !AnimalCombatService.canAttack(animal)}
          className="btn-primary"
        >
          {isRolling ? 'Rolling...' : '🎲 Roll Attack'}
        </button>
      </div>

      {!AnimalCombatService.canAttack(animal) && (
        <div className="warning">
          <p>⚠️ This animal cannot attack (no health or attack dice)</p>
        </div>
      )}
    </Card>
  );
};

export default AnimalDiceRoller;
