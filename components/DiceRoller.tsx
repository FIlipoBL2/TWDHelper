
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Character, Skill, DiceRollResult, Attribute } from '../types';
import { useGameState } from '../context/GameStateContext';
import { ALL_SKILLS, SKILL_DEFINITIONS } from '../constants';
import { calculateDicePool, rollSkillCheck, calculateSuccessChance, pushRoll } from '../services/diceService';
import Card from './common/Card';
import Die from './common/Die';

interface DiceRollerProps {
  character: Character;
}

const SUCCESS_CHANCES: { [key: number]: { initial: number, pushed: number } } = {
    1: { initial: 17, pushed: 31 },
    2: { initial: 31, pushed: 52 },
    3: { initial: 42, pushed: 67 },
    4: { initial: 52, pushed: 77 },
    5: { initial: 60, pushed: 84 },
    6: { initial: 67, pushed: 89 },
    7: { initial: 72, pushed: 92 },
    8: { initial: 77, pushed: 95 },
    9: { initial: 81, pushed: 96 },
    10: { initial: 84, pushed: 97 },
};

const DiceRoller: React.FC<DiceRollerProps> = ({ character }) => {
  const { updateCharacter, addChatMessage } = useGameState();
  const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.RangedCombat);
  const [rollResult, setRollResult] = useState<DiceRollResult | null>(null);
  const [helpDice, setHelpDice] = useState<number>(0);

  useEffect(() => {
    setRollResult(null);
    setHelpDice(0);
  }, [selectedSkill, character.id]);

  const dicePoolBreakdown = useMemo(() => {
    const attributeName = SKILL_DEFINITIONS.find(s => s.name === selectedSkill)?.attribute;
    const attributeValue = attributeName ? character.attributes[attributeName] || 0 : 0;
    const skillValue = character.skills[selectedSkill] || 0;
    
    // Calculate equipment bonuses separately for display
    const gearBonus = character.inventory
      .filter(item => item.equipped && item.bonus && (item.skillAffected === selectedSkill || !item.skillAffected))
      .reduce((total, item) => total + (item.bonus || 0), 0);

    const activeTalents = character.talents.filter(t => character.activeTalentIds.includes(t.id));
    const talentBonus = activeTalents
        .filter(t => t.bonus && (t.skillAffected === selectedSkill || !t.skillAffected))
        .reduce((total, t) => total + (t.bonus || 0), 0);
        
    const equippedArmor = character.inventory.find(item => item.equipped && item.type === 'Armor');
    const armorPenalty = (equippedArmor && selectedSkill === Skill.Mobility && equippedArmor.penalty) ? equippedArmor.penalty : 0;
    
    // Use the diceService to calculate the final dice pool
    const calculatedPool = calculateDicePool(character, selectedSkill, helpDice);
    
    // Account for armor penalty which is not in the standard calculation
    const baseDicePool = calculatedPool.baseDicePool + armorPenalty;
    const stressDicePool = calculatedPool.stressDicePool;

    return {
      attributeName,
      attributeValue,
      skillValue,
      gearBonus,
      talentBonus,
      helpDice,
      armorPenalty,
      baseDicePool,
      stressDicePool
    };
  }, [character, selectedSkill, helpDice]);
  
  const { baseDicePool, stressDicePool } = dicePoolBreakdown;
  const totalDice = Math.max(0, baseDicePool) + Math.max(0, stressDicePool);

  // Use the diceService to calculate success chances
  const getChances = (diceCount: number) => {
    if (diceCount <= 0) {
      return { initial: "0", pushed: "17" };
    }
    if (diceCount > 10) {
      return { initial: ">84", pushed: ">97" };
    }
    
    const chances = calculateSuccessChance(diceCount, 0); // Fixed: this returns { initial, pushed }
    return { 
      initial: String(chances.initial), 
      pushed: String(chances.pushed) 
    };
  };
  
  const { initial: initialChance, pushed: pushedChance } = getChances(baseDicePool);

  const performRoll = useCallback(() => {
    const { baseDicePool, stressDicePool } = dicePoolBreakdown;
    
    // Use the diceService to perform the roll
    const result = rollSkillCheck(
      Math.max(0, baseDicePool), 
      Math.max(0, stressDicePool), 
      selectedSkill,
      false
    );
    setRollResult(result);
    updateCharacter(character.id, { activeTalentIds: [] }); // Deactivate talents after use

    addChatMessage({
      characterId: character.id,
      characterName: character.name,
      content: `rolled for ${selectedSkill}.`,
      type: 'ROLL',
      rollResult: result,
    });
    
    if (result.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `A walker appears! ${character.name} has messed up, introducing a complication. The roll cannot be pushed.`,
        type: 'SYSTEM',
      });
    }
  }, [character, selectedSkill, addChatMessage, updateCharacter, dicePoolBreakdown]);

  const handlePushRoll = useCallback(() => {
    if (!rollResult || rollResult.successes > 0 || rollResult.messedUp || rollResult.pushed) return;

    // Increase character stress first
    const newStressValue = character.stress + 1;
    updateCharacter(character.id, { stress: newStressValue });
    
    // Add stress gain message to chat log
    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `${character.name} gains 1 Stress to push the roll.`,
      type: 'SYSTEM',
    });

    // Use the diceService to handle the push roll mechanics
    const finalResult = pushRoll(rollResult);

    setRollResult(finalResult);

    addChatMessage({
      characterId: character.id,
      characterName: character.name,
      content: `pushed the roll for ${selectedSkill}!`,
      type: 'ROLL',
      rollResult: finalResult,
    });

    if (finalResult.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `A walker appears on the pushed roll! ${character.name} has messed up, introducing a complication.`,
        type: 'SYSTEM',
      });
    }
  }, [rollResult, character, updateCharacter, addChatMessage, selectedSkill]);
  
  const canPush = rollResult && rollResult.successes === 0 && !rollResult.messedUp && !rollResult.pushed;

  return (
    <Card>
      <h3 className="text-xl font-bold text-red-500 mb-4">Action & Resolution</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Dice Pool Breakdown */}
        <div className="bg-gray-900/50 p-3 rounded-lg">
            <h4 className="font-bold text-lg text-gray-300 mb-2">Dice Pool Receipt</h4>
            <ul className="text-sm space-y-1">
                <li className="flex justify-between"><span>Attribute ({dicePoolBreakdown.attributeName})</span> <span className="font-bold">{dicePoolBreakdown.attributeValue}</span></li>
                <li className="flex justify-between"><span>Skill ({selectedSkill})</span> <span className="font-bold">{dicePoolBreakdown.skillValue}</span></li>
                <li className="flex justify-between"><span>Gear Bonus</span> <span className="font-bold text-green-400">+{dicePoolBreakdown.gearBonus}</span></li>
                <li className="flex justify-between"><span>Talent Bonus</span> <span className="font-bold text-green-400">+{dicePoolBreakdown.talentBonus}</span></li>
                 <li className="flex justify-between items-center">
                    <span className="font-bold text-green-400">Help Dice</span>
                    <select
                        value={helpDice}
                        onChange={(e) => setHelpDice(Number(e.target.value))}
                        className="bg-gray-700 border-gray-600 rounded-md p-1 text-white font-bold text-center"
                        aria-label="Help Dice"
                    >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                    </select>
                </li>
                {dicePoolBreakdown.armorPenalty !== 0 && (
                    <li className="flex justify-between"><span>Armor Penalty</span> <span className="font-bold text-red-400">{dicePoolBreakdown.armorPenalty}</span></li>
                )}
                <li className="flex justify-between items-center border-t border-gray-600 mt-2 pt-2">
                    <span className="font-bold text-white">Total Base Dice</span>
                    <div className="bg-gray-600 text-white font-bold rounded-md w-8 h-8 flex items-center justify-center text-base">
                        {dicePoolBreakdown.baseDicePool}
                    </div>
                </li>
                <li className="flex justify-between items-center mt-1">
                    <span className="font-bold text-red-400">Stress Dice</span>
                    <div className="bg-white text-black font-bold rounded-md w-8 h-8 flex items-center justify-center text-base">
                        {dicePoolBreakdown.stressDicePool}
                    </div>
                </li>
            </ul>
        </div>

        {/* Success Chances */}
        <div className="bg-gray-900/50 p-3 rounded-lg flex flex-col justify-center">
            <h4 className="font-bold text-lg text-gray-300 mb-2 text-center">Success Chance</h4>
            <div className="flex justify-around items-center text-center flex-grow">
                <div>
                    <p className="text-3xl font-bold text-white">{initialChance}%</p>
                    <p className="text-xs uppercase text-gray-400">Initial Roll</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-yellow-400">{pushedChance}%</p>
                    <p className="text-xs uppercase text-gray-400">If Pushed</p>
                </div>
            </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col justify-between">
            <div>
                <label htmlFor="skill-select" className="block text-sm font-medium text-gray-400 mb-1">Select Skill</label>
                <select
                    id="skill-select"
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value as Skill)}
                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500"
                >
                    {ALL_SKILLS.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2 mt-4 self-end w-full">
                <button
                onClick={performRoll}
                disabled={rollResult !== null}
                className="flex-grow bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                Roll
                </button>
                {rollResult !== null && (
                    <button
                        onClick={() => setRollResult(null)}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
      </div>
      
      {rollResult && (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
          <div className="flex justify-around items-center mb-4 text-center flex-wrap gap-4">
             <div>
              <div className="text-2xl font-bold text-white">{rollResult.baseDicePool}</div>
              <div className="text-xs uppercase text-gray-400">Base Dice</div>
            </div>
             <div>
              <div className="text-2xl font-bold text-red-500">{rollResult.stressDicePool}</div>
              <div className="text-xs uppercase text-gray-400">Stress Dice</div>
            </div>
            <div className={`p-4 rounded-lg ${rollResult.successes > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`text-4xl font-bold ${rollResult.successes > 0 ? 'text-green-400' : 'text-red-400'}`}>{rollResult.successes > 0 ? "SUCCESS" : "FAILURE"}</div>
              <div className="text-sm text-gray-300">{rollResult.successes} Successes {rollResult.pushed && '(Pushed)'}</div>
            </div>
            {rollResult.messedUp && (
              <div className="p-4 rounded-lg bg-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-400">Messed Up!</div>
                <div className="text-sm text-gray-300">Complication</div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
                <p className="text-sm text-gray-400 mb-2">Dice Results:</p>
                <div className="flex flex-wrap gap-2">
                  {rollResult.baseDice.map((d, i) => <Die key={`base-${i}`} value={d} size="md" />)}
                  {rollResult.stressDice.map((d, i) => <Die key={`stress-${i}`} value={d} isStress size="md"/>)}
                </div>
            </div>
          </div>
          {canPush && (
            <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                <p className="text-yellow-400 mb-2">Your roll failed. You can push it to try again, but you will gain 1 Stress.</p>
                <button 
                    onClick={handlePushRoll}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                >
                    Push Roll
                </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DiceRoller;
