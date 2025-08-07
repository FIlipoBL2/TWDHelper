import React, { useState, useMemo, useCallback } from 'react';
import { Character, Attribute, DiceRollResult } from '../types';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import Die from './common/Die';

interface HandleFearProps {
  character: Character;
}

const HandleFear: React.FC<HandleFearProps> = ({ character }) => {
  const { updateCharacter, addChatMessage } = useGameState();
  const [attributeToUse, setAttributeToUse] = useState<Attribute>(Attribute.Wits);
  const [rollResult, setRollResult] = useState<DiceRollResult | null>(null);
  const [overwhelmedResult, setOverwhelmedResult] = useState<string | null>(null);

  const breakdown = useMemo(() => {
    const attributeValue = character.attributes[attributeToUse] || 0;
    let anchorBonus = 0;
    if (character.pcAnchorId) anchorBonus += 2;
    if (character.npcAnchorId) anchorBonus += 2;
    const dicePool = attributeValue + anchorBonus;
    return { attributeValue, anchorBonus, dicePool };
  }, [character, attributeToUse]);

  const handleRoll = useCallback(() => {
    setRollResult(null);
    setOverwhelmedResult(null);

    const rollDice = (count: number) => Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
    const dice = rollDice(breakdown.dicePool);
    const successes = dice.filter(d => d === 6).length;

    const result: DiceRollResult = {
      baseDice: dice,
      stressDice: [],
      successes,
      pushed: false,
      messedUp: false,
      skill: 'Handle Fear',
      baseDicePool: breakdown.dicePool,
      stressDicePool: 0
    };
    
    setRollResult(result);

    addChatMessage({
        characterId: character.id,
        characterName: character.name,
        content: `attempts to handle fear using ${attributeToUse}.`,
        type: 'ROLL',
        rollResult: result,
    });
    
    if (successes === 0) {
      addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `${character.name} is Overwhelmed! Rolling on the table...`,
          type: 'SYSTEM'
      });
      handleOverwhelmed();
    } else {
       addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `${character.name} successfully handles their fear.`,
          type: 'SYSTEM'
      });
    }
  }, [character, attributeToUse, breakdown, addChatMessage, updateCharacter]);

  const handleOverwhelmed = () => {
    const d6 = Math.floor(Math.random() * 6) + 1;
    let effectText = '';
    
    if (d6 <= 2) {
      effectText = '1–2: You lose your Drive.';
      updateCharacter(character.id, { drive: '' });
    } else if (d6 <= 5) {
      effectText = '3–5: You become Shattered.';
      updateCharacter(character.id, { isShattered: 'Overwhelmed by fear. Select a new state.' });
    } else {
      effectText = '6: Your Issue changes, or you gain another one.';
      updateCharacter(character.id, { issue: character.issue + ' (Overwhelmed - Change or add new issue)' });
    }
    
    const fullEffectText = `Overwhelmed result (rolled a ${d6}): ${effectText}`;
    setOverwhelmedResult(fullEffectText);
    
    addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: fullEffectText,
        type: 'SYSTEM'
    });
  };

  return (
    <Card className="bg-gray-800/80">
      <h4 className="font-bold text-red-400 mb-2">Handle Fear</h4>
      <div className="flex flex-wrap gap-4 items-center">
        {/* Controls */}
        <div className="flex-grow space-y-2">
            <div className="text-sm">
                <p className="font-semibold text-gray-300">Choose Attribute:</p>
                <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`fear-attr-${character.id}`} value={Attribute.Wits} checked={attributeToUse === Attribute.Wits} onChange={() => setAttributeToUse(Attribute.Wits)} className="bg-gray-900" />
                        Wits ({character.attributes.Wits})
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={`fear-attr-${character.id}`} value={Attribute.Empathy} checked={attributeToUse === Attribute.Empathy} onChange={() => setAttributeToUse(Attribute.Empathy)} className="bg-gray-900" />
                        Empathy ({character.attributes.Empathy})
                    </label>
                </div>
            </div>
            <p className="text-sm text-gray-400">
                Dice Pool: {breakdown.attributeValue} ({attributeToUse}) + {breakdown.anchorBonus} (Anchors) = <span className="font-bold text-white text-base">{breakdown.dicePool} Dice</span>
            </p>
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
            <button
                onClick={handleRoll}
                disabled={rollResult !== null}
                className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Handle Fear
            </button>
            {rollResult !== null && (
                <button
                    onClick={() => { setRollResult(null); setOverwhelmedResult(null); }}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition-colors"
                >
                    Clear
                </button>
            )}
        </div>
      </div>
      
      {/* Result Display */}
      {rollResult && (
        <div className="mt-4 pt-4 border-t border-gray-700">
            <div className={`text-center p-2 rounded-lg mb-2 ${rollResult.successes > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <p className="font-bold text-lg">{rollResult.successes > 0 ? "SUCCESS" : "FAILURE"}</p>
                <p className="text-sm">{rollResult.successes > 0 ? "You handle your fear." : "You are Overwhelmed."}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center my-2">
                {rollResult.baseDice.map((d, i) => <Die key={`fear-${i}`} value={d} size="md" />)}
            </div>
            {overwhelmedResult && (
                <div className="mt-2 text-center p-2 bg-yellow-900/50 rounded-lg">
                    <p className="font-bold text-yellow-400">{overwhelmedResult}</p>
                </div>
            )}
        </div>
      )}
    </Card>
  );
};

export default HandleFear;
