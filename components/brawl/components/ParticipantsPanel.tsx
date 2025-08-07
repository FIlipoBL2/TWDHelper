import React, { memo, useState, useCallback } from 'react';
import { BrawlParticipant } from '../../../types/brawl';
import { Character, NPC, Skill, DiceRollResult, SkillExpertise } from '../../../types';
import { useGameState } from '../../../context/GameStateContext';
import { ALL_SKILLS } from '../../../constants';
import * as diceService from '../../../services/diceService';
import DiceRoller from '../../DiceRoller';
import Die from '../../common/Die';

// Extracted NPC Dice Roller Component (from NpcListItem)
const NpcDiceRoller: React.FC<{ npc: NPC }> = ({ npc }) => {
    const { addChatMessage } = useGameState();
    const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.CloseCombat);
    const [rollResult, setRollResult] = useState<DiceRollResult | null>(null);

    const performNpcRoll = useCallback(() => {
        const expertise = npc.skillExpertise[selectedSkill] || SkillExpertise.None;
        let dicePool = 4; // Base for None
        if (expertise === SkillExpertise.Trained) dicePool = 5;
        if (expertise === SkillExpertise.Expert) dicePool = 8;
        if (expertise === SkillExpertise.Master) dicePool = 10;
        
        // Using diceService for consistent dice rolling across the application
        const result = diceService.rollSkillCheck(
            dicePool,  // Base dice
            0,         // No stress dice for NPCs 
            selectedSkill
        );
        setRollResult(result);

        addChatMessage({
        characterId: npc.id,
        characterName: npc.name,
        content: `rolled for ${selectedSkill}.`,
        type: 'ROLL',
        rollResult: result,
        });
    }, [npc, selectedSkill, addChatMessage]);

    return (
        <div>
            <h4 className="text-md font-bold text-red-400 mb-2">NPC Dice Roller</h4>
            <div className="flex gap-2 items-end">
                <div className="flex-grow">
                    <label className="text-sm text-gray-400">Skill</label>
                    <select
                        value={selectedSkill}
                        onChange={(e) => setSelectedSkill(e.target.value as Skill)}
                        className="w-full bg-gray-800 border-gray-600 rounded-md p-2 text-white"
                    >
                        {ALL_SKILLS.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={performNpcRoll}
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md"
                >
                    Roll
                </button>
                 {rollResult && (
                    <button onClick={() => setRollResult(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                        Clear
                    </button>
                )}
            </div>
            {rollResult && (
                <div className="mt-4 p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex justify-around items-center mb-2 text-center">
                        <div>
                            <div className="text-xl font-bold text-white">{rollResult.baseDicePool}</div>
                            <div className="text-xs uppercase text-gray-400">Dice</div>
                        </div>
                        <div className={`p-2 rounded-lg ${rollResult.successes > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <div className={`text-xl font-bold ${rollResult.successes > 0 ? 'text-green-400' : 'text-red-400'}`}>{rollResult.successes > 0 ? "SUCCESS" : "FAILURE"}</div>
                            <div className="text-xs text-gray-300">{rollResult.successes} Successes</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                    {rollResult.baseDice.map((d, i) => <Die key={`base-${i}`} value={d} size="md" />)}
                    </div>
                </div>
            )}
        </div>
    );
};

// Simplified Participant Card that uses existing dice rollers
interface ParticipantCardProps {
  participant: BrawlParticipant;
  helpDice: number;
  onHelpDiceChange: (participantId: string, dice: number) => void;
  onMarkActed: (participantId: string) => void;
  onToggleCover: (participantId: string) => void;
  characterData?: Character | NPC | null;
}

export const ParticipantCard = memo<ParticipantCardProps>(({ 
  participant, 
  helpDice, 
  onHelpDiceChange, 
  onMarkActed,
  onToggleCover,
  characterData
}) => {
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

  const getCoverColor = (coverStatus: 'none' | 'partial' | 'full' | undefined) => {
    switch (coverStatus) {
      case 'partial': return 'text-yellow-400';
      case 'full': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (!characterData) return null;

  return (
    <div
      className={`p-4 rounded-lg border ${
        participant.hasActed 
          ? 'border-gray-600 bg-gray-700/30' 
          : 'border-blue-500 bg-blue-500/20'
      }`}
    >
      {/* Header with participant info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {participant.tokenImage && (
            <img 
              src={participant.tokenImage} 
              alt={participant.name}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="text-white font-medium">{participant.name}</div>
            <div className="text-sm text-gray-400">
              {participant.health}/{participant.maxHealth} HP • {isPC ? 'PC' : 'NPC'}
            </div>
          </div>
        </div>
      </div>

      {/* Cover Status Toggle */}
      <div className="mb-3">
        <button
          onClick={() => onToggleCover(participant.id)}
          className={`w-full px-3 py-2 rounded text-sm font-medium transition-all hover:bg-gray-600/50 ${getCoverColor(participant.coverStatus)}`}
          title="Click to cycle cover status"
        >
          {getCoverIcon(participant.coverStatus)} {getCoverText(participant.coverStatus)}
        </button>
      </div>

      {/* Help Dice Controls */}
      <div className="mb-3">
        <label className="text-sm text-gray-400 mb-1 block">Help/Hurt Dice</label>
        <HelpDiceControls
          value={helpDice}
          onChange={(value) => onHelpDiceChange(participant.id, value)}
        />
      </div>

      {/* Use existing dice roller components */}
      <div className="mb-3">
        {isPC && character ? (
          <DiceRoller character={character} />
        ) : (
          npc && <NpcDiceRoller npc={npc} />
        )}
      </div>

      {/* Action Button */}
      {!participant.hasActed && (
        <button
          onClick={() => onMarkActed(participant.id)}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
        >
          Mark as Acted
        </button>
      )}
    </div>
  );
});

interface HelpDiceControlsProps {
  value: number;
  onChange: (value: number) => void;
}

const HelpDiceControls: React.FC<HelpDiceControlsProps> = ({ value, onChange }) => (
  <div className="flex items-center space-x-2">
    <span className="text-sm text-gray-400">Help/Hurt:</span>
    <button
      onClick={() => onChange(value - 1)}
      className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center transition-colors"
      disabled={value <= -3}
    >
      −
    </button>
    <span className="text-sm text-white min-w-[20px] text-center">
      {value}
    </span>
    <button
      onClick={() => onChange(value + 1)}
      className="w-6 h-6 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center justify-center transition-colors"
      disabled={value >= 3}
    >
      +
    </button>
  </div>
);

interface ParticipantsPanelProps {
  participants: BrawlParticipant[];
  participantHelpDice: Record<string, number>;
  onHelpDiceChange: (participantId: string, dice: number) => void;
  onMarkActed: (participantId: string) => void;
  onToggleCover: (participantId: string) => void;
  characters: Character[];
  npcs: NPC[];
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  participantHelpDice,
  onHelpDiceChange,
  onMarkActed,
  onToggleCover,
  characters,
  npcs
}) => {
  const getCharacterData = (participant: BrawlParticipant): Character | NPC | null => {
    if (participant.type === 'PC') {
      return characters.find(c => c.id === participant.id) || null;
    } else {
      return npcs.find(n => n.id === participant.id) || null;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Participants</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {participants.map(participant => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            helpDice={participantHelpDice[participant.id] || 0}
            onHelpDiceChange={onHelpDiceChange}
            onMarkActed={onMarkActed}
            onToggleCover={onToggleCover}
            characterData={getCharacterData(participant)}
          />
        ))}
      </div>
    </div>
  );
};
