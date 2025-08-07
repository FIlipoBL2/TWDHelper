

import React, { useState, useRef } from 'react';
import { Character, Attribute, Skill, Talent, Archetype } from '../types';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import DiceRoller from './DiceRoller';
import Inventory from './Inventory';
import EditableField from './common/EditableField';
import { TrashIcon, PencilIcon, CheckIcon, PlusIcon, UploadIcon } from './common/Icons';
import { TALENT_DEFINITIONS, SHATTERED_STATES, ALL_SKILLS, XP_COST_FOR_TALENT, ARCHETYPE_DEFINITIONS, SKILL_DEFINITIONS } from '../constants';
import TakeDamage from './TakeDamage';
import HandleFear from './HandleFear';
import XpAward from './XpAward';
import InlineConfirmation from './common/InlineConfirmation';

interface CharacterSheetProps {
  character: Character;
}

const StatBlock: React.FC<{ title: string; items: Record<string, number>, isEditing: boolean, onUpdate: (key: string, value: number) => void, highlightKey?: string }> = ({ title, items, isEditing, onUpdate, highlightKey }) => (
  <Card>
    <h3 className="text-xl font-bold text-red-500 mb-3">{title}</h3>
    <ul className="space-y-2">
      {Object.entries(items).map(([name, value]) => (
        <li key={name} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
          <span className={`font-medium ${highlightKey === name ? 'text-red-400' : 'text-gray-300'}`}>{name}</span>
          {isEditing ? (
             <input 
                type="number"
                value={value}
                onChange={(e) => onUpdate(name, parseInt(e.target.value, 10) || 0)}
                className="w-16 bg-gray-900 text-white font-bold text-lg text-right rounded p-1 border border-gray-600"
             />
          ) : (
            <span className="font-bold text-white text-lg">{value}</span>
          )}
        </li>
      ))}
    </ul>
  </Card>
);

