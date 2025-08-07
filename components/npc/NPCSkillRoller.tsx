// NPCSkillRoller - Component for rolling NPC skills
import React, { useState } from 'react';
import { NPC, Skill, SkillExpertise, DiceRollResult } from '../../types';
import { NPCSkillService } from '../../utils/npcUtils';
import { useGameState } from '../../context/GameStateContext';
import Die from '../common/Die';

interface NPCSkillRollerProps {
  npc: NPC;
}

export const NPCSkillRoller: React.FC<NPCSkillRollerProps> = ({ npc }) => {
  const { addChatMessage } = useGameState();
  const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.CloseCombat);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);

  const availableSkills = NPCSkillService.getExpertiseSkills(npc);
  const allSkills = Object.values(Skill).filter(skill => skill !== Skill.ManualRoll);

  const handleSkillRoll = async () => {
    setIsRolling(true);
    
    try {
      // For NPCs, we'll use a simple dice pool based on expertise level
      const expertise = npc.skillExpertise[selectedSkill] || SkillExpertise.None;
      let diceCount = 2; // Base dice
      
      switch (expertise) {
        case SkillExpertise.Trained:
          diceCount = 3;
          break;
        case SkillExpertise.Expert:
          diceCount = 4;
          break;
        case SkillExpertise.Master:
          diceCount = 5;
          break;
        default:
          diceCount = 2;
      }

      // Roll the dice
      const dice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      const successes = dice.filter(die => die === 6).length;
      
      const result: DiceRollResult = {
        baseDice: dice,
        stressDice: [],
        successes,
        pushed: false,
        messedUp: false,
        skill: selectedSkill,
        baseDicePool: diceCount,
        stressDicePool: 0
      };

      setLastResult(result);
      
      // Add to chat log
      addChatMessage({
        characterId: npc.id,
        characterName: npc.name,
        content: `${selectedSkill} roll: ${successes} successes (${expertise} level)`,
        type: 'ROLL',
        rollResult: result
      });
      
    } catch (error) {
      console.error('Error rolling NPC skill:', error);
    } finally {
      setIsRolling(false);
    }
  };

  if (availableSkills.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm">
        <p>No trained skills available</p>
        <p className="text-xs mt-1">Edit NPC to add skill expertise</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Skill</label>
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value as Skill)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          {/* Show trained skills first */}
          <optgroup label="Trained Skills">
            {availableSkills.map(skill => (
              <option key={skill} value={skill}>
                {skill} ({NPCSkillService.getSkillLevel(npc, skill)})
              </option>
            ))}
          </optgroup>
          
          {/* Show other skills */}
          <optgroup label="Other Skills">
            {allSkills.filter(skill => !availableSkills.includes(skill)).map(skill => (
              <option key={skill} value={skill}>
                {skill} (None)
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <button
        onClick={handleSkillRoll}
        disabled={isRolling}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
      >
        {isRolling ? '🎲 Rolling...' : `🎲 Roll ${selectedSkill}`}
      </button>
      
      {lastResult && (
        <div className="bg-gray-700/50 p-3 rounded-lg text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 font-medium">{selectedSkill} Roll:</span>
            <span className="text-blue-400 font-bold">{lastResult.successes} successes</span>
          </div>
          <div className="flex gap-1 justify-center">
            {lastResult.baseDice.map((die, index) => (
              <Die key={index} value={die} size="sm" />
            ))}
          </div>
          <div className="text-xs text-gray-400 text-center mt-2">
            Expertise: {npc.skillExpertise[selectedSkill] || SkillExpertise.None}
          </div>
        </div>
      )}
    </div>
  );
};
