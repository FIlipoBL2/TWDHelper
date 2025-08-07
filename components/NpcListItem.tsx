

import React, { useState, useCallback } from 'react';
import { NPC, Skill, SkillExpertise, DiceRollResult } from '../types';
import { useGameState } from '../context/GameStateContext';
import NpcSheet from './NpcSheet';
import { TrashIcon, ChevronDownIcon, StarIcon } from './common/Icons';
import InlineConfirmation from './common/InlineConfirmation';
import Die from './common/Die';
import { ALL_SKILLS } from '../constants';
import * as diceService from '../services/diceService';

interface NpcListItemProps {
  npc: NPC;
  showOnlyHavenSurvivors?: boolean;
  allowHavenManagement?: boolean;
}

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
    )
}

// Animal Dice Roller for combat attacks
const AnimalDiceRoller: React.FC<{ npc: NPC }> = ({ npc }) => {
    const { addChatMessage } = useGameState();
    const [rollResult, setRollResult] = useState<DiceRollResult | null>(null);

    const performAnimalAttack = useCallback(() => {
        if (!npc.attackDice) return;
        
        // Animals use their attackDice for combat rolls
        const result = diceService.rollSkillCheck(
            npc.attackDice,  // Animal's attack dice
            0,               // No stress dice for animals
            Skill.CloseCombat // Use Close Combat as the skill type
        );
        setRollResult(result);

        addChatMessage({
            characterId: npc.id,
            characterName: npc.name,
            content: `attacks with ${npc.attackDice} dice! ${result.successes > 0 ? `Hit for ${npc.damage} damage!` : 'Missed!'}`,
            type: 'ROLL',
            rollResult: result,
        });
    }, [npc, addChatMessage]);

    if (!npc.attackDice) {
        return (
            <div>
                <h4 className="text-md font-bold text-red-400 mb-2">🐾 Animal Combat</h4>
                <p className="text-gray-400 text-sm">No attack dice configured for this animal.</p>
            </div>
        );
    }

    return (
        <div>
            <h4 className="text-md font-bold text-red-400 mb-2">🐾 Animal Combat</h4>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-300 text-sm">Attack:</span>
                <span className="text-white font-bold">{npc.attackDice} dice</span>
                <span className="text-gray-300 text-sm">•</span>
                <span className="text-gray-300 text-sm">Damage:</span>
                <span className="text-white font-bold">{npc.damage}</span>
            </div>
            
            <button
                onClick={performAnimalAttack}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors font-medium"
            >
                🎯 Attack Roll
            </button>

            {rollResult && (
                <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-center">
                            <div className="text-xl font-bold text-white">{rollResult.baseDicePool}</div>
                            <div className="text-xs uppercase text-gray-400">Attack Dice</div>
                        </div>
                        <div className={`p-2 rounded-lg text-center ${rollResult.successes > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <div className={`text-xl font-bold ${rollResult.successes > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {rollResult.successes > 0 ? "HIT!" : "MISS"}
                            </div>
                            <div className="text-xs text-gray-300">
                                {rollResult.successes > 0 ? `${npc.damage} damage` : '0 damage'}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {rollResult.baseDice.map((d, i) => <Die key={`animal-${i}`} value={d} size="md" />)}
                    </div>
                </div>
            )}
        </div>
    )
}

const NpcListItem: React.FC<NpcListItemProps> = ({ npc, showOnlyHavenSurvivors = false, allowHavenManagement = false }) => {
  const { gameState, isEditMode, removeNpc, designateCompanion, upgradeNpcToPc, addNpcToHaven, removeNpcFromHaven } = useGameState();
  const [isExpanded, setIsExpanded] = useState(false);

  const headerBg = npc.health > 0 ? 'bg-gray-700/50 hover:bg-gray-700/80' : 'bg-red-900/40 hover:bg-red-900/60';
  const headerTextColor = npc.health > 0 ? 'text-white' : 'text-red-300';
  
  const trainedSkills = Object.entries(npc.skillExpertise)
    .filter(([, expertise]) => expertise !== SkillExpertise.None)
    .map(([skill, expertise]) => `${skill} (${expertise})`)
    .join(', ');

  const mainPc = gameState.characters[0];
  const isPcDead = gameState.gameMode === 'Solo' && mainPc && mainPc.health <= 0;

  const handleUpgrade = () => {
    if (window.confirm(`Your character has fallen. Do you want to continue playing as ${npc.name}?`)) {
        upgradeNpcToPc(npc.id);
    }
  }

  const ReadOnlyView = () => (
    <div className="space-y-3 text-sm animate-fade-in">
        <div>
            <h4 className="font-bold text-red-400">Issues</h4>
            <p className="text-gray-300 italic">{npc.issues.length > 0 ? npc.issues.join(', ') : 'None'}</p>
        </div>
        <div>
            <h4 className="font-bold text-red-400">Inventory</h4>
            <p className="text-gray-300">{npc.inventory.length > 0 ? npc.inventory.join(', ') : 'None'}</p>
        </div>
        {npc.isAnimal ? (
          <div>
            <h4 className="font-bold text-red-400">Combat Stats</h4>
            <p className="text-gray-300">
              Attack Dice: {npc.attackDice || 'Unknown'} | 
              Damage: {npc.damage || 'Unknown'} | 
              Health: {npc.health}
            </p>
            <p className="text-yellow-400 text-xs mt-1">
              Animals use Attack Dice for combat instead of skills.
            </p>
          </div>
        ) : (
          <div>
            <h4 className="font-bold text-red-400">Notable Skills</h4>
            <p className="text-gray-300">{trainedSkills || 'None'}</p>
          </div>
        )}
        {npc.isAnimal ? <AnimalDiceRoller npc={npc} /> : <NpcDiceRoller npc={npc} />}
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <header 
        className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${headerBg}`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`npc-details-${npc.id}`}
      >
        <div className="flex-grow flex items-center gap-2">
            {gameState.gameMode === 'Solo' && (
                <button
                    onClick={(e) => { e.stopPropagation(); designateCompanion(npc.id); }}
                    className={`p-1 rounded-full transition-colors ${npc.isCompanion ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-300'}`}
                    aria-label={npc.isCompanion ? 'Unset as Companion' : 'Set as Companion'}
                >
                    <StarIcon filled={npc.isCompanion} />
                </button>
            )}
          <div>
            <p className={`font-bold ${headerTextColor}`}>
              {npc.isAnimal && <span className="text-green-400">🐾 </span>}
              {npc.name} 
              {npc.isCompanion && <span className="text-xs text-yellow-400">(Companion)</span>}
              {npc.isAnimal && <span className="text-xs text-green-400">(Animal)</span>}
            </p>
            <p className="text-sm font-normal text-gray-400">{npc.archetype}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-2">
            {isPcDead && npc.isCompanion && (
                <button
                    onClick={handleUpgrade}
                    className="bg-green-700 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-md text-sm animate-pulse"
                >
                    Upgrade to PC
                </button>
            )}
            <div className="text-center">
                <p className="font-bold text-lg">{npc.health}</p>
                <p className="text-xs text-gray-400 uppercase">HP</p>
            </div>
            {npc.isAnimal && npc.attackDice && (
                <div className="text-center">
                    <p className="font-bold text-lg text-green-400">{npc.attackDice}</p>
                    <p className="text-xs text-gray-400 uppercase">ATK</p>
                </div>
            )}
            {npc.isAnimal && npc.damage && (
                <div className="text-center">
                    <p className="font-bold text-lg text-red-400">{npc.damage}</p>
                    <p className="text-xs text-gray-400 uppercase">DMG</p>
                </div>
            )}
            {isEditMode && (
                 <InlineConfirmation
                    question="Delete?"
                    onConfirm={() => removeNpc(npc.id, npc.name)}
                >
                    {(startConfirmation) => (
                         <button
                            onClick={(e) => { e.stopPropagation(); startConfirmation(e); }}
                            className="text-gray-400 hover:text-red-400 p-2 rounded-full"
                            aria-label={`Delete ${npc.name}`}
                        >
                            <TrashIcon />
                        </button>
                    )}
                </InlineConfirmation>
            )}
            
            {/* Haven Management Buttons */}
            {isEditMode && allowHavenManagement && (
                <>
                    {showOnlyHavenSurvivors ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); removeNpcFromHaven(npc.id); }}
                            className="text-orange-400 hover:text-orange-300 p-2 rounded-full text-xs"
                            aria-label={`Remove ${npc.name} from haven`}
                            title="Remove from Haven"
                        >
                            ↗
                        </button>
                    ) : (
                        npc.isInHaven === false && (
                            <button
                                onClick={(e) => { e.stopPropagation(); addNpcToHaven(npc.id); }}
                                className="text-green-400 hover:text-green-300 p-2 rounded-full text-xs"
                                aria-label={`Add ${npc.name} to haven`}
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
          id={`npc-details-${npc.id}`} 
          className="border-t border-gray-600 bg-gray-800/50"
        >
          {isEditMode ? (
            <div className="animate-fade-in p-4"><NpcSheet npc={npc} /></div>
          ) : (
            <div className="p-4">
              <ReadOnlyView />
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default NpcListItem;