const EditableTalentItem: React.FC<{characterId: string, talent: Talent}> = ({ characterId, talent }) => {
    const { updateTalent, removeTalent } = useGameState();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(talent.name);
    const [editedDescription, setEditedDescription] = useState(talent.description);
    const [editedBonus, setEditedBonus] = useState(talent.bonus || 0);
    const [editedSkillAffected, setEditedSkillAffected] = useState(talent.skillAffected);
    const [editedPrerequisiteNote, setEditedPrerequisiteNote] = useState(talent.prerequisiteNote || '');

    const handleSave = () => {
        const updates: Partial<Talent> = {
            name: editedName,
            description: editedDescription,
            prerequisiteNote: editedPrerequisiteNote,
        };
        if (editedBonus > 0) {
            updates.bonus = editedBonus;
            updates.skillAffected = editedSkillAffected;
        } else {
            updates.bonus = undefined;
            updates.skillAffected = undefined;
        }
        updateTalent(characterId, talent.id, updates);
        setIsEditing(false);
    };

    return (
        <div className="bg-gray-700/50 p-3 rounded">
            {isEditing ? (
                <div className="space-y-2">
                    <input 
                        type="text"
                        value={editedName}
                        onChange={e => setEditedName(e.target.value)}
                        className="w-full bg-gray-900 border-gray-600 rounded p-1 font-bold text-red-400"
                        placeholder="Talent Name"
                    />
                    <textarea 
                        value={editedDescription}
                        onChange={e => setEditedDescription(e.target.value)}
                        className="w-full bg-gray-900 border-gray-600 rounded p-1 text-sm text-gray-300"
                        placeholder="Talent Description"
                        rows={3}
                    />
                    <textarea 
                        value={editedPrerequisiteNote}
                        onChange={e => setEditedPrerequisiteNote(e.target.value)}
                        className="w-full bg-gray-900 border-gray-600 rounded p-1 text-sm text-gray-400 italic"
                        placeholder="Prerequisite Note..."
                        rows={2}
                    />
                     <div className="flex gap-2 items-center">
                        <input 
                            type="number"
                            value={editedBonus}
                            onChange={e => setEditedBonus(Number(e.target.value))}
                            className="w-20 bg-gray-900 border-gray-600 rounded p-1"
                            placeholder="Bonus"
                        />
                        <select 
                            value={editedSkillAffected || ''} 
                            onChange={e => setEditedSkillAffected(e.target.value as Skill || undefined)}
                            className="flex-grow bg-gray-900 border-gray-600 rounded p-1"
                            disabled={editedBonus <= 0}
                        >
                            <option value="">-- General Bonus --</option>
                            {ALL_SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="text-green-500 hover:text-green-400"><CheckIcon/></button>
                        <InlineConfirmation question="Delete?" onConfirm={() => removeTalent(characterId, talent.id)}>
                            {start => <button onClick={start} className="text-red-500 hover:text-red-400"><TrashIcon/></button>}
                        </InlineConfirmation>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-red-400">{talent.name}</h4>
                        <div className="flex gap-2">
                           <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-white"><PencilIcon/></button>
                           <InlineConfirmation question="Delete?" onConfirm={() => removeTalent(characterId, talent.id)}>
                                {start => <button onClick={start} className="text-red-500 hover:text-red-400"><TrashIcon/></button>}
                           </InlineConfirmation>
                        </div>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{talent.description}</p>
                    {talent.prerequisiteNote && <p className="text-xs text-gray-400 italic mt-1">Note: {talent.prerequisiteNote}</p>}
                </div>
            )}
        </div>
    );
};


const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
  const { gameState, isEditMode, updateCharacter, removeCharacter, addTalent, toggleActiveTalent, purchaseTalent, purchaseSkillPoint, removeCriticalInjury, rollAndAddCriticalInjury } = useGameState();
  const [customTalentName, setCustomTalentName] = useState('');
  const [customTalentDescription, setCustomTalentDescription] = useState('');
  const [customTalentBonus, setCustomTalentBonus] = useState(0);
  const [customTalentSkillAffected, setCustomTalentSkillAffected] = useState<Skill | undefined>();
  const [selectedPredefinedTalent, setSelectedPredefinedTalent] = useState('');
  const [showPurchaseTalents, setShowPurchaseTalents] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const allTalentDefinitions = [...TALENT_DEFINITIONS, ...gameState.customTalents];
  const selectedTalentInfo = allTalentDefinitions.find(t => t.name === selectedPredefinedTalent);

  const allPcs = gameState.characters.filter(c => c.id !== character.id);
  const allNpcs = gameState.npcs;
  const pcAnchor = gameState.characters.find(c => c.id === character.pcAnchorId);
  const npcAnchor = gameState.npcs.find(n => n.id === character.npcAnchorId);
  
  const hasLoneWolf = character.talents.some(talent => talent.name === 'Lone Wolf');
  
  const pcAnchorOptions = [...allPcs];
  if(hasLoneWolf) {
      pcAnchorOptions.unshift(character);
  }
  
  const handleTokenImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        updateCharacter(character.id, { tokenImage: base64Image });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatUpdate = (statType: 'attributes' | 'skills', key: string, value: number) => {
    updateCharacter(character.id, {
      [statType]: {
        ...character[statType],
        [key]: value
      }
    });
  };

  const handleAddPredefinedTalent = () => {
    if (!selectedPredefinedTalent) return;
    const talentData = allTalentDefinitions.find(t => t.name === selectedPredefinedTalent);
    if(talentData){
        addTalent(character.id, talentData);
    }
    setSelectedPredefinedTalent('');
  }

  const handleAddCustomTalent = () => {
    if (!customTalentName.trim()) return;
    const newTalentData: Omit<Talent, 'id'> = {
        name: customTalentName,
        description: customTalentDescription,
    };
    if (customTalentBonus > 0) {
        newTalentData.bonus = customTalentBonus;
        if(customTalentSkillAffected) {
            newTalentData.skillAffected = customTalentSkillAffected;
        }
    }

    addTalent(character.id, newTalentData);
    setCustomTalentName('');
    setCustomTalentDescription('');
    setCustomTalentBonus(0);
    setCustomTalentSkillAffected(undefined);
  }
  
  const handlePurchaseTalent = (talentData: Omit<Talent, 'id'>) => {
    if (window.confirm(`Spend 10 XP to purchase the "${talentData.name}" talent?`)) {
        const success = purchaseTalent(character.id, talentData);
        if (!success) {
            alert("Not enough XP!");
        }
    }
  }

  const characterHasTalent = (talentName: string) => {
    return character.talents.some(t => t.name === talentName);
  }

  const getHealthStatus = (health: number): { text: string; color: string } => {
    if (health >= 3) return { text: 'Unharmed', color: 'bg-green-800/50' };
    if (health === 2) return { text: 'Bruised', color: 'bg-yellow-800/50' };
    if (health === 1) return { text: 'Battered', color: 'bg-orange-800/50' };
    return { text: 'Broken', color: 'bg-red-800/80' };
  };

  const healthStatus = getHealthStatus(character.health);
  const totalInjuryPenalty = character.criticalInjuries.reduce((sum, injury) => sum + (typeof injury.penalty === 'number' ? injury.penalty : 0), 0);
  
  const isCustomArchetype = character.archetype === Archetype.Custom;
  const archetypeDisplayName = isCustomArchetype ? (character.customArchetypeName || "Custom Archetype") : character.archetype;
  const tokenImageSrc = character.tokenImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234A5568'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='%23E2E8F0' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";


  return (
    <div className="space-y-6">
       {/* Survivor Profile Card */}
        <Card className="bg-gray-800/50">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex-grow">
                    <EditableField 
                        isEditing={isEditMode}
                        value={character.name}
                        onChange={(v) => updateCharacter(character.id, { name: v })}
                        inputClassName="text-3xl font-bold text-white leading-tight"
                    />
                     <EditableField 
                        isEditing={isEditMode}
                        value={archetypeDisplayName}
                        onChange={(v) => updateCharacter(character.id, { archetype: v as Archetype, customArchetypeName: v })}
                        inputClassName="text-xl text-red-400 font-medium"
                        placeholder='Unnamed Custom'
                    />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <img src={tokenImageSrc} alt="Character Token" className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"/>
                    {isEditMode && (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleTokenImageUpload} className="hidden" accept="image/*"/>
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-md text-xs">
                                <UploadIcon /> Change
                            </button>
                        </>
                    )}
                  </div>
                    {isEditMode && (
                         <InlineConfirmation
                            question={`Delete ${character.name}?`}
                            onConfirm={() => removeCharacter(character.id, character.name)}
                        >
                            {start => (
                                <button 
                                    onClick={start}
                                    className="bg-red-900/50 hover:bg-red-900/80 text-red-300 font-bold py-2 px-3 rounded-md transition-colors flex items-center gap-2 self-start"
                                >
                                    <TrashIcon /> Delete
                                </button>
                            )}
                        </InlineConfirmation>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
                {/* Drive & Issue */}
                <div className="space-y-4">
                  <div className="space-y-2">
                      <h4 className="font-bold text-lg text-red-400">Drive</h4>
                      <p className="text-xs text-gray-400 italic">"Something that made you grit your teeth and push through everything you had to endure."</p>
                      <EditableField 
                          isEditing={isEditMode}
                          type="textarea"
                          value={character.drive}
                          onChange={(v) => updateCharacter(character.id, { drive: v })}
                          inputClassName="text-gray-200 text-sm"
                      />
                  </div>
                  <div className="space-y-2">
                      <h4 className="font-bold text-lg text-red-400">Issue</h4>
                      <p className="text-xs text-gray-400 italic">"Your fear, your shame, your lust. Everyone has an Issue that complicates their lives."</p>
                      <EditableField 
                          isEditing={isEditMode}
                          type="textarea"
                          value={character.issue}
                          onChange={(v) => updateCharacter(character.id, { issue: v })}
                          inputClassName="text-gray-200 text-sm"
                      />
                  </div>
                </div>

                {/* Anchors, Shattered State, & Injuries */}
                <div className="space-y-4">
                   <div className="space-y-2">
                      <h4 className="font-bold text-lg text-red-400">Anchors</h4>
                      <p className="text-xs text-gray-400 italic">"People in the group that you trust and love..."</p>
                      <div className="space-y-3 pt-2">
                          <div>
                              <label className="block text-sm font-medium text-gray-300">PC Anchor</label>
                               {isEditMode ? (
                                    <select 
                                        value={character.pcAnchorId || ''} 
                                        onChange={e => updateCharacter(character.id, { pcAnchorId: e.target.value || undefined })}
                                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                                    >
                                        <option value="">-- None --</option>
                                        {pcAnchorOptions.map(pc => <option key={pc.id} value={pc.id}>{pc.id === character.id ? `${pc.name} (Themselves)` : pc.name}</option>)}
                                    </select>
                               ) : (
                                    <p className="font-bold text-white pl-2">{pcAnchor ? (pcAnchor.id === character.id ? `${pcAnchor.name} (Themselves)` : pcAnchor.name) : 'None'}</p>
                               )}
                               <EditableField
                                  isEditing={isEditMode}
                                  type="textarea"
                                  value={character.pcAnchorDescription || ''}
                                  onChange={(v) => updateCharacter(character.id, { pcAnchorDescription: v })}
                                  inputClassName="text-gray-300 text-sm italic mt-1 w-full"
                                  placeholder="Notes on PC Anchor..."
                               />
                          </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-300">NPC Anchor</label>
                              {isEditMode ? (
                                  <select 
                                      value={character.npcAnchorId || ''} 
                                      onChange={e => updateCharacter(character.id, { npcAnchorId: e.target.value || undefined })}
                                      className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                                  >
                                      <option value="">-- None --</option>
                                      {allNpcs.map(npc => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
                                  </select>
                              ): (
                                  <p className="font-bold text-white pl-2">{npcAnchor?.name || 'None'}</p>
                              )}
                              <EditableField
                                  isEditing={isEditMode}
                                  type="textarea"
                                  value={character.npcAnchorDescription || ''}
                                  onChange={(v) => updateCharacter(character.id, { npcAnchorDescription: v })}
                                  inputClassName="text-gray-300 text-sm italic mt-1 w-full"
                                  placeholder="Notes on NPC Anchor..."
                               />
                          </div>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <h4 className="font-bold text-lg text-red-400">Shattered State</h4>
                      {isEditMode ? (
                          <div className="space-y-2 pt-2">
                             <select
                                value={character.isShattered || ''}
                                onChange={(e) => updateCharacter(character.id, { isShattered: e.target.value || undefined })}
                                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                             >
                                <option value="">-- Stable --</option>
                                {SHATTERED_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <EditableField 
                                isEditing={isEditMode}
                                value={character.isShattered || ''}
                                onChange={(v) => updateCharacter(character.id, { isShattered: v || undefined })}
                                type="textarea"
                                label="Custom State"
                                labelClassName="text-sm"
                                inputClassName="text-sm"
                            />
                          </div>
                      ) : (
                         <div className="space-y-1 pt-2">
                              <p className={`text-lg font-bold ${character.isShattered ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {character.isShattered ? 'Shattered' : 'Stable'}
                              </p>
                             {character.isShattered && <p className="text-sm text-yellow-300">{character.isShattered}</p>}
                          </div>
                      )}
                  </div>
                   <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-lg text-red-400">Critical Injuries</h4>
                            {isEditMode && (
                                <button 
                                    onClick={() => rollAndAddCriticalInjury(character.id)}
                                    className="bg-red-900/50 hover:bg-red-800 text-white font-bold py-1 px-3 rounded-md text-sm"
                                >
                                    Roll Injury
                                </button>
                            )}
                        </div>
                        <div className="pt-2">
                            {character.criticalInjuries.length > 0 ? (
                                <ul className="space-y-2">
                                    {character.criticalInjuries.map((injury, index) => (
                                        <li key={index} className="bg-red-900/40 p-2 rounded-md text-sm flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-red-300">{injury.name}</p>
                                                <p className="text-gray-300">Penalty: <span className="font-semibold">{injury.penalty}</span> | Recovery: <span className="font-semibold">{injury.recoveryTime}</span></p>
                                                {injury.lethal && <p className="text-xs font-bold text-yellow-400 animate-pulse">LETHAL</p>}
                                            </div>
                                            {isEditMode && (
                                                <InlineConfirmation question="Remove?" onConfirm={() => removeCriticalInjury(character.id, index)}>
                                                    {start => (
                                                        <button onClick={start} className="text-gray-400 hover:text-red-400 flex-shrink-0 ml-2 p-1">
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </InlineConfirmation>
                                            )}
                                        </li>
                                    ))}
                                    <li className="flex justify-between items-center bg-gray-700/50 p-2 rounded mt-2 border-t border-red-700">
                                        <span className="font-medium text-gray-300">Total Penalty</span>
                                        <span className="font-bold text-red-400 text-lg">{totalInjuryPenalty}</span>
                                    </li>
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm">None.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Core Info & Dice Roller */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className={`text-center flex flex-col justify-between p-4 transition-colors ${healthStatus.color}`}>
                <div className="flex-grow flex flex-col items-center justify-center min-h-[120px]">
                  {isEditMode ? (
                      <EditableField isEditing={isEditMode} value={character.health} onChange={v => updateCharacter(character.id, {health: Number(v)})} type="number" inputClassName="text-4xl font-bold text-center p-3 w-24" />
                  ) : (
                      <div className="flex items-center justify-center gap-4">
                          <button onClick={() => updateCharacter(character.id, { health: Math.max(0, character.health - 1) })} disabled={character.health <= 0} className="bg-gray-700/50 hover:bg-gray-600/50 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors disabled:opacity-50">-</button>
                          <span className="text-4xl font-bold text-white min-w-[60px]">{character.health}</span>
                          <button onClick={() => updateCharacter(character.id, { health: Math.min(character.maxHealth, character.health + 1) })} disabled={character.health >= character.maxHealth} className="bg-gray-700/50 hover:bg-gray-600/50 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors disabled:opacity-50">+</button>
                      </div>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Health</div>
                  <div className="text-xs font-semibold text-gray-300">{healthStatus.text}</div>
                </div>
              </Card>
              <Card className="text-center flex flex-col justify-between p-4">
                  <div className="flex-grow flex items-center justify-center min-h-[120px]">
                    {isEditMode ? (
                        <EditableField isEditing={isEditMode} value={character.stress} onChange={v => updateCharacter(character.id, {stress: Number(v)})} type="number" inputClassName="text-4xl font-bold text-center p-3 w-24" />
                    ) : (
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => updateCharacter(character.id, { stress: Math.max(0, character.stress - 1) })} disabled={character.stress <= 0} className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors disabled:opacity-50">-</button>
                            <span className="text-4xl font-bold text-white min-w-[60px]">{character.stress}</span>
                            <button onClick={() => updateCharacter(character.id, { stress: Math.min(character.maxStress, character.stress + 1) })} disabled={character.stress >= character.maxStress} className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors disabled:opacity-50">+</button>
                        </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Stress</div>
                  </div>
              </Card>
              <Card className="text-center flex flex-col justify-between p-4">
                  <div className="flex-grow flex items-center justify-center min-h-[120px]">
                    {isEditMode ? (
                        <EditableField isEditing={isEditMode} value={character.xp} onChange={v => updateCharacter(character.id, {xp: Number(v)})} type="number" inputClassName="text-4xl font-bold text-center p-3 w-24" />
                    ) : (
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => updateCharacter(character.id, { xp: Math.max(0, character.xp - 1) })} className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors" aria-label="Decrease XP">-</button>
                            <span className="text-4xl font-bold text-white min-w-[60px]">{character.xp}</span>
                            <button onClick={() => updateCharacter(character.id, { xp: character.xp + 1 })} className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors" aria-label="Increase XP">+</button>
                        </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">XP</div>
                  </div>
              </Card>
          </div>
          
          <XpAward character={character} />

          <TakeDamage character={character} />

          <HandleFear character={character} />

          <DiceRoller character={character} />

          <Inventory character={character} />

          <Card>
            <h3 className="text-xl font-bold text-red-500 mb-3">Talents</h3>
            <div className="space-y-3">
                {character.talents.map((talent) => (
                    isEditMode 
                        ? <EditableTalentItem key={talent.id} characterId={character.id} talent={talent} />
                        : (
                            <div key={talent.id} className="bg-gray-700/50 p-3 rounded">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-red-400">{talent.name}</h4>
                                    {talent.bonus && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-green-400 font-bold">+{talent.bonus} {talent.skillAffected || ''}</span>
                                            <input
                                                type="checkbox"
                                                checked={character.activeTalentIds.includes(talent.id)}
                                                onChange={() => toggleActiveTalent(character.id, talent.id)}
                                                className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-red-600 focus:ring-red-500"
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-300 mt-1">{talent.description}</p>
                                {talent.prerequisiteNote && <p className="text-xs text-gray-400 italic mt-1">Note: {talent.prerequisiteNote}</p>}
                            </div>
                        )
                ))}
            </div>
            {!isEditMode && character.xp >= XP_COST_FOR_TALENT && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <button 
                        onClick={() => setShowPurchaseTalents(!showPurchaseTalents)}
                        className="w-full bg-green-800/50 hover:bg-green-800/80 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                    >
                        {showPurchaseTalents ? 'Hide' : `Purchase New Talent (${XP_COST_FOR_TALENT} XP)`}
                    </button>
                    {showPurchaseTalents && (
                        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto p-1">
                            {allTalentDefinitions.map(talentDef => 
                                !characterHasTalent(talentDef.name) && (
                                    <div key={talentDef.name} className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <h5 className="font-bold text-red-400">{talentDef.name}</h5>
                                            <p className="text-sm text-gray-300 mt-1">{talentDef.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePurchaseTalent(talentDef)}
                                            className="bg-green-700 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors ml-4 flex-shrink-0"
                                        >
                                            Purchase
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            )}
            {isEditMode && (
                <div className="mt-6 pt-4 border-t border-gray-700 space-y-4">
                    {/* Add Predefined Talent */}
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-300 mb-2">Add Predefined Talent</h4>
                        <div className="flex gap-2">
                             <select
                                value={selectedPredefinedTalent}
                                onChange={e => setSelectedPredefinedTalent(e.target.value)}
                                className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                            >
                                <option value="">-- Select a Talent --</option>
                                {allTalentDefinitions.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                            <button onClick={handleAddPredefinedTalent} className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 rounded-md flex items-center"><PlusIcon/></button>
                        </div>
                        {selectedTalentInfo && (
                            <div className="mt-2 p-2 bg-gray-800 rounded-md border border-gray-700 text-sm">
                                <p className="text-gray-300">{selectedTalentInfo.description}</p>
                                {selectedTalentInfo.bonus && (
                                    <p className="font-bold text-green-400 mt-1">Bonus: +{selectedTalentInfo.bonus} {selectedTalentInfo.skillAffected || 'General'}</p>
                                )}
                            </div>
                        )}
                    </div>

                     {/* Add Custom Talent */}
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-300 mb-2">Create Custom Talent</h4>
                        <div className="space-y-2">
                            <input 
                                type="text"
                                value={customTalentName}
                                onChange={e => setCustomTalentName(e.target.value)}
                                placeholder="Custom Talent Name"
                                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                            />
                            <textarea 
                                value={customTalentDescription}
                                onChange={e => setCustomTalentDescription(e.target.value)}
                                placeholder="Custom Talent Description"
                                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                                rows={2}
                            />
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="number"
                                    value={customTalentBonus}
                                    onChange={e => setCustomTalentBonus(Number(e.target.value))}
                                    placeholder="Bonus"
                                    className="w-20 bg-gray-700 border-gray-600 rounded-md p-2"
                                />
                                <select 
                                    value={customTalentSkillAffected || ''} 
                                    onChange={e => setCustomTalentSkillAffected(e.target.value as Skill || undefined)}
                                    className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2"
                                    disabled={customTalentBonus <= 0}
                                >
                                    <option value="">-- General Bonus --</option>
                                    {ALL_SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <button onClick={handleAddCustomTalent} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 rounded-md">Create & Add</button>
                        </div>
                    </div>
                </div>
            )}
          </Card>
        </div>

        {/* Right Column: Attributes & Skills */}
        <div className="space-y-6">
          <StatBlock title="Attributes" items={character.attributes} isEditing={isEditMode} onUpdate={(key, value) => handleStatUpdate('attributes', key, value)} highlightKey={character.keyAttribute} />
           <Card>
                <h3 className="text-xl font-bold text-red-500 mb-3">Skills</h3>
                <div className="space-y-4">
                    {Object.values(Attribute).map(attribute => {
                        const skillsForAttribute = ALL_SKILLS.filter(skill => SKILL_DEFINITIONS.find(def => def.name === skill)?.attribute === attribute);
                        const isKeyAttribute = attribute === character.keyAttribute;
                        return (
                            <div key={attribute}>
                                <h4 className={`font-bold mb-2 ${isKeyAttribute ? 'text-red-400' : 'text-gray-300'}`}>{attribute}</h4>
                                <ul className="space-y-2">
                                    {skillsForAttribute.map(skillName => {
                                        const rank = character.skills[skillName] || 0;
                                        const nextRankCost = (rank + 1) * 5;
                                        return (
                                            <li key={skillName} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                                                <span className={`font-medium ${character.keySkill === skillName ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{skillName}</span>
                                                {isEditMode ? (
                                                    <input 
                                                        type="number"
                                                        value={rank}
                                                        onChange={(e) => handleStatUpdate('skills', skillName, parseInt(e.target.value, 10) || 0)}
                                                        className="w-16 bg-gray-900 text-white font-bold text-lg text-right rounded p-1 border border-gray-600"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {character.xp >= nextRankCost && rank < 5 && (
                                                            <button 
                                                                onClick={() => purchaseSkillPoint(character.id, skillName)} 
                                                                className="bg-green-700 hover:bg-green-600 text-white font-bold rounded-md px-2 py-0.5 text-xs"
                                                                title={`Spend ${nextRankCost} XP to raise to ${rank + 1}`}
                                                            >
                                                                +
                                                            </button>
                                                        )}
                                                        <span className="font-bold text-white text-lg w-6 text-center">{rank}</span>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;