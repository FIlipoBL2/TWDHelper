
import React, { useRef } from 'react';
import { Character, Archetype, Attribute, Talent, ArchetypeDefinition, Skill } from '../types';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { 
    ATTRIBUTE_CREATION_POINTS, 
    ARCHETYPE_DEFINITIONS,
    TALENT_DEFINITIONS,
    MIN_ATTRIBUTE_AT_CREATION,
    MAX_ATTRIBUTE_AT_CREATION,
    MAX_KEY_ATTRIBUTE_AT_CREATION,
    SKILL_CREATION_POINTS,
    SOLO_SKILL_CREATION_POINTS,
    MAX_SKILL_AT_CREATION,
    MAX_KEY_SKILL_AT_CREATION,
    ALL_SKILLS,
    SKILL_DEFINITIONS,
} from '../constants';
import { UploadIcon } from './common/Icons';

interface CharacterCreatorProps {
  character: Character;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ character }) => {
  const { gameState, updateCharacter, finalizeCharacterCreation } = useGameState();
  const { customArchetypes, customTalents } = gameState;
  const isSoloMode = gameState.gameMode === 'Solo';
  const requiredTalents = isSoloMode ? 2 : 1;
  const totalSkillPoints = isSoloMode ? SOLO_SKILL_CREATION_POINTS : SKILL_CREATION_POINTS;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allArchetypeDefinitions = [...ARCHETYPE_DEFINITIONS, ...customArchetypes];
  const allTalentDefinitions = [...TALENT_DEFINITIONS, ...customTalents];
  
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

  const handleArchetypeChange = (newArchetypeName: string) => {
      const archetypeDef = allArchetypeDefinitions.find(a => a.name === newArchetypeName);
      if (!archetypeDef) return;

      const isStandardArchetype = Object.values(Archetype).includes(newArchetypeName as Archetype);

      updateCharacter(character.id, {
          archetype: isStandardArchetype ? newArchetypeName as Archetype : Archetype.Custom,
          customArchetypeName: isStandardArchetype ? undefined : newArchetypeName,
          keyAttribute: archetypeDef.keyAttribute,
          keySkill: archetypeDef.keySkill,
          attributes: { [Attribute.Strength]: 2, [Attribute.Agility]: 2, [Attribute.Wits]: 2, [Attribute.Empathy]: 2 },
          skills: Object.fromEntries(Object.values(Skill).map(skill => [skill, 0])) as Record<Skill, number>,
          talents: [],
      });
  };

  const selectedArchetypeDef = allArchetypeDefinitions.find(a => a.name === (character.archetype === Archetype.Custom ? character.customArchetypeName : character.archetype));
  
  const talentsToShow = character.archetype === Archetype.Custom
    ? allTalentDefinitions
    : allTalentDefinitions.filter(t => t.archetype === character.archetype || !t.archetype);
  
  const attributePointsUsed = Object.values(character.attributes).reduce((sum, val) => sum + val, 0);
  const attributePointsRemaining = ATTRIBUTE_CREATION_POINTS - attributePointsUsed;

  const skillPointsUsed = Object.values(character.skills).reduce((sum, val) => sum + val, 0);
  const skillPointsRemaining = totalSkillPoints - skillPointsUsed;

  const handleAttributeUpdate = (attrName: Attribute, value: number) => {
    const currentTotal = attributePointsUsed - character.attributes[attrName] + value;
    if (currentTotal > ATTRIBUTE_CREATION_POINTS) return; // Don't allow spending more than total

    updateCharacter(character.id, {
      attributes: { ...character.attributes, [attrName]: value }
    });
  };

  const handleSkillUpdate = (skillName: Skill, value: number) => {
    const keyAttr = character.keyAttribute;
    const isKeyAttributeSkill = SKILL_DEFINITIONS.find(s => s.name === skillName)?.attribute === keyAttr;

    const currentTotal = skillPointsUsed - (character.skills[skillName] || 0) + value;
    if (currentTotal > totalSkillPoints) return;
    if (value < 0) return;

    const maxRank = isKeyAttributeSkill ? MAX_KEY_SKILL_AT_CREATION : MAX_SKILL_AT_CREATION;
    if (value > maxRank) return;
    
    updateCharacter(character.id, {
      skills: { ...character.skills, [skillName]: value }
    });
  };

  const handleTalentSelect = (talent: Omit<Talent, 'id'>) => {
      const newTalent: Talent = { id: `talent-creation-${talent.name}-${Math.random()}`, ...talent };
      
      let newTalents = [...character.talents];
      const existingIndex = newTalents.findIndex(t => t.name === talent.name);

      if (existingIndex > -1) {
          // Talent already selected, so unselect it
          newTalents.splice(existingIndex, 1);
      } else {
          // Add new talent if there is space
          if (newTalents.length < requiredTalents) {
              newTalents.push(newTalent);
          }
      }
      updateCharacter(character.id, { talents: newTalents });
  };
  
  const isCustomArchetypeValid = character.archetype !== Archetype.Custom || (character.customArchetypeName && character.customArchetypeName.trim() !== '' && character.keySkill);
  const isComplete = attributePointsRemaining === 0 && skillPointsRemaining === 0 && character.talents.length === requiredTalents && isCustomArchetypeValid;
  
  const currentArchetypeName = (() => {
    if (character.archetype !== Archetype.Custom) {
      return character.archetype;
    }
    if (allArchetypeDefinitions.some(def => def.name === character.customArchetypeName)) {
      return character.customArchetypeName;
    }
    return Archetype.Custom;
  })();

  const tokenImageSrc = character.tokenImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234A5568'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='%23E2E8F0' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";

  return (
    <div className="space-y-6">
        <Card className="text-center">
            <h2 className="text-2xl font-bold text-red-500">Create Your Survivor</h2>
            <p className="text-gray-400 mt-1">Follow the steps below. Once all points are spent and talents are chosen, you can finalize your character.</p>
        </Card>

        {/* Step 0: Name & Token */}
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={character.name}
                            onChange={e => updateCharacter(character.id, { name: e.target.value })}
                            className="w-full bg-gray-700 p-2 rounded text-lg font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Drive</label>
                        <textarea
                            value={character.drive}
                            onChange={e => updateCharacter(character.id, { drive: e.target.value })}
                            className="w-full bg-gray-700 p-2 rounded text-sm"
                            rows={2}
                            placeholder="What keeps you going?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Issue</label>
                        <textarea
                            value={character.issue}
                            onChange={e => updateCharacter(character.id, { issue: e.target.value })}
                            className="w-full bg-gray-700 p-2 rounded text-sm"
                            rows={2}
                            placeholder="What's your biggest flaw or fear?"
                        />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                    <img src={tokenImageSrc} alt="Character Token" className="w-32 h-32 rounded-full object-cover border-4 border-gray-600"/>
                    <input type="file" ref={fileInputRef} onChange={handleTokenImageUpload} className="hidden" accept="image/*"/>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-sm">
                        <UploadIcon /> Upload Token
                    </button>
                </div>
            </div>
        </Card>

        {/* Step 1: Archetype */}
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-2">Step 1: Choose Your Archetype</h3>
            <p className="text-sm text-gray-400 mb-4">Your archetype determines your key attribute and key skill, granting them higher maximum values.</p>
            <select
                value={currentArchetypeName}
                onChange={e => handleArchetypeChange(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
            >
                {allArchetypeDefinitions.map(arch => (
                    <option key={arch.name} value={arch.name}>{arch.name}</option>
                ))}
            </select>
            {selectedArchetypeDef && (
                <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-gray-300">{selectedArchetypeDef.description}</p>
                     {character.archetype !== Archetype.Custom && <p className="text-sm mt-1">Key Attribute: <span className="font-bold text-red-400">{selectedArchetypeDef.keyAttribute}</span> | Key Skill: <span className="font-bold text-red-400">{selectedArchetypeDef.keySkill}</span></p>}
                </div>
            )}
             {character.archetype === Archetype.Custom && (
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                    <input
                        type="text"
                        placeholder="Enter Custom Archetype Name"
                        value={character.customArchetypeName || ''}
                        onChange={(e) => updateCharacter(character.id, { customArchetypeName: e.target.value })}
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white font-bold"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-300 mb-2">Choose Key Attribute:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(Attribute).map(attr => (
                                    <label key={attr} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border-2 transition-colors ${character.keyAttribute === attr ? 'bg-red-800/50 border-red-500' : 'bg-gray-700/50 border-gray-700 hover:border-red-600'}`}>
                                        <input
                                            type="radio"
                                            name="key-attribute"
                                            value={attr}
                                            checked={character.keyAttribute === attr}
                                            onChange={() => updateCharacter(character.id, { keyAttribute: attr })}
                                            className="hidden"
                                        />
                                        <span className="font-semibold text-white">{attr}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                         <div>
                            <p className="text-sm font-medium text-gray-300 mb-2">Choose Key Skill:</p>
                            <select
                                value={character.keySkill || ''}
                                onChange={(e) => updateCharacter(character.id, { keySkill: e.target.value as Skill })}
                                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                            >
                                <option value="">-- Select Key Skill --</option>
                                {ALL_SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </Card>

        {/* Step 2: Attributes */}
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-red-500">Step 2: Assign Attributes</h3>
                <div className="text-right">
                    <p className="font-bold text-lg text-white">{attributePointsRemaining}</p>
                    <p className="text-xs text-gray-400">Points Remaining</p>
                </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">All attributes start at 2. You have {ATTRIBUTE_CREATION_POINTS - (MIN_ATTRIBUTE_AT_CREATION * 4)} points to spend. Maximum is {MAX_ATTRIBUTE_AT_CREATION} for normal attributes and {MAX_KEY_ATTRIBUTE_AT_CREATION} for your key attribute.</p>
            <ul className="space-y-2">
                {Object.entries(character.attributes).map(([name, value]) => {
                    const isKey = name === character.keyAttribute;
                    const maxVal = isKey ? MAX_KEY_ATTRIBUTE_AT_CREATION : MAX_ATTRIBUTE_AT_CREATION;
                    return (
                        <li key={name} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                            <span className={`font-medium ${isKey ? 'text-red-400' : 'text-gray-300'}`}>{name} {isKey && '(Key)'}</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleAttributeUpdate(name as Attribute, value - 1)}
                                    disabled={value <= MIN_ATTRIBUTE_AT_CREATION}
                                    className="bg-gray-600 hover:bg-gray-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >-</button>
                                <span className="font-bold text-white text-lg w-6 text-center">{value}</span>
                                 <button
                                    onClick={() => handleAttributeUpdate(name as Attribute, value + 1)}
                                    disabled={value >= maxVal || attributePointsRemaining <= 0}
                                    className="bg-gray-600 hover:bg-gray-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >+</button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </Card>

        {/* Step 3: Skills */}
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-red-500">Step 3: Distribute Skill Points</h3>
                <div className="text-right">
                    <p className="font-bold text-lg text-white">{skillPointsRemaining}</p>
                    <p className="text-xs text-gray-400">Points Remaining</p>
                </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">You have {totalSkillPoints} points to spend. Maximum is {MAX_SKILL_AT_CREATION} for normal skills and {MAX_KEY_SKILL_AT_CREATION} for your key attribute's skills.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.values(Attribute).map(attribute => {
                    const skillsForAttribute = ALL_SKILLS.filter(skill => SKILL_DEFINITIONS.find(def => def.name === skill)?.attribute === attribute);
                    const isKeyAttribute = attribute === character.keyAttribute;

                    return (
                        <div key={attribute}>
                            <h4 className={`font-bold mb-2 ${isKeyAttribute ? 'text-red-400' : 'text-gray-300'}`}>{attribute}</h4>
                            <div className="space-y-2">
                                {skillsForAttribute.map(skillName => {
                                    const value = character.skills[skillName] || 0;
                                    const maxRank = isKeyAttribute ? MAX_KEY_SKILL_AT_CREATION : MAX_SKILL_AT_CREATION;
                                    
                                    return (
                                        <div key={skillName} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                                            <span className={`font-medium ${isKeyAttribute ? 'text-red-400' : 'text-gray-300'}`}>{skillName}</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleSkillUpdate(skillName, value - 1)}
                                                    disabled={value <= 0}
                                                    className="bg-gray-600 hover:bg-gray-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                >-</button>
                                                <span className="font-bold text-white text-lg w-6 text-center">{value}</span>
                                                <button
                                                    onClick={() => handleSkillUpdate(skillName, value + 1)}
                                                    disabled={value >= maxRank || skillPointsRemaining <= 0}
                                                    className="bg-gray-600 hover:bg-gray-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                >+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>

        {/* Step 4: Talent */}
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-2">Step 4: Select Starting Talent(s)</h3>
            <p className="text-sm text-gray-400 mb-4">Choose {requiredTalents} starting talent(s). {character.archetype === Archetype.Custom ? 'You may choose from any available talent.' : 'They must be from your chosen archetype.'}</p>
            {isSoloMode && <p className="text-sm text-yellow-400 mb-4 italic">Solo Mode Rules: Select 2 talents. A knife will be added if you have no melee weapon.</p>}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {talentsToShow.map(talent => (
                    <div 
                        key={talent.name}
                        onClick={() => handleTalentSelect(talent)}
                        className={`p-3 rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                            character.talents.some(t => t.name === talent.name)
                                ? 'bg-red-800/50 border-red-500'
                                : 'bg-gray-700/50 border-gray-700 hover:border-red-600'
                        }`}
                    >
                        <h4 className="font-bold text-lg text-white">{talent.name}</h4>
                        <p className="text-sm text-gray-300 mt-1">{talent.description}</p>
                    </div>
                ))}
            </div>
        </Card>

        <div className="mt-6 text-center">
            <button
                onClick={() => finalizeCharacterCreation(character.id)}
                disabled={!isComplete}
                className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isComplete ? "Finalize Character" : "Complete All Steps to Continue"}
            </button>
            {!isComplete && (
                <p className="text-sm text-yellow-400 mt-2">
                    {attributePointsRemaining > 0 && `${attributePointsRemaining} attribute points to spend. `}
                    {skillPointsRemaining > 0 && `${skillPointsRemaining} skill points to spend. `}
                    {character.talents.length < requiredTalents && `Select ${requiredTalents - character.talents.length} more talent(s). `}
                    {!isCustomArchetypeValid && 'Complete custom archetype details.'}
                </p>
            )}
        </div>
    </div>
  );
};

export default CharacterCreator;