import React, { useState, useMemo, useCallback } from 'react';
import { Character, NPC, Skill, DiceRollResult, SkillExpertise } from '../../types';
import { BrawlParticipant } from '../../types/brawl';
import { useGameState } from '../../context/GameStateContext';
import { ALL_SKILLS, SKILL_DEFINITIONS } from '../../constants';
import { calculateDicePool, rollSkillCheck, pushRoll as diceServicePushRoll } from '../../services/diceService';
import Card from '../common/Card';
import Die from '../common/Die';
import { twdStyles, cn } from '../../utils/twdStyles';

interface BrawlCombatantCardProps {
  participant: BrawlParticipant;
  characterData: Character | NPC | null;
  onToggleCover: (participantId: string) => void;
}

export const BrawlCombatantCard: React.FC<BrawlCombatantCardProps> = ({ 
  participant, 
  characterData, 
  onToggleCover 
}) => {
  const { updateCharacter, addChatMessage } = useGameState();
  const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.CloseCombat);
  const [rollResult, setRollResult] = useState<DiceRollResult | null>(null);
  const [helpDice, setHelpDice] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);

  const isPC = participant.type === 'PC';
  const character = characterData as Character;
  const npc = characterData as NPC;

  const getCoverIcon = (coverStatus: 'none' | 'partial' | 'full' | undefined) => {
    switch (coverStatus) {
      case 'partial': return '🛡️';
      case 'full': return '🏰';
      default: return '🔓';
    }
  };

  const getCoverText = (coverStatus: 'none' | 'partial' | 'full' | undefined) => {
    switch (coverStatus) {
      case 'partial': return 'Partial Cover';
      case 'full': return 'Full Cover';
      default: return 'No Cover';
    }
  };

  // Calculate dice pool for PCs (with full features)
  const dicePoolBreakdown = useMemo(() => {
    if (!isPC || !character) return null;

    const attributeName = SKILL_DEFINITIONS.find(s => s.name === selectedSkill)?.attribute;
    const attributeValue = attributeName ? character.attributes[attributeName] || 0 : 0;
    const skillValue = character.skills[selectedSkill] || 0;
    
    // Calculate equipment bonuses
    const gearBonus = character.inventory
      .filter(item => item.equipped && item.bonus && (item.skillAffected === selectedSkill || !item.skillAffected))
      .reduce((total, item) => total + (item.bonus || 0), 0);

    // Calculate talent bonuses
    const activeTalents = character.talents.filter(t => character.activeTalentIds.includes(t.id));
    const talentBonus = activeTalents
      .filter(t => t.bonus && (t.skillAffected === selectedSkill || !t.skillAffected))
      .reduce((total, talent) => total + (talent.bonus || 0), 0);

    const baseDicePool = Math.max(1, attributeValue + skillValue + gearBonus + talentBonus + helpDice);
    const stressDicePool = character.stress || 0;

    return {
      attribute: attributeValue,
      skill: skillValue,
      gear: gearBonus,
      talent: talentBonus,
      help: helpDice,
      base: baseDicePool,
      stress: stressDicePool,
      total: baseDicePool + stressDicePool
    };
  }, [isPC, character, selectedSkill, helpDice]);

  // Calculate NPC dice pool (simplified)
  const npcDiceCount = useMemo(() => {
    if (isPC || !npc) return 2;
    
    const expertise = npc.skillExpertise[selectedSkill] || SkillExpertise.None;
    let diceCount = 2;
    
    switch (expertise) {
      case SkillExpertise.Trained: diceCount = 3; break;
      case SkillExpertise.Expert: diceCount = 4; break;
      case SkillExpertise.Master: diceCount = 5; break;
      default: diceCount = 2; break;
    }
    
    return Math.max(1, diceCount + helpDice);
  }, [isPC, npc, selectedSkill, helpDice]);

  const handleRoll = useCallback(async () => {
    if (!characterData || isRolling) return;

    setIsRolling(true);
    
    try {
      let result: DiceRollResult;
      
      if (isPC && character) {
        // PC rolling with full features
        const dicePool = calculateDicePool(character, selectedSkill, helpDice);
        result = rollSkillCheck(
          dicePool.baseDicePool,
          dicePool.stressDicePool,
          selectedSkill,
          false,
          helpDice
        );
      } else if (npc) {
        // NPC rolling (simplified)
        const diceCount = npcDiceCount;
        const dice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        const successes = dice.filter(die => die === 6).length;
        
        result = {
          baseDice: dice,
          stressDice: [],
          successes,
          messedUp: false,
          pushed: false,
          skill: selectedSkill,
          helpDice: helpDice > 0 ? Array.from({ length: helpDice }, () => Math.floor(Math.random() * 6) + 1) : undefined,
          helpDiceCount: helpDice,
          baseDicePool: diceCount - helpDice,
          stressDicePool: 0
        };
      } else {
        return;
      }

      setRollResult(result);

      // Add to chat log
      addChatMessage({
        characterId: participant.id,
        characterName: participant.name,
        content: `🎲 ${selectedSkill} roll${helpDice !== 0 ? ` with ${helpDice > 0 ? '+' : ''}${helpDice} help dice` : ''}`,
        type: 'ROLL',
        rollResult: result,
        canBePushed: !result.pushed && result.successes === 0 && isPC
      });

    } catch (error) {
      console.error('Error rolling dice:', error);
    } finally {
      setIsRolling(false);
    }
  }, [characterData, isRolling, isPC, character, npc, selectedSkill, helpDice, npcDiceCount, participant.id, participant.name, addChatMessage]);

  const handlePushRoll = useCallback(async () => {
    if (!rollResult || !isPC || rollResult.pushed || rollResult.successes > 0) return;

    try {
      const pushedResult = diceServicePushRoll(rollResult);
      setRollResult(pushedResult);

      // Update character stress if applicable
      if (pushedResult.messedUp && character) {
        const newStress = Math.min((character.stress || 0) + 1, 4);
        updateCharacter(character.id, { stress: newStress });
      }

      // Add pushed roll to chat
      addChatMessage({
        characterId: participant.id,
        characterName: participant.name,
        content: `🔄 Pushed ${selectedSkill} roll`,
        type: 'ROLL',
        rollResult: pushedResult,
        canBePushed: false
      });

    } catch (error) {
      console.error('Error pushing roll:', error);
    }
  }, [rollResult, isPC, character, selectedSkill, participant.id, participant.name, updateCharacter, addChatMessage]);

  if (!characterData) return null;

  return (
    <Card 
      title={participant.name}
      className={cn(
        "border-l-4 mb-4",
        isPC ? "border-l-blue-500" : "border-l-orange-500",
      )}
    >
      {/* Header with token and stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {participant.tokenImage && (
            <img 
              src={participant.tokenImage} 
              alt={participant.name}
              className="w-12 h-12 rounded-full border-2 border-blue-500"
            />
          )}
          <div>
            <p className="text-sm text-gray-400">
              {isPC ? 'Player Character' : 'NPC'} 
            </p>
            <div className="text-sm text-gray-300">
              Health: {participant.health}/{participant.maxHealth}
            </div>
          </div>
        </div>
        
        {/* Cover Status Toggle */}
        <div className="flex items-center gap-2">
          {isPC && character && (
            <div className="text-sm text-gray-400">
              Stress: {character.stress || 0}/4
            </div>
          )}
          <button
            onClick={() => onToggleCover(participant.id)}
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Toggle cover status"
          >
            {getCoverIcon(participant.coverStatus || 'none')} {getCoverText(participant.coverStatus || 'none')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Skill Selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium min-w-12">Skill:</label>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value as Skill)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
          >
            {ALL_SKILLS.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        {/* Help/Hurt Dice */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium min-w-12">Help:</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHelpDice(Math.max(-3, helpDice - 1))}
              className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm">
              {helpDice > 0 ? `+${helpDice}` : helpDice}
            </span>
            <button
              onClick={() => setHelpDice(Math.min(3, helpDice + 1))}
              className="w-6 h-6 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Dice Pool Display */}
        {isPC && dicePoolBreakdown && (
          <div className="text-xs bg-gray-800/50 p-2 rounded">
            <div className="grid grid-cols-2 gap-1">
              <span>Attribute: {dicePoolBreakdown.attribute}</span>
              <span>Skill: {dicePoolBreakdown.skill}</span>
              {dicePoolBreakdown.gear > 0 && <span>Gear: +{dicePoolBreakdown.gear}</span>}
              {dicePoolBreakdown.talent > 0 && <span>Talent: +{dicePoolBreakdown.talent}</span>}
            </div>
            <div className="mt-1 pt-1 border-t border-gray-600">
              <span className="font-semibold">
                Base: {dicePoolBreakdown.base} | Stress: {dicePoolBreakdown.stress}
              </span>
            </div>
          </div>
        )}

        {!isPC && (
          <div className="text-xs bg-gray-800/50 p-2 rounded">
            <span>Expertise: {npc.skillExpertise[selectedSkill] || 'None'}</span>
            <div className="font-semibold">Dice: {npcDiceCount}</div>
          </div>
        )}

        {/* Roll Button */}
        <button
          onClick={handleRoll}
          disabled={isRolling || participant.hasActed}
          className={cn(
            twdStyles.btnPrimary,
            "w-full",
            participant.hasActed && "opacity-50 cursor-not-allowed"
          )}
        >
          {isRolling ? 'Rolling...' : 'Roll Skill'}
        </button>

        {/* Roll Result */}
        {rollResult && (
          <div className="bg-gray-900/50 p-3 rounded border">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">
                Result: {rollResult.successes} Success{rollResult.successes !== 1 ? 'es' : ''}
              </span>
              {rollResult.messedUp && <span className="text-red-400 text-sm">Messed Up!</span>}
            </div>
            
            <div className="space-y-2">
              {rollResult.baseDice.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-400 mr-2">Base:</span>
                  {rollResult.baseDice.map((die, index) => (
                    <Die key={index} value={die} size="sm" />
                  ))}
                </div>
              )}
              
              {rollResult.stressDice.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-400 mr-2">Stress:</span>
                  {rollResult.stressDice.map((die, index) => (
                    <Die key={index} value={die} size="sm" isStress />
                  ))}
                </div>
              )}

              {rollResult.helpDice && rollResult.helpDice.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-400 mr-2">Help:</span>
                  {rollResult.helpDice.map((die, index) => (
                    <Die key={index} value={die} size="sm" />
                  ))}
                </div>
              )}
            </div>

            {/* Push Roll Button (PC only) */}
            {isPC && !rollResult.pushed && rollResult.successes === 0 && (
              <button
                onClick={handlePushRoll}
                className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                🔄 Push Roll
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
