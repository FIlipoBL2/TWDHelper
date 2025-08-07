

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { GameState, Character, NPC, SessionState, Haven, Skill, InventoryItem, ChatMessage, HavenProject, Talent, Clock, Combatant, RangeCategory, CombatState, Vehicle, ThreatState, CombatType, GameMode, SurvivalScenarioDefinition, DiceRollResult, SkillExpertise, SwarmRoundResult, TableRollResult, Archetype, ArchetypeDefinition, Attribute, BrawlActionType, GameStateContextType, ChatMessageType, CriticalInjury, ClockType, Faction, CombatSetupPayload, GridObject, CombatSetupParticipant, BrawlParticipant, BrawlState, BattlemapObject, AIBackgroundPrompt, RulerMeasurement } from '../types';
import { INITIAL_GAME_STATE, SKILL_DEFINITIONS, NPC_SURVIVOR_GROUPS, DEFAULT_PC_TEMPLATE, CRITICAL_INJURY_TABLE, BRAWL_PHASES, BRAWL_ACTION_DEFINITIONS, THREAT_LEVELS, SWARM_COMBAT_TABLE, WALKER_ATTACK_TABLE, OVERWHELMED_TABLE, VEHICLE_CONDITION_TABLE, CRASH_OBJECTS_TABLE, SURVIVAL_SCENARIOS, CRITICAL_VEHICLE_DAMAGE_TABLE, MESSING_UP_IN_COMBAT_TABLE, ITEM_QUALITY_TABLE, XP_COST_FOR_TALENT, ARCHETYPE_DEFINITIONS, CLOSE_COMBAT_WEAPONS_DEFINITIONS, RANGED_WEAPONS_DEFINITIONS, GENERAL_GEAR_DEFINITIONS, ARMOR_DEFINITIONS, EXPLOSIVE_WEAPONS_DEFINITIONS, ATTRIBUTE_CREATION_POINTS, MIN_ATTRIBUTE_AT_CREATION, MAX_KEY_ATTRIBUTE_AT_CREATION, MAX_ATTRIBUTE_AT_CREATION, SOLO_SKILL_CREATION_POINTS, SKILL_CREATION_POINTS, MAX_KEY_SKILL_AT_CREATION, MAX_SKILL_AT_CREATION, ALL_SKILLS, TALENT_DEFINITIONS, GRID_WIDTH, GRID_HEIGHT } from '../constants';
import { RANDOM_EVENTS_TABLE, WALKER_PAST_TABLE, WALKER_WOUNDS_TABLE, ROOM_FLAVOR_TABLE, RANDOM_LOCATIONS_TABLE, NPC_FEATURES_TABLE, NPC_ISSUES_TABLE, NPC_SECRET_ISSUES_TABLE, SCAVENGING_TABLE, THEME_ORACLE_TABLE, MESSING_UP_ORACLE_SOLO_TABLE, LOSING_TO_A_SWARM_SOLO_TABLE, RANDOM_SWARM_ATTACKS_SOLO_TABLE, TWD_RPG_ANIMALS_TABLE } from '../data/tables';
import * as geminiService from '../services/geminiService';
import * as diceService from '../services/diceService';
import { PREMADE_FACTIONS, PREMADE_NPCS, PREMADE_ANIMALS } from '../data/premades';

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

// Using the diceService instead of local dice functions
// Using diceService for skill rolls instead of local implementation
const performSkillRoll = (dicePool: number, stressPool: number, skill: Skill | 'Handle Fear' | 'Armor' | 'Mobility' = Skill.ManualRoll): DiceRollResult => {
    return diceService.rollSkillCheck(Math.max(0, dicePool), Math.max(0, stressPool), skill);
}


export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => setIsEditMode(prev => !prev);

  const setGameMode = (mode: GameMode) => {
    const premadeFactions = PREMADE_FACTIONS.map((f, i) => ({ ...f, id: `faction-premade-${i}` }));
    const premadeNpcs = PREMADE_NPCS.map((n, i) => ({ 
      ...n, 
      id: `npc-premade-${i}`, 
      health: 3, 
      maxHealth: 3, 
      isInHaven: i < 3 // Put first 3 NPCs in haven by default for testing
    }));
    
    // Add premade animals with proper TWD RPG stats
    const animalHealthMap: { [name: string]: number } = {
      'Alligator': 4,
      'Bear': 4,
      'Dog': 3,
      'Eagle': 2,
      'Elk': 4,
      'Venomous snake': 2,
      'Tiger': 4,
      'Trained watchdog': 3,
      'Wolf': 3,
      'Wolverine': 3
    };

    const premadeAnimals = PREMADE_ANIMALS.map((a, i) => ({
      ...a,
      id: `animal-premade-${i}`,
      health: animalHealthMap[a.name] || 3, // Use official health or default to 3
      maxHealth: animalHealthMap[a.name] || 3,
      isInHaven: false // Animals start outside haven
    }));
    
    // Combine NPCs and animals
    const allNpcs = [...premadeNpcs, ...premadeAnimals];

    if (mode === 'Campaign') {
        const blankState: GameState = {
            ...INITIAL_GAME_STATE,
            gameMode: 'Campaign',
            characters: [],
            npcs: allNpcs,
            factions: premadeFactions,
            chatLog: [],
        };
        setGameState(blankState);
    } else if (mode === 'Solo') {
        const soloStartState: GameState = {
            ...INITIAL_GAME_STATE,
            gameMode: 'Solo',
            characters: [],
            npcs: allNpcs,
            factions: premadeFactions,
            chatLog: [{
                id: `msg-solo-start-${Date.now()}`,
                timestamp: Date.now(),
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `A solo game begins. Go to the Haven tab and use the Edit button to generate your starting survivors.`,
                type: 'SYSTEM',
            }],
        };
        setGameState(soloStartState);
    } else { // Handles 'Survival' and 'Unset'
        setGameState(prev => ({...prev, gameMode: mode}));
    }
  };

  const resetGame = () => {
    setGameState(INITIAL_GAME_STATE);
  }

  const loadSurvivalScenario = (scenarioName: keyof typeof SURVIVAL_SCENARIOS) => {
    const scenario: SurvivalScenarioDefinition = SURVIVAL_SCENARIOS[scenarioName];
    if (!scenario) return;

    const scenarioState: GameState = {
        ...INITIAL_GAME_STATE, // Start with a base state
        gameMode: 'Survival',
        scenarioName: scenario.name,
        characters: scenario.characters,
        npcs: scenario.npcs,
        haven: scenario.haven || INITIAL_GAME_STATE.haven,
        threat: scenario.threat || INITIAL_GAME_STATE.threat,
        chatLog: scenario.startingLog ? scenario.startingLog.map((msg, i) => ({...msg, id: `start-msg-${i}`, timestamp: Date.now() + i })) : [],
    };
    setGameState(scenarioState);
  };

  const updateThreat = useCallback((updates: Partial<ThreatState>) => {
    setGameState(prevState => ({
      ...prevState,
      threat: { ...prevState.threat, ...updates }
    }));
  }, []);

  const rollOnTable = useCallback((tableName: string): TableRollResult | null => {
    switch (tableName) {
        case 'Overwhelmed': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: OVERWHELMED_TABLE[roll] };
        }
        case 'Vehicle Condition': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            const result = VEHICLE_CONDITION_TABLE[roll];
            return { ...tableRoll, resultText: `${result.condition}, Fuel: ${result.fuel}` };
        }
        case 'Crash Objects': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            const result = CRASH_OBJECTS_TABLE[roll];
            return { ...tableRoll, resultText: `${result.object} (Crash Dice: ${result.crashDice}, Durability: ${result.durability})` };
        }
        case 'Random Event': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: RANDOM_EVENTS_TABLE[roll] || 'No event.' };
        }
        case 'Critical Injury': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            const injury = CRITICAL_INJURY_TABLE[roll] || CRITICAL_INJURY_TABLE[66];
            return { ...tableRoll, resultText: `${injury.name} (Penalty: ${injury.penalty}, Recovery: ${injury.recoveryTime})` };
        }
        case 'Critical Vehicle Damage': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: CRITICAL_VEHICLE_DAMAGE_TABLE[roll] };
        }
        case 'Messing up in Combat': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: MESSING_UP_IN_COMBAT_TABLE[roll] };
        }
        case 'Item Quality': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            let resultText = ITEM_QUALITY_TABLE[roll];
            
            if (roll === 6) {
                // For special case with second roll
                const secondRollResult = diceService.rollD6('Item Quality Second Roll');
                const secondRoll = parseInt(secondRollResult.roll);
                resultText += ` (Second roll: ${secondRoll}).`;
                if(secondRoll === 6) {
                    resultText += " **Extremely good quality!**";
                }
            }
            
            return { ...tableRoll, resultText };
        }
        case 'Walker Past': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: WALKER_PAST_TABLE[roll] || 'No result.' };
        }
        case 'Walker Wounds': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: WALKER_WOUNDS_TABLE[roll] || 'No result.' };
        }
        case 'Room Flavor': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: ROOM_FLAVOR_TABLE[roll] || 'No result.' };
        }
        case 'Random Location': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            const locationData = RANDOM_LOCATIONS_TABLE[roll];
            
            if (!locationData) {
                return { ...tableRoll, resultText: 'No location found.' };
            }
            
            // Roll for content
            const contentRollResult = diceService.rollD6('Location Contents');
            const contentRoll = parseInt(contentRollResult.roll);
            
            let contentKey = '';
            if (contentRoll <= 2) contentKey = '1-2';
            else if (contentRoll <= 4) contentKey = '3-4';
            else contentKey = '5-6';
            
            const content = locationData.contents[contentKey] || 'Unexpected contents.';
            return { ...tableRoll, resultText: `Location: ${locationData.location}. Contents (rolled ${contentRoll}): ${content}` };
        }
        case 'NPC Feature': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: NPC_FEATURES_TABLE[roll] || 'No result.' };
        }
        case 'NPC Archetype': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: WALKER_PAST_TABLE[roll] || 'Survivor' }; // Using Walker Past table for archetype variety
        }
        case 'NPC Issue': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: NPC_ISSUES_TABLE[roll] || 'No result.' };
        }
        case 'NPC Secret Issue': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: NPC_SECRET_ISSUES_TABLE[roll] || 'No result.' };
        }
        case 'Scavenging': {
            const tableRoll = diceService.rollD666(tableName);
            const roll = parseInt(tableRoll.roll);
            return { ...tableRoll, resultText: SCAVENGING_TABLE[roll] || 'Found nothing of interest.' };
        }
        case 'Walker Attack': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            const result = WALKER_ATTACK_TABLE[roll] || 'The walker attacks but fails to connect.';
            return { ...tableRoll, resultText: result };
        }
        case 'Theme Oracle (Solo)': {
            const tableRoll = diceService.rollD666(tableName);
            const roll = parseInt(tableRoll.roll);
            const dice = tableRoll.dice || [];
            const column = dice[0];
            const row = dice[1] * 10 + dice[2];
            const resultText = THEME_ORACLE_TABLE[column]?.[row] || 'An unexpected theme emerges...';
            return { ...tableRoll, resultText };
        }
        case 'Messing Up (Solo)': {
            const tableRoll = diceService.rollD66(tableName);
            const roll = parseInt(tableRoll.roll);
            const resultText = MESSING_UP_ORACLE_SOLO_TABLE[roll] || 'A minor inconvenience.';
            return { ...tableRoll, resultText };
        }
        case 'Swarm Loss (Solo)': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            const resultText = LOSING_TO_A_SWARM_SOLO_TABLE[roll] || 'The swarm hesitates.';
            return { ...tableRoll, resultText };
        }
        case 'Swarm Attack (Solo)': {
            const tableRoll = diceService.rollD6(tableName);
            const roll = parseInt(tableRoll.roll);
            const resultText = RANDOM_SWARM_ATTACKS_SOLO_TABLE[roll] || 'A single walker stumbles forward.';
            return { ...tableRoll, resultText };
        }
        default:
            return null;
    }
  }, []);
  
  const getPlayerCharacter = useCallback((characterId: string) => gameState.characters.find(c => c.id === characterId), [gameState.characters]);
  const getNpc = useCallback((npcId: string) => gameState.npcs.find(n => n.id === npcId), [gameState.npcs]);

  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    let senderName = 'GM';
    let senderToken = '';

    if (message.characterId === 'SYSTEM' || message.characterId === 'GM' || message.characterId === 'PLAYER_Q' || message.characterId === 'ORACLE') {
        senderName = message.characterName;
    } else {
        const pc = getPlayerCharacter(message.characterId);
        if (pc) {
            senderName = pc.name;
            senderToken = pc.tokenImage;
        } else {
            const npc = getNpc(message.characterId);
            if (npc) {
                senderName = npc.name;
                senderToken = npc.tokenImage;
            } else {
                senderName = message.characterName; // Fallback
            }
        }
    }


    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      characterName: senderName,
      characterTokenImage: senderToken,
    };
    
    // Check if the roll can be pushed
    if (newMessage.rollResult && getPlayerCharacter(newMessage.characterId)) {
        const { successes, messedUp } = newMessage.rollResult;
        if (successes === 0 && !messedUp) {
            newMessage.canBePushed = true;
        }
    }

    setGameState(prevState => {
      let newState = { ...prevState, chatLog: [...prevState.chatLog, newMessage] };
      return newState;
    });
  }, [getPlayerCharacter, getNpc]);
  
  const getSkillAttribute = useCallback((skill: Skill): Attribute | undefined => SKILL_DEFINITIONS.find(s => s.name === skill)?.attribute, []);

  const updateCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    setGameState(prevState => {
        const oldChar = prevState.characters.find(c => c.id === characterId);
        if (!oldChar) return prevState;

        let wasBroken = oldChar.health <= 0;

        const newChar: Character = {
            ...oldChar,
            ...updates,
            attributes: updates.attributes ? { ...oldChar.attributes, ...updates.attributes } : oldChar.attributes,
            skills: updates.skills ? { ...oldChar.skills, ...updates.skills } : oldChar.skills,
            criticalInjuries: 'criticalInjuries' in updates ? updates.criticalInjuries! : oldChar.criticalInjuries,
        };

        let isNowBroken = newChar.health <= 0;
        let newLogEntries: ChatMessage[] = [];

        if (!wasBroken && isNowBroken) {
            newLogEntries.push({ id: `msg-broken-${Date.now()}`, timestamp: Date.now(), characterId: 'SYSTEM', characterName: 'System', content: `${newChar.name} is BROKEN by damage! They take 1 stress and suffer a critical injury.`, type: 'SYSTEM' });
            newChar.stress = Math.min(5, newChar.stress + 1);

            const injuryRollResult = rollOnTable('Critical Injury');
            if (injuryRollResult) {
                const rollKey = parseInt(injuryRollResult.roll, 10);
                const injury = CRITICAL_INJURY_TABLE[rollKey] || CRITICAL_INJURY_TABLE[66];
                
                newChar.criticalInjuries.push(injury);

                const injuryMessage: ChatMessage = {
                    id: `msg-injury-${Date.now()}`,
                    timestamp: Date.now() + 1,
                    characterId: 'SYSTEM',
                    characterName: 'GM Roll',
                    content: `rolled for Critical Injury for ${newChar.name}.`,
                    type: 'ROLL',
                    tableRollResult: injuryRollResult,
                };
                newLogEntries.push(injuryMessage);

                if (injury.lethal) {
                    newLogEntries.push({
                        id: `msg-lethal-${Date.now()}`,
                        timestamp: Date.now() + 2,
                        characterId: 'SYSTEM',
                        characterName: 'System',
                        content: `LETHAL INJURY: ${newChar.name} will die in D6 ${injury.timeLimit} unless stabilized with ${injury.requires === 'A' ? 'Advanced' : 'Basic'} gear.`,
                        type: 'SYSTEM'
                    });
                }
                if (injury.name.toLowerCase().includes('die')) {
                    newChar.health = 0; // Dead
                }
            }
        }

        if (oldChar.stress < 5 && newChar.stress >= 5) {
            newLogEntries.push({ id: `msg-stress-${Date.now()}`, timestamp: Date.now(), characterId: 'SYSTEM', characterName: 'System', content: `${newChar.name} has reached 5 Stress! They must handle their fear.`, type: 'SYSTEM' });
        }
        if (oldChar.pcAnchorId && 'pcAnchorId' in updates && !updates.pcAnchorId) {
            const oldAnchor = prevState.characters.find(c => c.id === oldChar.pcAnchorId);
            newLogEntries.push({ id: `msg-anchorpc-${Date.now()}`, timestamp: Date.now(), characterId: 'SYSTEM', characterName: 'System', content: `${newChar.name}'s PC Anchor (${oldAnchor?.name || 'Unknown'}) is gone! They must handle their fear.`, type: 'SYSTEM' });
        }
        if (oldChar.npcAnchorId && 'npcAnchorId' in updates && !updates.npcAnchorId) {
            const oldAnchor = prevState.npcs.find(n => n.id === oldChar.npcAnchorId);
            newLogEntries.push({ id: `msg-anchornpc-${Date.now()}`, timestamp: Date.now(), characterId: 'SYSTEM', characterName: 'System', content: `${newChar.name}'s NPC Anchor (${oldAnchor?.name || 'Unknown'}) is gone! They must handle their fear.`, type: 'SYSTEM' });
        }

        return {
            ...prevState,
            characters: prevState.characters.map(char => char.id === characterId ? newChar : char),
            chatLog: [...prevState.chatLog, ...newLogEntries],
        };
    });
  }, [rollOnTable]);

  const updateNpc = useCallback((npcId: string, updates: Partial<NPC>) => {
    setGameState(prevState => ({
      ...prevState,
      npcs: prevState.npcs.map(npc => npc.id === npcId ? { ...npc, ...updates } : npc),
    }));
  }, []);

  const generateStartingNpcs = useCallback(() => {
    const groupIndex = Math.floor(Math.random() * NPC_SURVIVOR_GROUPS.length);
    const selectedGroup = NPC_SURVIVOR_GROUPS[groupIndex];

    const newNpcs = selectedGroup.map((template, index) => ({
      ...template,
      id: `npc-${Date.now()}-${index}-${Math.random()}`,
      health: 3,
      maxHealth: 3,
    }));
    
    setGameState(prevState => ({ ...prevState, npcs: [...prevState.npcs, ...newNpcs] }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `Generated NPC Survivor Group ${groupIndex + 1}.`,
      type: 'SYSTEM',
    });
  }, [addChatMessage]);

  const removeNpc = useCallback((npcId: string, npcName: string) => {
    setGameState(prevState => {
        const updatedNpcs = prevState.npcs.filter(npc => npc.id !== npcId);
        const updatedCharacters = prevState.characters.map(char =>
            char.npcAnchorId === npcId
                ? { ...char, npcAnchorId: undefined, npcAnchorDescription: '' }
                : char
        );

        return {
            ...prevState,
            npcs: updatedNpcs,
            characters: updatedCharacters,
        };
    });
    addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `${npcName} has been removed from the haven.`,
        type: 'SYSTEM',
    });
  }, [addChatMessage]);

  const designateCompanion = useCallback((npcId: string) => {
    setGameState(prevState => {
        const npcToToggle = prevState.npcs.find(n => n.id === npcId);
        if (!npcToToggle) return prevState;

        const isBecomingCompanion = !npcToToggle.isCompanion;
        
        const newNpcs = prevState.npcs.map(npc => {
            if (npc.id === npcId) {
                return { ...npc, isCompanion: isBecomingCompanion };
            }
            if (isBecomingCompanion) {
                return { ...npc, isCompanion: false };
            }
            return npc;
        });
        
        const message = isBecomingCompanion
            ? `${npcToToggle.name} is now your designated companion for solo play.`
            : `${npcToToggle.name} is no longer your companion.`;
        
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: message,
            type: 'SYSTEM',
        });

        return { ...prevState, npcs: newNpcs };
    });
  }, [addChatMessage]);

  const upgradeNpcToPc = useCallback((npcId: string) => {
    setGameState(prevState => {
        if (prevState.gameMode !== 'Solo') {
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `Can only upgrade NPC to PC in Solo mode.`, type: 'SYSTEM' });
            return prevState;
        }

        const npcToUpgrade = prevState.npcs.find(n => n.id === npcId);
        if (!npcToUpgrade) return prevState;

        const deadPc = prevState.characters.find(c => c.health <= 0);
        if (!deadPc) {
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `Can only upgrade NPC to PC when your main character has fallen.`, type: 'SYSTEM' });
            return prevState;
        }
        
        const allItemTemplates = [
            ...CLOSE_COMBAT_WEAPONS_DEFINITIONS,
            ...RANGED_WEAPONS_DEFINITIONS,
            ...GENERAL_GEAR_DEFINITIONS,
            ...ARMOR_DEFINITIONS,
            ...EXPLOSIVE_WEAPONS_DEFINITIONS,
            ...prevState.customItems,
        ];

        const newPc: Character = {
            ...DEFAULT_PC_TEMPLATE,
            id: `pc-upgraded-${Date.now()}`,
            name: npcToUpgrade.name,
            archetype: npcToUpgrade.archetype, 
            keyAttribute: Attribute.Wits,
            keySkill: Skill.Survival,
            issue: npcToUpgrade.issues.join(', '),
            skills: Object.entries(npcToUpgrade.skillExpertise).reduce((acc, [skill, expertise]) => {
                let rank = 0;
                if (expertise === SkillExpertise.Trained) rank = 1;
                else if (expertise === SkillExpertise.Expert) rank = 2;
                else if (expertise === SkillExpertise.Master) rank = 3;
                acc[skill as Skill] = rank;
                return acc;
            }, { ...DEFAULT_PC_TEMPLATE.skills } as Record<Skill, number>),
            inventory: npcToUpgrade.inventory.map(itemName => {
                const itemTemplate = allItemTemplates.find(i => i.name.toLowerCase() === itemName.toLowerCase());
                const baseItem = itemTemplate ? { ...itemTemplate } : { name: itemName, slots: 1 };
                return {
                    id: `item-upgraded-${Date.now()}-${Math.random()}`,
                    equipped: false,
                    ...baseItem,
                };
            }),
            creationComplete: true, 
            health: 3,
            maxHealth: 3,
            stress: 0,
            xp: 0,
        };

        const newCharacters = prevState.characters.filter(c => c.id !== deadPc.id);
        newCharacters.push(newPc);

        const newNpcs = prevState.npcs.filter(n => n.id !== npcId);

        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `${deadPc.name} has fallen. You now continue as ${newPc.name}.`,
            type: 'SYSTEM',
        });

        return {
            ...prevState,
            characters: newCharacters,
            npcs: newNpcs,
        };
    });
  }, [addChatMessage]);
  
  const advanceSessionClocks = useCallback(() => {
    setGameState(prevState => {
        let anyClockAdvanced = false;
        const newClocks = prevState.session.clocks.map(clock => {
            if (clock.type === 'Session' && clock.current < clock.max) {
                anyClockAdvanced = true;
                return { ...clock, current: clock.current + 1 };
            }
            return clock;
        });

        if (anyClockAdvanced) {
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: 'The session advances, and time passes... All session clocks tick forward.',
                type: 'SYSTEM',
            });
            return {
                ...prevState,
                session: { ...prevState.session, clocks: newClocks },
            };
        }
        return prevState;
    });
  }, [addChatMessage]);

  
  // Helper function to generate random skill expertise for NPCs
  const generateRandomSkillExpertise = useCallback((): Record<Skill, SkillExpertise> => {
    const expertise: Record<Skill, SkillExpertise> = {} as Record<Skill, SkillExpertise>;
    const expertiseLevels = [SkillExpertise.None, SkillExpertise.Trained, SkillExpertise.Expert, SkillExpertise.Master];
    
    // Initialize all skills to None
    ALL_SKILLS.forEach(skill => {
      expertise[skill] = SkillExpertise.None;
    });
    
    // Randomly assign 1-3 skills with expertise
    const numExpertiseSkills = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numExpertiseSkills; i++) {
      const randomSkill = ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)];
      const randomExpertise = expertiseLevels[Math.floor(Math.random() * expertiseLevels.length)];
      expertise[randomSkill] = randomExpertise;
    }
    
    return expertise;
  }, []);

  const generateRandomAnimal = useCallback(() => {
    // Use official TWD RPG Animal table
    const selectedAnimal = TWD_RPG_ANIMALS_TABLE[Math.floor(Math.random() * TWD_RPG_ANIMALS_TABLE.length)];
    const animalName = `${selectedAnimal.ANIMAL} (${['Buddy', 'Scout', 'Lucky', 'Shadow', 'Rex', 'Bella', 'Max', 'Luna'][Math.floor(Math.random() * 8)]})`;
    
    // Roll for a random quirk
    const quirks = [
      'Particularly brave for its species',
      'Has unusual coloring or markings',
      'Seems to understand human speech',
      'Has a particular fondness for one person',
      'Shows signs of unusual intelligence',
      'Has survived longer than expected',
      'Came from a working/trained background',
      'Has a memorable scar or distinctive feature'
    ];
    const quirk = quirks[Math.floor(Math.random() * quirks.length)];
    
    // Animals don't use skill expertise - they use attack dice instead
    const emptySkillExpertise: Record<Skill, SkillExpertise> = {} as Record<Skill, SkillExpertise>;
    ALL_SKILLS.forEach(skill => {
      emptySkillExpertise[skill] = SkillExpertise.None;
    });
    
    const newAnimal: NPC = {
      id: `animal-rand-${Date.now()}-${Math.random()}`,
      name: animalName,
      archetype: `${selectedAnimal.ANIMAL} (Animal)`,
      issues: [`Natural ${selectedAnimal.ANIMAL.toLowerCase()} behavior`, quirk],
      inventory: [], // Animals don't carry items
      skillExpertise: emptySkillExpertise, // Empty for animals
      health: selectedAnimal.HEALTH,
      maxHealth: selectedAnimal.HEALTH,
      isInHaven: false, // Animals are companions/livestock, not haven members
      isAnimal: true, // Mark as animal
      attackDice: selectedAnimal["ATTACK DICE"],
      damage: selectedAnimal.DAMAGE.toString(),
    };
    
    setGameState(prevState => ({ ...prevState, npcs: [...prevState.npcs, newAnimal] }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `A ${selectedAnimal.ANIMAL.toLowerCase()} has joined: ${animalName}. Combat: ${selectedAnimal["ATTACK DICE"]} dice, ${selectedAnimal.DAMAGE} damage. Notable trait: ${quirk}`,
      type: 'SYSTEM',
    });
  }, [addChatMessage]);

  const addNpcToHaven = useCallback((npcId: string) => {
    const npc = gameState.npcs.find(n => n.id === npcId);
    if (!npc) return;

    setGameState(prevState => ({
      ...prevState,
      npcs: prevState.npcs.map(n => 
        n.id === npcId ? { ...n, isInHaven: true } : n
      )
    }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `${npc.name} has been moved to the haven.`,
      type: 'SYSTEM',
    });
  }, [gameState.npcs, addChatMessage]);

  const removeNpcFromHaven = useCallback((npcId: string) => {
    const npc = gameState.npcs.find(n => n.id === npcId);
    if (!npc) return;

    setGameState(prevState => ({
      ...prevState,
      npcs: prevState.npcs.map(n => 
        n.id === npcId ? { ...n, isInHaven: false } : n
      )
    }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `${npc.name} has been removed from the haven but remains in the survivor pool.`,
      type: 'SYSTEM',
    });
  }, [gameState.npcs, addChatMessage]);

  const addCustomNpc = useCallback((npc: NPC) => {
    const newNpc: NPC = {
      ...npc,
      id: `npc-custom-${Date.now()}-${Math.random()}`,
      health: npc.health || 3,
      maxHealth: npc.maxHealth || 3,
    };
    
    setGameState(prevState => ({ ...prevState, npcs: [...prevState.npcs, newNpc] }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `${newNpc.name} has been added to the survivor pool.`,
      type: 'SYSTEM',
    });
  }, [addChatMessage]);

  const generateRandomNpc = useCallback(() => {
    // Enhanced random NPC generation using tables
    const archetype = rollOnTable('NPC Archetype')?.resultText || 'Survivor';
    const feature = rollOnTable('NPC Feature')?.resultText || 'Unremarkable appearance';
    const issue = rollOnTable('NPC Issue')?.resultText || 'Trusts no one';
    const secretIssue = rollOnTable('NPC Secret Issue')?.resultText || 'Hides their past';
    
    // Generate a random name
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Avery', 'Quinn', 'Riley', 'Sage', 'River'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    
    // Roll for some basic inventory
    const scavengingRoll = rollOnTable('Scavenging');
    const inventoryItem = scavengingRoll?.resultText || 'Basic supplies';

    const newNpc: NPC = {
      id: `npc-rand-${Date.now()}-${Math.random()}`,
      name: randomName,
      archetype: archetype,
      issues: [issue, secretIssue].filter(Boolean),
      inventory: [inventoryItem],
      skillExpertise: generateRandomSkillExpertise(),
      health: 3,
      maxHealth: 3,
      isInHaven: false, // Random NPCs start in global pool, not automatically in haven
    };
    
    setGameState(prevState => ({ ...prevState, npcs: [...prevState.npcs, newNpc] }));

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `A new survivor, ${randomName}, has been added to the survivor pool. Notable feature: ${feature}`,
      type: 'SYSTEM',
    });
  }, [addChatMessage, rollOnTable, generateRandomSkillExpertise]);

  const updateHaven = useCallback((updates: Partial<Haven>) => {
    setGameState(prevState => ({ ...prevState, haven: { ...prevState.haven, ...updates } }));
  }, []);

  const toggleItemEquipped = useCallback((characterId: string, itemId: string) => {
    const character = getPlayerCharacter(characterId);
    if (!character) return;
    
    const itemToToggle = character.inventory.find(item => item.id === itemId);
    if (!itemToToggle) return;

    let newInventory = character.inventory.map(item =>
        item.id === itemId ? { ...item, equipped: !item.equipped } : item
    );

    if (itemToToggle.type === 'Armor' && !itemToToggle.equipped) {
        newInventory = newInventory.map(item => 
            item.type === 'Armor' && item.id !== itemId ? { ...item, equipped: false } : item
        );
    }
    
    updateCharacter(characterId, { inventory: newInventory });
  }, [getPlayerCharacter, updateCharacter]);

  const addClock = useCallback((name: string, max: number, type?: ClockType) => {
    if (!name.trim() || max < 1) return;
    const newClock: Clock = { id: `clock-${Date.now()}`, name, max, current: 0, type };
    setGameState(prevState => ({
      ...prevState,
      session: {
        ...prevState.session,
        clocks: [...prevState.session.clocks, newClock],
      },
    }));
  }, []);

  const updateClock = useCallback((clockId: string, updates: Partial<Clock>) => {
    setGameState(prevState => ({
      ...prevState,
      session: {
        ...prevState.session,
        clocks: prevState.session.clocks.map(c =>
          c.id === clockId ? { ...c, ...updates } : c
        ),
      },
    }));
  }, []);

  const removeClock = useCallback((clockId: string) => {
    setGameState(prevState => ({
      ...prevState,
      session: {
        ...prevState.session,
        clocks: prevState.session.clocks.filter(c => c.id !== clockId),
      },
    }));
  }, []);

  const addCharacter = useCallback(() => {
    const defaultArchetypeDef = ARCHETYPE_DEFINITIONS.find(def => def.name === DEFAULT_PC_TEMPLATE.archetype);
    const newCharacter: Character = {
        ...DEFAULT_PC_TEMPLATE,
        id: `pc-${Date.now()}`,
        keyAttribute: defaultArchetypeDef?.keyAttribute || Attribute.Agility,
        keySkill: defaultArchetypeDef?.keySkill || Skill.Stealth
    };
    setGameState(prevState => ({
        ...prevState,
        characters: [...prevState.characters, newCharacter]
    }));
    return newCharacter.id;
  }, []);

  const addRandomCharacter = useCallback(() => {
    const standardArchetypes = ARCHETYPE_DEFINITIONS.filter(a => a.name !== Archetype.Custom);
    if (standardArchetypes.length === 0) return ''; 

    const randomArchetype = standardArchetypes[Math.floor(Math.random() * standardArchetypes.length)];
    const newCharId = `pc-rand-${Date.now()}`;
    const newCharacter: Character = {
        ...DEFAULT_PC_TEMPLATE,
        id: newCharId,
        name: `${randomArchetype.name} Survivor`,
        archetype: randomArchetype.name as Archetype,
        keyAttribute: randomArchetype.keyAttribute,
        keySkill: randomArchetype.keySkill,
        drive: 'To see another sunrise.',
        issue: 'Trusts no one.',
        creationComplete: true,
    };

    let attrPoints = ATTRIBUTE_CREATION_POINTS;
    const attributes: Record<Attribute, number> = { [Attribute.Strength]: 0, [Attribute.Agility]: 0, [Attribute.Wits]: 0, [Attribute.Empathy]: 0 };
    const attrKeys = Object.values(Attribute);
    
    for(const key of attrKeys) {
        attributes[key] = MIN_ATTRIBUTE_AT_CREATION;
    }
    attrPoints -= MIN_ATTRIBUTE_AT_CREATION * 4;

    while(attrPoints > 0) {
        const randomAttr = attrKeys[Math.floor(Math.random() * attrKeys.length)];
        const maxVal = randomAttr === newCharacter.keyAttribute ? MAX_KEY_ATTRIBUTE_AT_CREATION : MAX_ATTRIBUTE_AT_CREATION;
        if (attributes[randomAttr] < maxVal) {
            attributes[randomAttr]++;
            attrPoints--;
        }
    }
    newCharacter.attributes = attributes;
    
    const isSolo = gameState.gameMode === 'Solo';
    let skillPoints = isSolo ? SOLO_SKILL_CREATION_POINTS : SKILL_CREATION_POINTS;
    const skills: Record<Skill, number> = { ...DEFAULT_PC_TEMPLATE.skills };

    while(skillPoints > 0) {
        const randomSkill = ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)];
        const skillDef = SKILL_DEFINITIONS.find(s => s.name === randomSkill);
        if (!skillDef) continue;
        
        const isKeyAttrSkill = skillDef.attribute === newCharacter.keyAttribute;
        const maxRank = isKeyAttrSkill ? MAX_KEY_SKILL_AT_CREATION : MAX_SKILL_AT_CREATION;
        
        if ((skills[randomSkill] || 0) < maxRank) {
            skills[randomSkill] = (skills[randomSkill] || 0) + 1;
            skillPoints--;
        }
    }
    newCharacter.skills = skills;

    const allTalentDefs = [...TALENT_DEFINITIONS, ...gameState.customTalents];
    const availableTalents = allTalentDefs.filter(t => t.archetype === newCharacter.archetype || !t.archetype).slice();
    const numTalents = isSolo ? 2 : 1;
    const selectedTalents: Talent[] = [];
    while(selectedTalents.length < numTalents && availableTalents.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTalents.length);
        const chosenTalentDef = availableTalents.splice(randomIndex, 1)[0];
        if (chosenTalentDef) {
            selectedTalents.push({
                id: `talent-rand-${chosenTalentDef.name}-${Math.random()}`,
                ...chosenTalentDef
            });
        }
    }
    newCharacter.talents = selectedTalents;
    
    if (isSolo) {
        const hasMelee = newCharacter.inventory.some(item => item.type === 'Close' && item.damage && item.damage > 0);
        if (!hasMelee) {
            const knifeTemplate = CLOSE_COMBAT_WEAPONS_DEFINITIONS.find(w => w.name === 'Knife');
            if (knifeTemplate) {
                const knife: InventoryItem = {
                    id: `item-solo-start-${Date.now()}`,
                    ...knifeTemplate,
                    equipped: true,
                };
                newCharacter.inventory.push(knife);
            }
        }
    }
    
    setGameState(prevState => ({
        ...prevState,
        characters: [...prevState.characters, newCharacter]
    }));
    
    addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `A new random survivor, ${newCharacter.name}, has been generated.`,
        type: 'SYSTEM',
    });

    return newCharId;
  }, [gameState, addChatMessage]);
  
  const removeCharacter = useCallback((characterId: string, characterName: string) => {
      setGameState(prevState => {
          const updatedCharacters = prevState.characters
              .filter(c => c.id !== characterId)
              .map(char => {
                  if (char.pcAnchorId === characterId) {
                      return { ...char, pcAnchorId: undefined, pcAnchorDescription: '' };
                  }
                  return char;
              });
          
          return {
              ...prevState,
              characters: updatedCharacters,
          };
      });
      addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `${characterName} has been removed from the group.`,
          type: 'SYSTEM',
      });
  }, [addChatMessage]);
  
  const purchaseTalent = useCallback((characterId: string, talentData: Omit<Talent, 'id'>): boolean => {
    const character = getPlayerCharacter(characterId);
    if (!character || character.xp < XP_COST_FOR_TALENT) {
        return false;
    }

    const newTalent: Talent = { id: `talent-${Date.now()}-${Math.random()}`, ...talentData };

    updateCharacter(characterId, { 
        talents: [...character.talents, newTalent],
        xp: character.xp - XP_COST_FOR_TALENT
    });

    addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `${character.name} spent 10 XP to acquire the "${talentData.name}" talent.`,
        type: 'SYSTEM',
    });

    return true;
  }, [getPlayerCharacter, updateCharacter, addChatMessage]);

  const purchaseSkillPoint = useCallback((characterId: string, skill: Skill): boolean => {
    const character = getPlayerCharacter(characterId);
    if (!character) return false;

    const currentRank = character.skills[skill] || 0;
    const newRank = currentRank + 1;
    const xpCost = newRank * 5; // YZE standard

    if (character.xp < xpCost) {
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `${character.name} needs ${xpCost} XP to raise ${skill}, but only has ${character.xp}.`,
            type: 'SYSTEM',
        });
        return false;
    }
    
    if (newRank > 5) {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `${skill} is already at maximum rank for ${character.name}.`,
          type: 'SYSTEM',
        });
        return false;
    }

    updateCharacter(characterId, {
      skills: {
        ...character.skills,
        [skill]: newRank,
      },
      xp: character.xp - xpCost,
    });

    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `${character.name} spent ${xpCost} XP to increase ${skill} to rank ${newRank}.`,
      type: 'SYSTEM',
    });

    return true;
  }, [getPlayerCharacter, updateCharacter, addChatMessage]);

  const toggleActiveTalent = useCallback((characterId: string, talentId: string) => {
    const character = getPlayerCharacter(characterId);
    if (!character) return;

    const activeTalentIds = character.activeTalentIds.includes(talentId)
        ? character.activeTalentIds.filter(id => id !== talentId)
        : [...character.activeTalentIds, talentId];

    updateCharacter(characterId, { activeTalentIds });
  }, [getPlayerCharacter, updateCharacter]);

  const finalizeCharacterCreation = useCallback((characterId: string) => {
    const character = getPlayerCharacter(characterId);
    if (!character) return;
    
    const updates: Partial<Character> = { creationComplete: true };

    // Special solo mode rule: add a knife if no melee weapon
    if (gameState.gameMode === 'Solo') {
        const currentInventory = updates.inventory || character.inventory;
        const hasMelee = currentInventory.some(item => item.type === 'Close' && item.damage && item.damage > 0);
        if (!hasMelee) {
            const knifeTemplate = CLOSE_COMBAT_WEAPONS_DEFINITIONS.find(w => w.name === 'Knife');
            if (knifeTemplate) {
                const knife: InventoryItem = {
                    id: `item-solo-start-${Date.now()}`,
                    ...knifeTemplate,
                    equipped: true,
                };
                updates.inventory = [...currentInventory, knife];
            }
        }
    }
    
    updateCharacter(characterId, updates);

    addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `${character.name} is ready for action!`,
        type: 'SYSTEM',
    });
  }, [getPlayerCharacter, updateCharacter, addChatMessage, gameState.gameMode]);

  const pushRoll = useCallback((messageId: string) => {
        setGameState(prevState => {
            const chatLog = prevState.chatLog;
            const messageIndex = chatLog.findIndex(m => m.id === messageId);
            if (messageIndex === -1) return prevState;

            const originalMessage = chatLog[messageIndex];
            if (!originalMessage.rollResult || !originalMessage.canBePushed) return prevState;
            
            const character = prevState.characters.find(c => c.id === originalMessage.characterId);
            if (!character) return prevState;
            
            let newState = { ...prevState };
            
            const newStressValue = character.stress + 1;
            const updatedCharacter = { ...character, stress: newStressValue };
            newState.characters = newState.characters.map(c => c.id === character.id ? updatedCharacter : c);

            let newChatLog = [...chatLog];
            newChatLog[messageIndex] = { ...originalMessage, canBePushed: false };
            
            const stressGainMessage: ChatMessage = {
                id: `msg-stressgain-${Date.now()}`,
                timestamp: Date.now(),
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `${character.name} gains 1 Stress to push the roll.`,
                type: 'SYSTEM',
            };
            newChatLog.push(stressGainMessage);

            // Use the dice service to push the roll
            const finalResult = diceService.pushRoll(originalMessage.rollResult);

            const pushedMessage: ChatMessage = {
                id: `msg-pushed-${Date.now() + 1}`,
                timestamp: Date.now() + 1,
                characterId: character.id,
                characterName: character.name,
                content: `pushed the roll for ${finalResult.skill}!`,
                type: 'ROLL',
                rollResult: finalResult,
            };
            newChatLog.push(pushedMessage);

            if (finalResult.messedUp) {
                const messUpMessage: ChatMessage = {
                    id: `msg-messup-push-${Date.now() + 2}`,
                    timestamp: Date.now() + 2,
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: `A complication arises from the pushed roll!`,
                    type: 'SYSTEM'
                };
                newChatLog.push(messUpMessage);
            }
            
            newState.chatLog = newChatLog;
            return newState;
        });
    }, []);

  const removeCriticalInjury = useCallback((characterId: string, injuryIndex: number) => {
    const character = getPlayerCharacter(characterId);
    if (!character) return;
    const updatedInjuries = character.criticalInjuries.filter((_, index) => index !== injuryIndex);
    updateCharacter(characterId, { criticalInjuries: updatedInjuries });
  }, [getPlayerCharacter, updateCharacter]);

  const rollAndAddCriticalInjury = useCallback((characterId: string) => {
    const character = getPlayerCharacter(characterId);
    if (!character) return;
    const injuryRollResult = rollOnTable('Critical Injury');
    if (injuryRollResult) {
        const rollKey = parseInt(injuryRollResult.roll, 10);
        const injury = CRITICAL_INJURY_TABLE[rollKey] || CRITICAL_INJURY_TABLE[66];
        updateCharacter(characterId, { criticalInjuries: [...character.criticalInjuries, injury] });
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'GM Roll',
            content: `manually rolled a Critical Injury for ${character.name}.`,
            type: 'ROLL',
            tableRollResult: injuryRollResult,
        });
    }
  }, [getPlayerCharacter, rollOnTable, updateCharacter, addChatMessage]);

  // COMBAT FUNCTIONS
  const startCombat = useCallback((participants: {id: string, type: 'PC' | 'NPC'}[], type: CombatType, sideA: CombatSetupParticipant[], sideB: CombatSetupParticipant[], swarmSize?: number) => {
    const combatants: (Combatant | null)[] = participants.map((p, index): Combatant | null => {
        const team = sideA.some(s => s.id === p.id) ? 'A' : 'B';
        const teamXpos = team === 'A' ? 2 : GRID_WIDTH - 3;
        
        if (p.type === 'PC') {
            const char = getPlayerCharacter(p.id);
            if (!char) return null;
            const armor = char.inventory.find(i => i.equipped && i.type === 'Armor');
            return {
                id: char.id,
                type: 'PC',
                name: char.name,
                tokenImage: char.tokenImage,
                range: RangeCategory.Short,
                hasActed: false,
                isTakingCover: false,
                isOnOverwatch: false,
                health: char.health,
                armorLevel: armor?.armorLevel || 0,
                armorPenalty: armor?.penalty || 0,
                leadershipBonus: 0,
                plannedAction: null,
                position: {x: teamXpos, y: 2 + index * 2},
            };
        } else {
            const npc = getNpc(p.id);
            if (!npc) return null;
            return {
                id: npc.id,
                type: 'NPC',
                name: npc.name,
                tokenImage: npc.tokenImage,
                range: RangeCategory.Short,
                hasActed: false,
                isTakingCover: false,
                isOnOverwatch: false,
                health: npc.health,
                armorLevel: 0,
                armorPenalty: 0,
                leadershipBonus: 0,
                plannedAction: null,
                position: {x: teamXpos, y: 2 + index * 2},
            };
        }
    });
    
    let combatMessage = 'Combat has begun!';
    if (type === 'Brawl') combatMessage = 'A brawl erupts!';
    if (type === 'Duel') combatMessage = 'A duel is initiated!';
    if (type === 'Swarm') {
      combatMessage = `A walker swarm (Size ${swarmSize}) attacks!`;
      if (THREAT_LEVELS[gameState.threat.level].level >= 3) {
        addChatMessage({characterId: 'SYSTEM', characterName: 'System', content: 'The walkers are aware of you! All PCs take 1 stress.', type: 'SYSTEM'});
        combatants.forEach(c => {
          if (c && c.type === 'PC') {
            const char = getPlayerCharacter(c.id);
            if(char) updateCharacter(c.id, { stress: Math.min(5, char.stress + 1) });
          }
        });
      }
    }


    setGameState(prev => ({
        ...prev,
        combat: {
            ...INITIAL_GAME_STATE.combat,
            isActive: true,
            type,
            combatants: combatants.filter((c): c is Combatant => c !== null),
            swarmSize: type === 'Swarm' ? swarmSize : undefined,
        }
    }));
    
    addChatMessage({characterId: 'SYSTEM', characterName: 'System', content: combatMessage, type: 'SYSTEM'});
  }, [getPlayerCharacter, getNpc, addChatMessage, updateCharacter, gameState.threat.level]);

  const endCombat = useCallback(() => {
    setGameState(prev => ({ ...prev, combat: { ...prev.combat, isActive: false, combatants: [], pendingSwarmConsequence: false, swarmRoundResult: null }}));
    addChatMessage({characterId: 'SYSTEM', characterName: 'System', content: 'Combat has ended.', type: 'SYSTEM'});
  }, [addChatMessage]);

  const updateCombatant = useCallback((combatantId: string, updates: Partial<Combatant>) => {
    setGameState(prev => ({
        ...prev,
        combat: {
            ...prev.combat,
            combatants: prev.combat.combatants.map(c => c.id === combatantId ? {...c, ...updates} : c),
        }
    }))
  }, []);
  
  const nextTurn = useCallback(() => {
    setGameState(prev => {
        if (!prev.combat.isActive) return prev;
        
        const combatants = prev.combat.combatants;
        let newIndex = prev.combat.currentTurnIndex + 1;
        let newRound = prev.combat.round;
        
        if (newIndex >= combatants.length) {
            newIndex = 0;
            newRound += 1;
            
            // Only announce rounds for brawl combat, not duels (which show round in UI)
            if (prev.combat.type === 'Brawl') {
                addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: `🔄 **ROUND ${newRound}** - All combatants reset actions!`,
                    type: 'SYSTEM'
                });
            }
            
            const newCombatants = combatants.map(c => ({...c, hasActed: false}));
            return {
                ...prev,
                combat: {
                    ...prev.combat,
                    round: newRound,
                    currentTurnIndex: newIndex,
                    combatants: newCombatants
                }
            };
        } else {
            return {
                ...prev,
                combat: {
                    ...prev.combat,
                    currentTurnIndex: newIndex,
                }
            };
        }
    });
  }, [addChatMessage]);

  const setDuelRange = useCallback((range: RangeCategory) => {
    setGameState(prev => ({
        ...prev,
        combat: {
            ...prev.combat,
            duelRange: range,
            // Also update all combatants' range for consistency
            combatants: prev.combat.combatants.map(c => ({...c, range}))
        }
    }));
  }, []);
  
  const _handleMessUpDurability = (characterId: string) => {
     setGameState(prevState => {
        const character = prevState.characters.find(c => c.id === characterId);
        if (!character) return prevState;

        const weapon = character.inventory.find(i => i.equipped && (i.type === 'Close' || i.type === 'Ranged') && !i.broken);
        if (!weapon) return prevState;

        // Roll to see if the weapon breaks
        const breakRollResult = diceService.rollD6('Weapon Break Check');
        const breakRoll = parseInt(breakRollResult.roll);
        if (breakRoll === 1) { // 1 in 6 chance to break
            const newInventory = character.inventory.map(i => i.id === weapon.id ? {...i, broken: true} : i);
            const newCharacterState = {...character, inventory: newInventory};
            const newCharacters = prevState.characters.map(c => c.id === characterId ? newCharacterState : c);
            
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `Bad luck! ${character.name}'s ${weapon.name} broke under the stress!`,
                type: 'SYSTEM',
            });

            return {...prevState, characters: newCharacters};
        }
        return prevState;
     });
  }
  
  const resolveOpposedAttack = useCallback((attackerId: string, defenderId: string, isBrawl: boolean = false) => {
    const performActorRoll = (actor: Combatant, skill: Skill, isRangedAttackOnCoveredTarget: boolean = false): DiceRollResult => {
        let dicePool = 0;
        let stressPool = 0;
        let messedUp = false;

        if (actor.type === 'PC') {
            const pc = getPlayerCharacter(actor.id);
            if (!pc) return { baseDice: [], stressDice: [], successes: 0, pushed: false, messedUp: false, skill, baseDicePool: 0, stressDicePool: 0 };
            const attr = getSkillAttribute(skill);
            dicePool = (attr ? pc.attributes[attr] : 0) + (pc.skills[skill] || 0) + (actor.leadershipBonus || 0);
            stressPool = pc.stress;
            const weapon = pc.inventory.find(i => i.equipped && (i.type === 'Close' || i.type === 'Ranged'));
            if(weapon && !weapon.broken && (skill === Skill.CloseCombat || skill === Skill.RangedCombat)) dicePool += weapon.bonus || 0;
        } else {
            const npc = getNpc(actor.id);
            if (!npc) return { baseDice: [], stressDice: [], successes: 0, pushed: false, messedUp: false, skill, baseDicePool: 0, stressDicePool: 0 };
            const expertise = npc.skillExpertise[skill];
            if (expertise === SkillExpertise.Trained) dicePool = 5;
            else if (expertise === SkillExpertise.Expert) dicePool = 8;
            else if (expertise === SkillExpertise.Master) dicePool = 10;
            else dicePool = 4;
        }
        
        // Apply cover penalty to ranged attacks
        if (isRangedAttackOnCoveredTarget) {
            dicePool = Math.max(1, dicePool - 1); // Minimum 1 die
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `${actor.name}'s attack is hindered by their target's cover (-1 dice)`,
                type: 'SYSTEM'
            });
        }
        
        const roll = performSkillRoll(dicePool, stressPool);
        
        addChatMessage({
            characterId: actor.id,
            characterName: actor.name,
            characterTokenImage: actor.tokenImage,
            content: `rolls for ${skill}.`,
            type: 'ROLL',
            rollResult: { ...roll, skill, baseDicePool: dicePool, stressDicePool: stressPool }
        });

        if (roll.messedUp && actor.type === 'PC') {
            _handleMessUpDurability(actor.id);
        }

        return { ...roll, skill, baseDicePool: dicePool, stressDicePool: stressPool };
    };

    const attacker = gameState.combat.combatants.find(c => c.id === attackerId);
    const defender = gameState.combat.combatants.find(c => c.id === defenderId);
    if (!attacker || !defender || attacker.health <= 0 || defender.health <= 0) {
         addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: 'Invalid or no target selected for attack.', type: 'SYSTEM' });
         return;
    }

    const attackSkill = attacker.range === RangeCategory.Short ? Skill.CloseCombat : Skill.RangedCombat;
    const isRangedAttack = attackSkill === Skill.RangedCombat;
    const defenderInCover = defender.isTakingCover && isRangedAttack;
    
    const attackerRoll = performActorRoll(attacker, attackSkill, defenderInCover);

    let defenderSuccesses = 0;
    
    // In brawls and campaigns, defender rolls back. In solo, it's a fixed difficulty.
    if (gameState.gameMode !== 'Solo' || defender.type === 'PC') {
        const defenseSkill = defender.range === RangeCategory.Short ? Skill.CloseCombat : Skill.Mobility;
        const defenderRoll = performActorRoll(defender, defenseSkill);
        defenderSuccesses = defenderRoll.successes;
    } else { // Solo mode vs NPC
        const npc = getNpc(defender.id);
        if (npc) {
            const defenseSkill = defender.range === RangeCategory.Short ? Skill.CloseCombat : Skill.Mobility;
            const expertise = npc.skillExpertise[defenseSkill] || SkillExpertise.None;
            if (expertise === SkillExpertise.Expert) defenderSuccesses = 2;
            else if (expertise === SkillExpertise.Master) defenderSuccesses = 3;
            else defenderSuccesses = 1;
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `(Solo Player-Facing Roll) ${defender.name}'s defense difficulty is ${defenderSuccesses}.`, type: 'SYSTEM' });
        }
    }
    
    const applyDamage = (charId: string, charType: 'PC' | 'NPC', damage: number, attackerPos: {x:number, y:number}, defenderPos: {x:number, y:number}) => {
        if(damage <= 0) return;
        
        let newHealth = 0;
        if (charType === 'PC') {
            const pc = getPlayerCharacter(charId);
            if(pc) {
              newHealth = Math.max(0, pc.health - damage);
              updateCharacter(charId, { health: newHealth });
            }
        } else {
            const npc = getNpc(charId);
            if(npc) {
              newHealth = Math.max(0, npc.health - damage);
              updateNpc(charId, { health: newHealth });
            }
        }
        updateCombatant(charId, { health: newHealth });

        // Add animations and floating text
        setGameState(prev => {
          const newFloatingText = {
            id: `ft-${Date.now()}`,
            text: `-${damage}`,
            color: '#ef4444', // red-500
            position: defenderPos,
          };
          const newAnimation = {
            id: `anim-${Date.now()}`,
            type: attackSkill === Skill.RangedCombat ? 'ranged' : 'melee' as 'ranged' | 'melee',
            startPos: attackerPos,
            endPos: defenderPos,
          }
          const newCombatState = { 
            ...prev.combat, 
            floatingText: [...prev.combat.floatingText, newFloatingText],
            animations: [...prev.combat.animations, newAnimation],
          };
          // Clear them after a delay - using functional update to avoid stale closure
          setTimeout(() => {
            setGameState(p => ({
              ...p, 
              combat: {
                ...p.combat, 
                floatingText: p.combat.floatingText.filter(ft => ft.id !== newFloatingText.id), 
                animations: p.combat.animations.filter(a => a.id !== newAnimation.id)
              }
            }))
          }, 1000);
          return {...prev, combat: newCombatState };
        });
    }
    
    const getWeaponDamage = (combatant: Combatant) => {
        if (combatant.type === 'PC') {
            const pc = getPlayerCharacter(combatant.id);
            const weapon = pc?.inventory.find(i => i.equipped && (i.type === 'Close' || i.type === 'Ranged') && !i.broken);
            return weapon?.damage || 1;
        }
        return 1; // Default NPC damage
    }

    if (attackerRoll.successes > defenderSuccesses) { // Attacker wins
        let baseDamage = getWeaponDamage(attacker);
        let extraDamage = attackerRoll.successes - defenderSuccesses - 1;
        let totalDamage = baseDamage + extraDamage;
        applyDamage(defenderId, defender.type, totalDamage, attacker.position, defender.position);
        addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `${attacker.name} hits ${defender.name} for ${totalDamage} damage!`, type: 'SYSTEM' });
    } else if (attackerRoll.successes === defenderSuccesses && attackerRoll.successes > 0) { // Tie
        let attackerDamage = getWeaponDamage(attacker);
        let defenderDamage = getWeaponDamage(defender);
        applyDamage(defenderId, defender.type, attackerDamage, attacker.position, defender.position);
        applyDamage(attackerId, attacker.type, defenderDamage, defender.position, attacker.position);
        addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `${attacker.name} and ${defender.name} hit each other simultaneously!`, type: 'SYSTEM' });
    } else { // Defender wins or both fail
        addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `${attacker.name}'s attack is parried or misses!`, type: 'SYSTEM' });
    }

    updateCombatant(attackerId, { hasActed: true });
    
    // Only auto-advance turns for brawl combat, not duels (duels use manual turn control)
    if (isBrawl) {
        nextTurn();
    }
  }, [gameState.combat, gameState.gameMode, addChatMessage, getPlayerCharacter, getNpc, getSkillAttribute, updateCombatant, updateCharacter, updateNpc, nextTurn]);


  const _resolveSingleWalkerAttack = (character: Character) => {
    addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `A walker lunges at ${character.name}!`, type: 'SYSTEM' });
    const defenseRoll = performSkillRoll(character.attributes.Agility + (character.skills.Mobility || 0), character.stress);
    addChatMessage({
        characterId: character.id,
        characterName: character.name,
        characterTokenImage: character.tokenImage,
        content: `tries to dodge the walker.`,
        type: 'ROLL',
        rollResult: { ...defenseRoll, skill: 'Mobility', baseDicePool: character.attributes.Agility + (character.skills.Mobility || 0), stressDicePool: character.stress }
    });

    if(defenseRoll.successes > 0) {
        addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `${character.name} dodges successfully!`, type: 'SYSTEM' });
        return;
    }
    
    addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `${character.name} fails to dodge! Rolling on Walker Attack table...`, type: 'SYSTEM' });
    const attackResult = rollOnTable('Walker Attack');
    if (attackResult) {
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'GM Roll',
            content: 'rolled on the Walker Attack table.',
            type: 'ROLL',
            tableRollResult: attackResult,
        });

        // Parse and apply effects
        const resultText = attackResult.resultText.toLowerCase();
        let finalDamage = 0;
        let finalStress = 0;

        const damageMatch = resultText.match(/take (\w+) points? of damage/);
        if (damageMatch) {
            const dmgStr = damageMatch[1];
            if (dmgStr === 'one') finalDamage = 1;
            else if (dmgStr === 'two') finalDamage = 2;
            else if (dmgStr === 'three') finalDamage = 3;
        }
        
        const stressMatch = resultText.match(/take (\w+) points? of stress/);
         if (stressMatch) {
            const stressStr = stressMatch[1];
            if (stressStr === 'one') finalStress = 1;
        }

        if (resultText.includes('die')) {
            updateCharacter(character.id, { health: 0 });
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `${character.name} has died!`, type: 'SYSTEM' });
        } else {
             if (finalDamage > 0) {
                updateCharacter(character.id, { health: Math.max(0, character.health - finalDamage) });
             }
             if (finalStress > 0) {
                 updateCharacter(character.id, { stress: Math.min(5, character.stress + finalStress) });
             }
        }
    }
  }

  const resolveSwarmRound = useCallback(() => {
    let messedUpActors: Character[] = [];
    const activeActors = gameState.combat.combatants.filter(c => c.selectedSwarmSkill);
    let totalSuccesses = 0;
    
    activeActors.forEach(actor => {
        const skill = actor.selectedSwarmSkill;
        if (!skill) return;

        let dicePool = 0;
        let stressPool = 0;

        if (actor.type === 'PC') {
            const pc = getPlayerCharacter(actor.id);
            if (!pc) return;
            const attr = getSkillAttribute(skill);
            dicePool = (attr ? pc.attributes[attr] : 0) + (pc.skills[skill] || 0);
            stressPool = pc.stress;
            const weapon = pc.inventory.find(i => i.equipped && !i.broken && (i.type === 'Close' || i.type === 'Ranged'));
            if(weapon && (skill === Skill.CloseCombat || skill === Skill.RangedCombat)) dicePool += weapon.bonus || 0;
            const roll = performSkillRoll(dicePool, stressPool);
            addChatMessage({
                characterId: actor.id,
                characterName: actor.name,
                characterTokenImage: actor.tokenImage,
                content: `acts against the swarm using ${skill}.`,
                type: 'ROLL',
                rollResult: {...roll, skill, baseDicePool: dicePool, stressDicePool: stressPool}
            });
            totalSuccesses += roll.successes;
            if (roll.messedUp) {
                messedUpActors.push(pc);
                _handleMessUpDurability(pc.id);
            }
        } else {
            const npc = getNpc(actor.id);
            if (!npc) return;
            const expertise = npc.skillExpertise[skill];
            if (expertise === SkillExpertise.Trained) dicePool = 5;
            else if (expertise === SkillExpertise.Expert) dicePool = 8;
            else if (expertise === SkillExpertise.Master) dicePool = 10;
            else dicePool = 4;
            const roll = performSkillRoll(dicePool, stressPool);
            addChatMessage({
                characterId: actor.id,
                characterName: actor.name,
                characterTokenImage: actor.tokenImage,
                content: `acts against the swarm using ${skill}.`,
                type: 'ROLL',
                rollResult: {...roll, skill, baseDicePool: dicePool, stressDicePool: stressPool}
            });
            totalSuccesses += roll.successes;
        }
    });

    const swarmThreat = gameState.threat.level + (gameState.combat.swarmSize || 0);
    const isWin = totalSuccesses >= swarmThreat;
    const almost = !isWin && totalSuccesses >= swarmThreat / 2;

    const roundResult: SwarmRoundResult = { successes: totalSuccesses, needed: swarmThreat, isWin, almost };
    
    if (isWin) {
        if ((gameState.combat.swarmSize || 1) <= 3) {
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `SUCCESS! The group achieved ${totalSuccesses} successes against a threat of ${swarmThreat}. The swarm is defeated or driven off!`, type: 'SYSTEM' });
            endCombat();
        } else {
            const newSwarmSize = (gameState.combat.swarmSize || 1) - 1;
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `SUCCESS! The group achieved ${totalSuccesses} successes against a threat of ${swarmThreat}. The swarm is weakened! Its size is reduced to ${newSwarmSize}.`, type: 'SYSTEM' });
            setGameState(prev => ({ ...prev, combat: { ...prev.combat, swarmSize: newSwarmSize, swarmRoundResult: roundResult, round: prev.combat.round + 1, combatants: prev.combat.combatants.map(c => ({...c, selectedSwarmSkill: undefined, plannedAction: null})) }, threat: {...prev.threat, swarmSize: newSwarmSize} }));
        }
        if(messedUpActors.length > 0) {
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `Even in success, the chaos is immense! Some survivors messed up...`, type: 'SYSTEM' });
            messedUpActors.forEach(_resolveSingleWalkerAttack);
        }
    } else {
        addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `FAILURE! The group only achieved ${totalSuccesses} successes against a threat of ${swarmThreat}. The walkers win the round...`, type: 'SYSTEM' });
        if (messedUpActors.length > 0) {
            addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: `...and some survivors messed up, making things worse! The GM must choose TWO consequences.`, type: 'SYSTEM' });
        }
        setGameState(prev => ({...prev, combat: {...prev.combat, pendingSwarmConsequence: true, swarmRoundResult: roundResult }}));
    }

  }, [addChatMessage, endCombat, getPlayerCharacter, getNpc, getSkillAttribute, gameState.combat, gameState.threat, _resolveSingleWalkerAttack, rollOnTable, updateCharacter]);

 const applySwarmConsequence = useCallback((consequence?: 'Increase Threat' | 'Increase Swarm Size' | 'Swarm Attack') => {
    let message = '';
    let newThreat = { ...gameState.threat };
    let newCombat = { ...gameState.combat };
    
    let chosenConsequence = consequence;
    if (gameState.gameMode === 'Solo' && !consequence) {
        const rollResult = rollOnTable('Swarm Loss (Solo)');
        if (rollResult?.resultText.toLowerCase().includes('threat')) chosenConsequence = 'Increase Threat';
        else if (rollResult?.resultText.toLowerCase().includes('size')) chosenConsequence = 'Increase Swarm Size';
        else chosenConsequence = 'Swarm Attack';
    }
    if(!chosenConsequence) return;


    switch(chosenConsequence) {
        case 'Increase Threat':
            newThreat.level = Math.min(6, newThreat.level + 1);
            message = `The Threat Level increases to ${newThreat.level}!`;
            break;
        case 'Increase Swarm Size':
            newCombat.swarmSize = Math.min(6, (newCombat.swarmSize || 1) + 1);
            newThreat.swarmSize = newCombat.swarmSize;
            message = `The Swarm Size increases to ${newCombat.swarmSize}!`;
            break;
        case 'Swarm Attack': {
            let attackType = 'Single attack';
            if(gameState.gameMode === 'Solo') {
                 const rollResult = rollOnTable('Swarm Attack (Solo)');
                 if (rollResult?.resultText.toLowerCase().includes('block')) attackType = 'Block';
                 else if (rollResult?.resultText.toLowerCase().includes('mass')) attackType = 'Mass attack';
                 else attackType = 'Single attack';
            } else {
                const availableAttacks = SWARM_COMBAT_TABLE[newThreat.level.toString()]?.attacks || ['Single attack'];
                attackType = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
            }
            
            const targetableCombatants = gameState.combat.combatants.filter(c => c.health > 0);
            if (targetableCombatants.length > 0) {
                const target = targetableCombatants[Math.floor(Math.random() * targetableCombatants.length)];
                
                message = `The swarm performs a ${attackType} on ${target.name}!`;

                if ((attackType === 'Mass attack' || attackType === 'Single attack') && target.type === 'PC') {
                    const pc = getPlayerCharacter(target.id);
                    if (pc) _resolveSingleWalkerAttack(pc);
                } else if (attackType === 'Block') {
                    message = `The swarm blocks all escape routes! Mobility and Stealth rolls now require an extra success.`;
                }
            } else {
                message = 'The swarm attacks, but there are no targets left standing.';
            }
            break;
        }
    }

    addChatMessage({ characterId: 'SYSTEM', characterName: 'System', content: message, type: 'SYSTEM' });
    setGameState(prev => ({
        ...prev,
        threat: newThreat,
        combat: {
            ...newCombat,
            pendingSwarmConsequence: false,
            round: prev.combat.round + 1,
            combatants: prev.combat.combatants.map(c => ({...c, selectedSwarmSkill: undefined, plannedAction: null}))
        }
    }))

 }, [gameState, addChatMessage, rollOnTable, getPlayerCharacter, _resolveSingleWalkerAttack]);

  const setCombatantAction = useCallback((combatantId: string, action: BrawlActionType | null, targetId?: string) => {
    console.log(`🎯 setCombatantAction called for ${combatantId} with action: ${action}`);
    updateCombatant(combatantId, { plannedAction: action ? { type: action, targetId } : null });
  }, [updateCombatant]);

  const resolveNextBrawlPhase = useCallback(() => {
    console.log(`🚀 resolveNextBrawlPhase called`);
    
    // Use setTimeout to ensure we're not in a React render cycle
    setTimeout(() => {
      setGameState(prevState => {
          const combat = prevState.combat;
          if (!combat.isActive || combat.type !== 'Brawl') {
            return prevState;
          }

          // Simple fix: Check if we already processed this phase
          const phaseKey = `${combat.round}_${combat.currentPhaseIndex}`;
          if (combat.lastProcessedPhase === phaseKey) {
            console.log('⚠️ Phase already processed, skipping duplicate execution');
            return prevState;
          }

          const currentPhaseName = BRAWL_PHASES[combat.currentPhaseIndex];
          
          addChatMessage({
              characterId: 'SYSTEM', 
              characterName: 'System', 
              content: `🎯 Resolving ${currentPhaseName} Phase`, 
              type: 'SYSTEM'
          });

          // Get all combatants with planned actions for this phase
          const actorsThisPhase = combat.combatants.filter(c => {
              const actionType = c.plannedAction?.type;
              if (!actionType) return false;
              return BRAWL_ACTION_DEFINITIONS[actionType].phaseIndex === combat.currentPhaseIndex;
          });

          console.log('🔍 Phase Resolution - Total actors this phase:', actorsThisPhase.length);
          console.log('🔍 Phase Resolution - Actors:', actorsThisPhase.map(a => `${a.name}(${a.plannedAction?.type})`).join(', '));

          let updatedCombatants = [...combat.combatants];

        // PHASE 1: TAKING COVER
        if (combat.currentPhaseIndex === 0) {
            console.log('🔄 Processing Taking Cover Phase - Phase Index:', combat.currentPhaseIndex);
            console.log('🔄 Actors this phase:', actorsThisPhase.length);
            
            // Process each character with Take Cover action
            actorsThisPhase.forEach(actor => {
                
                if (actor.plannedAction?.type === 'TakeCover') {
                    console.log('🔄 Processing Take Cover for:', actor.name, 'Type:', actor.type);
                    
                    // Check if already in cover - if so, this is a toggle to leave cover
                    if (actor.isTakingCover) {
                        // Leave cover
                        const actorIndex = updatedCombatants.findIndex(c => c.id === actor.id);
                        if (actorIndex !== -1) {
                            updatedCombatants[actorIndex] = { ...updatedCombatants[actorIndex], isTakingCover: false };
                        }
                        addChatMessage({
                            characterId: 'SYSTEM',
                            characterName: 'System',
                            content: `${actor.name} leaves cover and exposes themselves.`,
                            type: 'SYSTEM'
                        });
                        return; // Skip rolling dice if leaving cover
                    }
                    
                    // Roll Mobility for taking cover
                    if (actor.type === 'PC') {
                        const pc = getPlayerCharacter(actor.id);
                        console.log('🔍 Take Cover - Found PC:', pc);
                        if (pc) {
                            let rollResult: DiceRollResult;
                            try {
                                // Use the new dice service for proper roll cards
                                const dicePool = diceService.calculateDicePool(pc, Skill.Mobility, 0);
                                console.log('🔍 Take Cover - Dice Pool:', dicePool);
                                rollResult = diceService.rollSkillCheck(
                                    dicePool.baseDicePool,
                                    dicePool.stressDicePool,
                                    Skill.Mobility,
                                    false,
                                    0
                                );
                                console.log('🎲 Take Cover - Roll Result:', rollResult);
                                
                                addChatMessage({
                                    characterId: actor.id,
                                    characterName: actor.name,
                                    characterTokenImage: actor.tokenImage,
                                    content: `🛡️ Attempts to take cover (Mobility roll)`,
                                    type: 'ROLL',
                                    rollResult,
                                    canBePushed: !rollResult.pushed && rollResult.successes === 0
                                });
                                console.log('📝 Take Cover - Added ROLL message to chat');
                            } catch (error) {
                                console.error('❌ Error in Take Cover dice rolling:', error);
                                // Fallback to old system if dice service fails
                                const dicePool = (pc.attributes.Agility || 0) + (pc.skills[Skill.Mobility] || 0);
                                const rollResult = performSkillRoll(dicePool, pc.stress, Skill.Mobility);
                                
                                addChatMessage({
                                    characterId: actor.id,
                                    characterName: actor.name,
                                    characterTokenImage: actor.tokenImage,
                                    content: `attempts to take cover`,
                                    type: 'ROLL',
                                    rollResult
                                });
                            }

                            if (rollResult.successes > 0) {
                                // Success - immediate cover
                                const actorIndex = updatedCombatants.findIndex(c => c.id === actor.id);
                                if (actorIndex !== -1) {
                                    updatedCombatants[actorIndex] = { ...updatedCombatants[actorIndex], isTakingCover: true };
                                }
                                addChatMessage({
                                    characterId: 'SYSTEM',
                                    characterName: 'System',
                                    content: `${actor.name} successfully takes cover! (Ranged attacks against them have -1 dice)`,
                                    type: 'SYSTEM'
                                });
                            } else {
                                addChatMessage({
                                    characterId: 'SYSTEM',
                                    characterName: 'System',
                                    content: `${actor.name} fails to find adequate cover this round.`,
                                    type: 'SYSTEM'
                                });
                            }
                        }
                    } else {
                        // NPC taking cover - use dice rolling like PCs
                        const npc = getNpc(actor.id);
                        console.log('🔍 Take Cover - Found NPC:', npc);
                        if (npc) {
                            let rollResult: DiceRollResult;
                            try {
                                // NPCs use skillExpertise instead of attributes + skills
                                // Calculate dice pool manually for NPCs
                                const mobilityExpertise = npc.skillExpertise[Skill.Mobility] || SkillExpertise.None;
                                let baseDicePool = 0;
                                
                                // Convert skill expertise to dice pool
                                switch (mobilityExpertise) {
                                    case SkillExpertise.None:
                                        baseDicePool = 4; // Base 4 dice for no expertise
                                        break;
                                    case SkillExpertise.Trained:
                                        baseDicePool = 5; // 4 + 1
                                        break;
                                    case SkillExpertise.Expert:
                                        baseDicePool = 6; // 4 + 2
                                        break;
                                    case SkillExpertise.Master:
                                        baseDicePool = 7; // 4 + 3
                                        break;
                                }
                                
                                console.log('🔍 Take Cover - NPC Mobility Expertise:', mobilityExpertise, 'Dice Pool:', baseDicePool);
                                
                                rollResult = diceService.rollSkillCheck(
                                    baseDicePool,
                                    0, // NPCs don't have stress
                                    Skill.Mobility,
                                    false,
                                    0
                                );
                                console.log('🎲 Take Cover - NPC Roll Result:', rollResult);
                                
                                addChatMessage({
                                    characterId: actor.id,
                                    characterName: actor.name,
                                    characterTokenImage: actor.tokenImage,
                                    content: `🛡️ Attempts to take cover (Mobility roll)`,
                                    type: 'ROLL',
                                    rollResult,
                                    canBePushed: false // NPCs can't push rolls
                                });
                                console.log('📝 Take Cover - Added NPC ROLL message to chat');
                            } catch (error) {
                                console.error('❌ Error in NPC Take Cover dice rolling:', error);
                                // Fallback to simple success/failure
                                rollResult = {
                                    successes: Math.random() < 0.5 ? 1 : 0,
                                    messedUp: false,
                                    baseDice: [],
                                    stressDice: [],
                                    pushed: false,
                                    skill: Skill.Mobility,
                                    baseDicePool: 2,
                                    stressDicePool: 0
                                };
                                
                                addChatMessage({
                                    characterId: actor.id,
                                    characterName: actor.name,
                                    characterTokenImage: actor.tokenImage,
                                    content: `attempts to take cover`,
                                    type: 'ROLL',
                                    rollResult
                                });
                            }

                            if (rollResult.successes > 0) {
                                // Success - immediate cover
                                const actorIndex = updatedCombatants.findIndex(c => c.id === actor.id);
                                if (actorIndex !== -1) {
                                    updatedCombatants[actorIndex] = { ...updatedCombatants[actorIndex], isTakingCover: true };
                                }
                                addChatMessage({
                                    characterId: 'SYSTEM',
                                    characterName: 'System',
                                    content: `${actor.name} successfully takes cover! (Ranged attacks against them have -1 dice)`,
                                    type: 'SYSTEM'
                                });
                            } else {
                                addChatMessage({
                                    characterId: 'SYSTEM',
                                    characterName: 'System',
                                    content: `${actor.name} fails to find adequate cover this round.`,
                                    type: 'SYSTEM'
                                });
                            }
                        } else {
                            // Fallback if NPC not found - old simple resolution
                            const success = Math.random() < 0.5; // 50% chance for NPCs
                            if (success) {
                                const actorIndex = updatedCombatants.findIndex(c => c.id === actor.id);
                                if (actorIndex !== -1) {
                                    updatedCombatants[actorIndex] = { ...updatedCombatants[actorIndex], isTakingCover: true };
                                }
                                addChatMessage({
                                    characterId: 'SYSTEM',
                                    characterName: 'System',
                                    content: `${actor.name} takes cover! (Ranged attacks against them have -1 dice)`,
                                    type: 'SYSTEM'
                                });
                            }
                        }
                    }
                }
            });
        }

        // PHASE 2: RANGED COMBAT 
        else if (combat.currentPhaseIndex === 1) {
            // Handle Overwatch first
            actorsThisPhase.filter(a => a.plannedAction?.type === 'Overwatch').forEach(actor => {
                const actorIndex = updatedCombatants.findIndex(c => c.id === actor.id);
                if (actorIndex !== -1) {
                    updatedCombatants[actorIndex] = { ...updatedCombatants[actorIndex], isOnOverwatch: true };
                }
                addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: `${actor.name} goes on overwatch, ready to shoot anyone who moves!`,
                    type: 'SYSTEM'
                });
            });

            // Resolve ranged attacks - NPCs declare targets first, then PCs
            const npcAttackers = actorsThisPhase.filter(a => a.type === 'NPC' && a.plannedAction?.type === 'RangedAttack');
            const pcAttackers = actorsThisPhase.filter(a => a.type === 'PC' && a.plannedAction?.type === 'RangedAttack');
            
            [...npcAttackers, ...pcAttackers].forEach(attacker => {
                if (attacker.plannedAction?.targetId) {
                    const defender = combat.combatants.find(c => c.id === attacker.plannedAction?.targetId);
                    if (defender && defender.health > 0) {
                        addChatMessage({
                            characterId: 'SYSTEM',
                            characterName: 'System',
                            content: `${attacker.name} opens fire on ${defender.name}!`,
                            type: 'SYSTEM'
                        });
                        resolveOpposedAttack(attacker.id, defender.id, true);
                    }
                }
            });
        }

        // PHASE 3: CLOSE COMBAT
        else if (combat.currentPhaseIndex === 2) {
            actorsThisPhase.forEach(attacker => {
                if (attacker.plannedAction?.type === 'CloseAttack' && attacker.plannedAction.targetId) {
                    const defender = combat.combatants.find(c => c.id === attacker.plannedAction?.targetId);
                    if (defender && defender.health > 0) {
                        // Check if they're at short range
                        if (attacker.range === RangeCategory.Short) {
                            addChatMessage({
                                characterId: 'SYSTEM',
                                characterName: 'System',
                                content: `${attacker.name} attacks ${defender.name} in close combat!`,
                                type: 'SYSTEM'
                            });
                            resolveOpposedAttack(attacker.id, defender.id, true);
                        } else {
                            addChatMessage({
                                characterId: 'SYSTEM',
                                characterName: 'System',
                                content: `${attacker.name} cannot reach ${defender.name} for close combat! (Not at Short range)`,
                                type: 'SYSTEM'
                            });
                        }
                    }
                }
            });
        }

        // PHASE 4: MOVEMENT
        else if (combat.currentPhaseIndex === 3) {
            actorsThisPhase.forEach(actor => {
                if (actor.plannedAction?.type === 'Move') {
                    // Check for overwatch
                    const overwatchEnemies = updatedCombatants.filter(c => 
                        c.isOnOverwatch && 
                        c.id !== actor.id && 
                        c.health > 0
                    );

                    if (overwatchEnemies.length > 0) {
                        // Someone is watching - they get to shoot
                        overwatchEnemies.forEach(watcher => {
                            addChatMessage({
                                characterId: 'SYSTEM',
                                characterName: 'System',
                                content: `${watcher.name} fires at ${actor.name} as they move!`,
                                type: 'SYSTEM'
                            });
                            resolveOpposedAttack(watcher.id, actor.id, true);
                            
                            // Clear overwatch after shooting
                            const watcherIndex = updatedCombatants.findIndex(c => c.id === watcher.id);
                            if (watcherIndex !== -1) {
                                updatedCombatants[watcherIndex] = { ...updatedCombatants[watcherIndex], isOnOverwatch: false };
                            }
                        });
                    }

                    // Handle movement - simplified for now
                    addChatMessage({
                        characterId: 'SYSTEM',
                        characterName: 'System',
                        content: `${actor.name} moves to a new position.`,
                        type: 'SYSTEM'
                    });
                }
            });
        }

        // PHASE 5: FIRST AID
        else if (combat.currentPhaseIndex === 4) {
            actorsThisPhase.forEach(medic => {
                
                if (medic.plannedAction?.type === 'FirstAid' && medic.plannedAction.targetId) {
                    const patient = combat.combatants.find(c => c.id === medic.plannedAction?.targetId);
                    if (patient && patient.health > 0 && patient.id !== medic.id) {
                        // Roll Medicine
                        if (medic.type === 'PC') {
                            const pc = getPlayerCharacter(medic.id);
                            if (pc) {
                                try {
                                    // Use new dice service for PCs
                                    const dicePool = diceService.calculateDicePool(pc, Skill.Medicine, 0);
                                    const rollResult = diceService.rollSkillCheck(
                                        dicePool.baseDicePool,
                                        dicePool.stressDicePool,
                                        Skill.Medicine,
                                        false,
                                        0
                                    );
                                    
                                    addChatMessage({
                                        characterId: medic.id,
                                        characterName: medic.name,
                                        characterTokenImage: medic.tokenImage,
                                        content: `🏥 Attempts first aid on ${patient.name} (Medicine roll)`,
                                        type: 'ROLL',
                                        rollResult,
                                        canBePushed: !rollResult.pushed && rollResult.successes === 0
                                    });

                                    if (rollResult.successes > 0) {
                                        const healAmount = rollResult.successes;
                                        const patientIndex = updatedCombatants.findIndex(c => c.id === patient.id);
                                        if (patientIndex !== -1) {
                                            const newHealth = Math.min(patient.health + healAmount, 3); // Max 3 health
                                            updatedCombatants[patientIndex] = { ...updatedCombatants[patientIndex], health: newHealth };
                                            
                                            // Update PC health if patient is a PC
                                            if (patient.type === 'PC') {
                                                updateCharacter(patient.id, { health: newHealth });
                                            } else {
                                                updateNpc(patient.id, { health: newHealth });
                                            }
                                        }
                                        
                                        addChatMessage({
                                            characterId: 'SYSTEM',
                                            characterName: 'System',
                                            content: `${medic.name} successfully heals ${patient.name} for ${healAmount} health!`,
                                            type: 'SYSTEM'
                                        });
                                    } else {
                                        addChatMessage({
                                            characterId: 'SYSTEM',
                                            characterName: 'System',
                                            content: `${medic.name}'s first aid attempt fails.`,
                                            type: 'SYSTEM'
                                        });
                                    }
                                } catch (error) {
                                    console.error('❌ Error in First Aid dice rolling:', error);
                                    // Fallback to old system
                                    const dicePool = (pc.attributes.Empathy || 0) + (pc.skills[Skill.Medicine] || 0);
                                    const rollResult = performSkillRoll(dicePool, pc.stress, Skill.Medicine);
                                    
                                    addChatMessage({
                                        characterId: medic.id,
                                        characterName: medic.name,
                                        characterTokenImage: medic.tokenImage,
                                        content: `attempts first aid on ${patient.name}`,
                                        type: 'ROLL',
                                        rollResult
                                    });
                                }
                            }
                        } else {
                            // NPC medic using dice service
                            const npc = getNpc(medic.id);
                            if (npc) {
                                try {
                                    const medicineExpertise = npc.skillExpertise[Skill.Medicine] || SkillExpertise.None;
                                    let baseDicePool = 0;
                                    
                                    switch (medicineExpertise) {
                                        case SkillExpertise.None:
                                            baseDicePool = 4;
                                            break;
                                        case SkillExpertise.Trained:
                                            baseDicePool = 5;
                                            break;
                                        case SkillExpertise.Expert:
                                            baseDicePool = 6;
                                            break;
                                        case SkillExpertise.Master:
                                            baseDicePool = 7;
                                            break;
                                    }
                                    
                                    const rollResult = diceService.rollSkillCheck(
                                        baseDicePool,
                                        0,
                                        Skill.Medicine,
                                        false,
                                        0
                                    );
                                    
                                    addChatMessage({
                                        characterId: medic.id,
                                        characterName: medic.name,
                                        characterTokenImage: medic.tokenImage,
                                        content: `🏥 Attempts first aid on ${patient.name} (Medicine roll)`,
                                        type: 'ROLL',
                                        rollResult,
                                        canBePushed: false
                                    });

                                    if (rollResult.successes > 0) {
                                        const healAmount = rollResult.successes;
                                        const patientIndex = updatedCombatants.findIndex(c => c.id === patient.id);
                                        if (patientIndex !== -1) {
                                            const newHealth = Math.min(patient.health + healAmount, 3);
                                            updatedCombatants[patientIndex] = { ...updatedCombatants[patientIndex], health: newHealth };
                                            
                                            if (patient.type === 'PC') {
                                                updateCharacter(patient.id, { health: newHealth });
                                            } else {
                                                updateNpc(patient.id, { health: newHealth });
                                            }
                                        }
                                        
                                        addChatMessage({
                                            characterId: 'SYSTEM',
                                            characterName: 'System',
                                            content: `${medic.name} successfully heals ${patient.name} for ${healAmount} health!`,
                                            type: 'SYSTEM'
                                        });
                                    } else {
                                        addChatMessage({
                                            characterId: 'SYSTEM',
                                            characterName: 'System',
                                            content: `${medic.name}'s first aid attempt fails.`,
                                            type: 'SYSTEM'
                                        });
                                    }
                                } catch (error) {
                                    console.error('❌ Error in NPC First Aid dice rolling:', error);
                                    // Simple fallback
                                    const success = Math.random() < 0.5;
                                    if (success) {
                                        addChatMessage({
                                            characterId: 'SYSTEM',
                                            characterName: 'System',
                                            content: `${medic.name} successfully provides first aid to ${patient.name}!`,
                                            type: 'SYSTEM'
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        // PHASE 6: OTHER & LEADERSHIP
        else if (combat.currentPhaseIndex === 5) {
            // Handle Leadership first
            const leaders = actorsThisPhase.filter(a => a.plannedAction?.type === 'UseLeadership');
            if (leaders.length > 1) {
                addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: `⚠️ Only one character can use Leadership per round! First declared takes precedence.`,
                    type: 'SYSTEM'
                });
            }
            
            const leader = leaders[0];
            if (leader) {
                
                if (leader.type === 'PC') {
                    const pc = getPlayerCharacter(leader.id);
                    if (pc) {
                        try {
                            // Use new dice service for PCs
                            const dicePool = diceService.calculateDicePool(pc, Skill.Leadership, 0);
                            const rollResult = diceService.rollSkillCheck(
                                dicePool.baseDicePool,
                                dicePool.stressDicePool,
                                Skill.Leadership,
                                false,
                                0
                            );
                            
                            addChatMessage({
                                characterId: leader.id,
                                characterName: leader.name,
                                characterTokenImage: leader.tokenImage,
                                content: `📢 Shouts orders to rally their allies (Leadership roll)`,
                                type: 'ROLL',
                                rollResult,
                                canBePushed: !rollResult.pushed && rollResult.successes === 0
                            });

                            if (rollResult.successes > 0) {
                                addChatMessage({
                                    characterId: 'SYSTEM',
                                    characterName: 'System',
                                    content: `${leader.name} provides ${rollResult.successes} bonus dice to distribute among allies for next round!`,
                                    type: 'SYSTEM'
                                });
                            }
                        } catch (error) {
                            console.error('❌ Error in Leadership dice rolling:', error);
                            // Fallback to old system
                            const dicePool = (pc.attributes.Empathy || 0) + (pc.skills[Skill.Leadership] || 0);
                            const rollResult = performSkillRoll(dicePool, pc.stress, Skill.Leadership);
                            
                            addChatMessage({
                                characterId: leader.id,
                                characterName: leader.name,
                                characterTokenImage: leader.tokenImage,
                                content: `shouts orders to rally their allies`,
                                type: 'ROLL',
                                rollResult
                            });
                        }
                    }
                } else {
                    // NPC leader using dice service
                    const npc = getNpc(leader.id);
                    if (npc) {
                        try {
                            const leadershipExpertise = npc.skillExpertise[Skill.Leadership] || SkillExpertise.None;
                            let baseDicePool = 0;
                            
                            switch (leadershipExpertise) {
                                case SkillExpertise.None:
                                    baseDicePool = 4;
                                    break;
                                case SkillExpertise.Trained:
                                    baseDicePool = 5;
                                    break;
                                case SkillExpertise.Expert:
                                    baseDicePool = 6;
                                    break;
                                case SkillExpertise.Master:
                                    baseDicePool = 7;
                                    break;
                            }
                            
                            const rollResult = diceService.rollSkillCheck(
                                baseDicePool,
                                0,
                                Skill.Leadership,
                                false,
                                0
                            );
                            
                            addChatMessage({
                                characterId: leader.id,
                                characterName: leader.name,
                                characterTokenImage: leader.tokenImage,
                                content: `📢 Shouts orders to rally their allies (Leadership roll)`,
                                type: 'ROLL',
                                rollResult,
                                canBePushed: false
                            });

                            if (rollResult.successes > 0) {
                                addChatMessage({
                                    characterId: 'SYSTEM',
                                    characterName: 'System',
                                    content: `${leader.name} provides ${rollResult.successes} bonus dice to distribute among allies for next round!`,
                                    type: 'SYSTEM'
                                });
                            }
                        } catch (error) {
                            console.error('❌ Error in NPC Leadership dice rolling:', error);
                            // Simple fallback
                            addChatMessage({
                                characterId: 'SYSTEM',
                                characterName: 'System',
                                content: `${leader.name} rallies their allies with inspiring words!`,
                                type: 'SYSTEM'
                            });
                        }
                    }
                }
            }

            // Handle other actions
            actorsThisPhase.filter(a => a.plannedAction?.type === 'Other').forEach(actor => {
                addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: `${actor.name} performs a special action.`,
                    type: 'SYSTEM'
                });
            });
        }

        // Advance to next phase or round
        let newPhaseIndex = combat.currentPhaseIndex + 1;
        let newRound = combat.round;
        let newCombatants = updatedCombatants;

        if (newPhaseIndex >= BRAWL_PHASES.length) {
            // End of round - reset everything
            newPhaseIndex = 0;
            newRound++;
            newCombatants = updatedCombatants.map(c => ({
                ...c, 
                plannedAction: null,
                isOnOverwatch: false // Clear overwatch at end of round
            }));
            
            // Note: Round announcement is handled by nextTurn function to avoid duplication
        }

        return {
            ...prevState,
            combat: {
                ...combat,
                currentPhaseIndex: newPhaseIndex,
                round: newRound,
                combatants: newCombatants,
                lastProcessedPhase: `${combat.round}_${combat.currentPhaseIndex}` // Mark this phase as processed
            }
        };
      });
    }, 0); // Process in next tick
  }, [addChatMessage, resolveOpposedAttack, getPlayerCharacter, performSkillRoll, diceService, getNpc, updateCharacter, updateNpc]);

  const setTurnOrder = useCallback((order: string[]) => {
    setGameState(prevState => ({
      ...prevState,
      combat: {
        ...prevState.combat,
        turnOrder: order,
        currentTurnIndex: 0,
      }
    }));
    
    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `Turn order set: ${order.map(id => {
        const combatant = gameState.combat.combatants.find(c => c.id === id);
        return combatant?.name || 'Unknown';
      }).join(' → ')}`,
      type: 'SYSTEM'
    });
  }, [addChatMessage, gameState.combat.combatants]);

  const addInventoryItem = useCallback((characterId: string, itemTemplate?: Omit<InventoryItem, 'id'|'equipped'>) => {
    const newItem: InventoryItem = { 
        id: `item-${Date.now()}`, 
        name: 'New Item', 
        slots: 1, 
        equipped: false, 
        bonus: 0,
        ...itemTemplate
    };
    updateCharacter(characterId, { inventory: [...(getPlayerCharacter(characterId)?.inventory || []), newItem] });
  }, [getPlayerCharacter, updateCharacter]);

  const updateInventoryItem = useCallback((characterId: string, itemId: string, updates: Partial<InventoryItem>) => {
    updateCharacter(characterId, { inventory: getPlayerCharacter(characterId)?.inventory.map(item => item.id === itemId ? { ...item, ...updates } : item) });
  }, [getPlayerCharacter, updateCharacter]);

  const removeInventoryItem = useCallback((characterId: string, itemId: string) => {
    updateCharacter(characterId, { inventory: getPlayerCharacter(characterId)?.inventory.filter(item => item.id !== itemId) });
  }, [getPlayerCharacter, updateCharacter]);

  const addTalent = useCallback((characterId: string, talentData: Omit<Talent, 'id'>) => {
    if (!talentData.name.trim()) return;
    const newTalent: Talent = { id: `talent-${Date.now()}-${Math.random()}`, ...talentData };
    updateCharacter(characterId, { talents: [...(getPlayerCharacter(characterId)?.talents || []), newTalent] });
  }, [getPlayerCharacter, updateCharacter]);

  const updateTalent = useCallback((characterId: string, talentId: string, updates: Partial<Talent>) => {
    updateCharacter(characterId, { talents: getPlayerCharacter(characterId)?.talents.map(t => t.id === talentId ? { ...t, ...updates } : t) });
  }, [getPlayerCharacter, updateCharacter]);

  const removeTalent = useCallback((characterId: string, talentId: string) => {
    updateCharacter(characterId, { talents: getPlayerCharacter(characterId)?.talents.filter(t => t.id !== talentId) });
  }, [getPlayerCharacter, updateCharacter]);

  const addHavenProject = useCallback(() => {
    const newProject: HavenProject = { id: `proj-${Date.now()}`, name: 'New Project', current: 0, max: 4 };
    setGameState(prevState => ({ ...prevState, haven: { ...prevState.haven, projects: [...prevState.haven.projects, newProject] } }));
  }, []);

  const updateHavenProject = useCallback((projectId: string, updates: Partial<HavenProject>) => {
    setGameState(prevState => ({ ...prevState, haven: { ...prevState.haven, projects: prevState.haven.projects.map(p => p.id === projectId ? { ...p, ...updates } : p) } }));
  }, []);

  const removeHavenProject = useCallback((projectId: string) => {
    setGameState(prevState => ({ ...prevState, haven: { ...prevState.haven, projects: prevState.haven.projects.filter(p => p.id !== projectId) } }));
  }, []);

  const addHavenIssue = useCallback((issue: string) => {
    if (!issue.trim()) return;
    setGameState(prevState => ({ ...prevState, haven: { ...prevState.haven, issues: [...prevState.haven.issues, issue.trim()] } }));
  }, []);

  const removeHavenIssue = useCallback((issueIndex: number) => {
    setGameState(prevState => ({ ...prevState, haven: { ...prevState.haven, issues: prevState.haven.issues.filter((_, i) => i !== issueIndex) } }));
  }, []);

  const addVehicle = useCallback((characterId: string, vehicleTemplate?: Omit<Vehicle, 'id'>) => {
      const character = getPlayerCharacter(characterId);
      if (!character) return;
      const newVehicle: Vehicle = {
          id: `vehicle-${Date.now()}`,
          name: 'New Vehicle',
          maneuverability: 1,
          damage: 1,
          hull: 4,
          armor: 2,
          issue: 'Loud',
          ...vehicleTemplate,
      };
      updateCharacter(characterId, { vehicles: [...character.vehicles, newVehicle] });
  }, [getPlayerCharacter, updateCharacter]);

  const updateVehicle = useCallback((characterId: string, vehicleId: string, updates: Partial<Vehicle>) => {
      const character = getPlayerCharacter(characterId);
      if (!character) return;
      const updatedVehicles = character.vehicles.map(v => v.id === vehicleId ? { ...v, ...updates } : v);
      updateCharacter(characterId, { vehicles: updatedVehicles });
  }, [getPlayerCharacter, updateCharacter]);

  const removeVehicle = useCallback((characterId: string, vehicleId: string) => {
      const character = getPlayerCharacter(characterId);
      if (!character) return;
      const updatedVehicles = character.vehicles.filter(v => v.id !== vehicleId);
      updateCharacter(characterId, { vehicles: updatedVehicles });
  }, [getPlayerCharacter, updateCharacter]);

  const askOracle = useCallback(async (question: string): Promise<string> => {
    const characterNames = gameState.characters.map(c => c.name).join(', ');
    const lastOracleMessage = [...gameState.chatLog].reverse().find(m => m.characterId === 'ORACLE')?.content;
    const context = `Characters: ${characterNames || 'A lone survivor'}. Previous event: ${lastOracleMessage || 'The story is just beginning.'}`;
    
    const responseText = await geminiService.askOracle(question, context);
    return responseText;
  }, [gameState]);

  const generateScene = useCallback(async (): Promise<string> => {
    const characterNames = gameState.characters.map(c => c.name).join(', ');
    const lastOracleMessage = [...gameState.chatLog].reverse().find(m => m.characterId === 'ORACLE')?.content;
    const context = `Characters: ${characterNames || 'A lone survivor'}. Previous event: ${lastOracleMessage || 'The story is just beginning.'}`;
    
    const sceneText = await geminiService.generateScene(context);
    return sceneText;
  }, [gameState]);

  // Custom Data Management
    const addCustomArchetype = useCallback((archetype: ArchetypeDefinition) => {
        setGameState(prev => ({...prev, customArchetypes: [...prev.customArchetypes, archetype]}));
    }, []);
    const updateCustomArchetype = useCallback((index: number, updates: Partial<ArchetypeDefinition>) => {
        setGameState(prev => ({...prev, customArchetypes: prev.customArchetypes.map((arch, i) => i === index ? {...arch, ...updates} : arch)}));
    }, []);
    const removeCustomArchetype = useCallback((index: number) => {
        setGameState(prev => ({...prev, customArchetypes: prev.customArchetypes.filter((_, i) => i !== index)}));
    }, []);

    const addCustomTalent = useCallback((talent: Omit<Talent, 'id'>) => {
        setGameState(prev => ({...prev, customTalents: [...prev.customTalents, talent]}));
    }, []);
    const updateCustomTalent = useCallback((index: number, updates: Partial<Omit<Talent, 'id'>>) => {
        setGameState(prev => ({...prev, customTalents: prev.customTalents.map((talent, i) => i === index ? {...talent, ...updates} : talent)}));
    }, []);
    const removeCustomTalent = useCallback((index: number) => {
        setGameState(prev => ({...prev, customTalents: prev.customTalents.filter((_, i) => i !== index)}));
    }, []);

    const addCustomItem = useCallback((item: Omit<InventoryItem, 'id'|'equipped'>) => {
        setGameState(prev => ({...prev, customItems: [...prev.customItems, item]}));
    }, []);
    const updateCustomItem = useCallback((index: number, updates: Partial<Omit<InventoryItem, 'id'|'equipped'>>) => {
        setGameState(prev => ({...prev, customItems: prev.customItems.map((item, i) => i === index ? {...item, ...updates} : item)}));
    }, []);
    const removeCustomItem = useCallback((index: number) => {
        setGameState(prev => ({...prev, customItems: prev.customItems.filter((_, i) => i !== index)}));
    }, []);
    
    // Faction Management
    const addFaction = useCallback((faction: Omit<Faction, 'id'>) => {
        const newFaction: Faction = {
            id: `faction-${Date.now()}-${Math.random()}`,
            ...faction,
        };
        setGameState(prevState => ({
            ...prevState,
            factions: [...prevState.factions, newFaction],
        }));
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `New faction created: ${newFaction.name}.`,
            type: 'SYSTEM',
        });
    }, [addChatMessage]);

    const updateFaction = useCallback((factionId: string, updates: Partial<Faction>) => {
        setGameState(prevState => ({
            ...prevState,
            factions: prevState.factions.map(f =>
                f.id === factionId ? { ...f, ...updates } : f
            ),
        }));
    }, []);

    const removeFaction = useCallback((factionId: string) => {
        const factionToRemove = gameState.factions.find(f => f.id === factionId);
        setGameState(prevState => ({
            ...prevState,
            factions: prevState.factions.filter(f => f.id !== factionId),
        }));
        if (factionToRemove) {
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `Faction removed: ${factionToRemove.name}.`,
                type: 'SYSTEM',
            });
        }
    }, [addChatMessage, gameState.factions]);

    // Combat Setup
    const initiateCombatSetup = useCallback(() => {
        const setupPayload: CombatSetupPayload = {
            sideA: [],
            sideB: [],
        };
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: 'Initiating combat setup...',
            type: 'COMBAT_SETUP',
            combatSetupPayload: setupPayload,
        });
    }, [addChatMessage]);

    const updateCombatSetup = useCallback((messageId: string, updates: Partial<CombatSetupPayload>) => {
        setGameState(prevState => ({
            ...prevState,
            chatLog: prevState.chatLog.map(msg => {
                if (msg.id === messageId && msg.combatSetupPayload) {
                    return {
                        ...msg,
                        combatSetupPayload: {
                            ...msg.combatSetupPayload,
                            ...updates,
                        },
                    };
                }
                return msg;
            }),
        }));
    }, []);

    const finalizeCombatSetup = useCallback((messageId: string, type: CombatType) => {
        const setupMessage = gameState.chatLog.find(m => m.id === messageId);
        if (!setupMessage || !setupMessage.combatSetupPayload) {
            return;
        }

        // Hide the setup message
        setGameState(prevState => ({
            ...prevState,
            chatLog: prevState.chatLog.filter(m => m.id !== messageId),
        }));

        const { sideA, sideB } = setupMessage.combatSetupPayload;
        const participants = [...sideA, ...sideB];
        startCombat(participants, type, sideA, sideB, gameState.threat.swarmSize);
        
        // Add a message to remind users to switch to Combat tab
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: '⚔️ Combat started! Switch to the Combat tab to manage the encounter.',
            type: 'SYSTEM'
        });
    }, [gameState.chatLog, gameState.threat.swarmSize, startCombat, addChatMessage]);
    
    // Battlemap
    const moveCombatant = useCallback((combatantId: string, newPosition: { x: number; y: number }) => {
        setGameState(prev => ({
            ...prev,
            combat: {
                ...prev.combat,
                combatants: prev.combat.combatants.map(c => 
                    c.id === combatantId ? { ...c, position: newPosition } : c
                ),
            }
        }));
    }, []);

    const toggleCover = useCallback((position: { x: number; y: number }) => {
        setGameState(prev => {
            const existingCoverIndex = prev.combat.grid.cover.findIndex(c => c.x === position.x && c.y === position.y);
            let newCover = [...prev.combat.grid.cover];
            if (existingCoverIndex > -1) {
                newCover.splice(existingCoverIndex, 1);
            } else {
                newCover.push(position);
            }
            return {
                ...prev,
                combat: {
                    ...prev.combat,
                    grid: {
                        ...prev.combat.grid,
                        cover: newCover,
                    }
                }
            };
        });
    }, []);

    const generateAndSetBattlemap = useCallback(async (prompt: string) => {
        addChatMessage({characterId: 'SYSTEM', characterName: 'System', content: `Generating battlemap for: "${prompt}"...`, type: 'SYSTEM'});
        const imageUrl = await geminiService.generateBattlemap(prompt);
        if (imageUrl) {
            setGameState(prev => ({
                ...prev,
                combat: {
                    ...prev.combat,
                    backgroundImage: imageUrl,
                }
            }));
            addChatMessage({characterId: 'SYSTEM', characterName: 'System', content: 'Battlemap generated and applied!', type: 'SYSTEM'});
        } else {
            addChatMessage({characterId: 'SYSTEM', characterName: 'System', content: 'Failed to generate battlemap.', type: 'SYSTEM'});
        }
    }, [addChatMessage]);

    const addGridObject = useCallback((
        type: GridObject['type'], 
        position: { x: number; y: number }, 
        options?: {
            emoji?: string;
            text?: string;
            color?: string;
            width?: number;
            height?: number;
            endPosition?: { x: number; y: number };
            size?: number;
        }
    ) => {
        const newObject: GridObject = {
            id: `grid-obj-${Date.now()}`,
            type,
            position,
            emoji: options?.emoji,
            text: options?.text,
            color: options?.color || '#ffffff',
            width: options?.width || 50,
            height: options?.height || 50,
            endPosition: options?.endPosition,
            size: options?.size || 1.0,
            strokeWidth: 2
        };
        setGameState(prev => ({
            ...prev,
            combat: {...prev.combat, gridObjects: [...prev.combat.gridObjects, newObject]}
        }))
    }, []);

    const updateGridObject = useCallback((objectId: string, updates: Partial<GridObject>) => {
        setGameState(prev => ({
            ...prev,
            combat: {
                ...prev.combat,
                gridObjects: prev.combat.gridObjects.map(o => 
                    o.id === objectId ? { ...o, ...updates } : o
                ),
            }
        }));
    }, []);

    const addRulerMeasurement = useCallback((startPos: { x: number; y: number }, endPos: { x: number; y: number }) => {
        const distance = Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2));
        const newRuler: RulerMeasurement = {
            id: `ruler-${Date.now()}`,
            startPos,
            endPos,
            distance
        };
        setGameState(prev => ({
            ...prev,
            combat: {...prev.combat, rulerMeasurements: [...prev.combat.rulerMeasurements, newRuler]}
        }));
    }, []);

    const removeRulerMeasurement = useCallback((rulerId: string) => {
        setGameState(prev => ({
            ...prev,
            combat: {
                ...prev.combat,
                rulerMeasurements: prev.combat.rulerMeasurements.filter(r => r.id !== rulerId),
            }
        }));
    }, []);

    const clearAllRulers = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            combat: {
                ...prev.combat,
                rulerMeasurements: [],
            }
        }));
    }, []);

    const moveGridObject = useCallback((objectId: string, newPosition: { x: number; y: number }) => {
         setGameState(prev => ({
            ...prev,
            combat: {
                ...prev.combat,
                gridObjects: prev.combat.gridObjects.map(o => 
                    o.id === objectId ? { ...o, position: newPosition } : o
                ),
            }
        }));
    }, []);

    const removeGridObject = useCallback((objectId: string) => {
        setGameState(prev => ({
            ...prev,
            combat: {
                ...prev.combat,
                gridObjects: prev.combat.gridObjects.filter(o => o.id !== objectId),
            }
        }));
    }, []);

    // Session Management
    const saveSession = useCallback(() => {
        const sessionData = JSON.stringify(gameState, null, 2);
        const blob = new Blob([sessionData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const scenarioName = gameState.scenarioName?.replace(/\s/g, '_') || 'session';
        a.href = url;
        a.download = `twd-rpg-session-${scenarioName}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [gameState]);

    const loadSession = useCallback((saveFileContent: string): boolean => {
        try {
            const loadedState = JSON.parse(saveFileContent);
            if (loadedState.gameMode && loadedState.characters) {
                setGameState(loadedState);
                addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'System',
                    content: 'Session loaded successfully.',
                    type: 'SYSTEM',
                });
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to parse session file", e);
            return false;
        }
    }, [addChatMessage]);

    // Brawl Management Functions
    const initiateBrawl = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                isActive: true,
                currentRound: 1,
                currentPhaseIndex: 0,
                participants: [],
                battlemapObjects: [],
            }
        }));
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: 'A new brawl has begun! Use the battlemap to position participants and begin combat.',
            type: 'SYSTEM',
        });
    }, [addChatMessage]);

    const endBrawl = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                isActive: false,
                currentRound: 1,
                currentPhaseIndex: 0,
                participants: [],
                battlemapObjects: [],
            }
        }));
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: 'The brawl has ended.',
            type: 'SYSTEM',
        });
    }, [addChatMessage]);

    const addBrawlParticipant = useCallback((participant: Omit<BrawlParticipant, 'id'>) => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                participants: [...prev.brawl.participants, {
                    ...participant,
                    id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }]
            }
        }));
    }, []);

    const updateBrawlParticipant = useCallback((participantId: string, updates: Partial<BrawlParticipant>) => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                participants: prev.brawl.participants.map(p => 
                    p.id === participantId ? { ...p, ...updates } : p
                )
            }
        }));
    }, []);

    const removeBrawlParticipant = useCallback((participantId: string) => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                participants: prev.brawl.participants.filter(p => p.id !== participantId)
            }
        }));
    }, []);

    const setBrawlParticipantAction = useCallback((participantId: string, action: BrawlActionType, targetId?: string) => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                participants: prev.brawl.participants.map(p => 
                    p.id === participantId ? { ...p, currentAction: action, targetId } : p
                )
            }
        }));
    }, []);

    const nextBrawlPhase = useCallback(() => {
        setGameState(prev => {
            const currentPhase = prev.brawl.currentPhaseIndex;
            const nextPhase = currentPhase + 1;
            
            if (nextPhase >= 6) { // 6 phases in TWD RPG brawl
                return {
                    ...prev,
                    brawl: {
                        ...prev.brawl,
                        currentPhaseIndex: 0,
                        currentRound: prev.brawl.currentRound + 1
                    }
                };
            } else {
                return {
                    ...prev,
                    brawl: {
                        ...prev.brawl,
                        currentPhaseIndex: nextPhase
                    }
                };
            }
        });
    }, []);

    const nextBrawlRound = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                currentRound: prev.brawl.currentRound + 1,
                currentPhaseIndex: 0,
                participants: prev.brawl.participants.map(p => ({
                    ...p,
                    currentAction: undefined,
                    targetId: undefined
                }))
            }
        }));
    }, []);

    const addBattlemapObject = useCallback((object: Omit<BattlemapObject, 'id'>) => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                battlemapObjects: [...prev.brawl.battlemapObjects, {
                    ...object,
                    id: `object-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }]
            }
        }));
    }, []);

    const updateBattlemapObject = useCallback((objectId: string, updates: Partial<BattlemapObject>) => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                battlemapObjects: prev.brawl.battlemapObjects.map(obj => 
                    obj.id === objectId ? { ...obj, ...updates } : obj
                )
            }
        }));
    }, []);

    const removeBattlemapObject = useCallback((objectId: string) => {
        setGameState(prev => ({
            ...prev,
            brawl: {
                ...prev.brawl,
                battlemapObjects: prev.brawl.battlemapObjects.filter(obj => obj.id !== objectId)
            }
        }));
    }, []);

    const generateBrawlBackground = useCallback(async (prompt: AIBackgroundPrompt) => {
        try {
            // For now, we'll just store the prompt. In a real implementation,
            // you would call an AI image generation service here
            setGameState(prev => ({
                ...prev,
                brawl: {
                    ...prev.brawl,
                    aiPrompt: prompt,
                    // backgroundImageUrl would be set here when AI service returns
                }
            }));
            
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: `Background scene prompt set: ${prompt.scene} - ${prompt.environment}`,
                type: 'SYSTEM',
            });
        } catch (error) {
            console.error('Failed to generate background:', error);
            addChatMessage({
                characterId: 'SYSTEM',
                characterName: 'System',
                content: 'Failed to generate background image.',
                type: 'SYSTEM',
            });
        }
    }, [addChatMessage]);

    const value: GameStateContextType = {
        gameState,
        isEditMode,
        toggleEditMode,
        setGameMode,
        resetGame,
        loadSurvivalScenario,
        updateCharacter,
        updateNpc,
        updateHaven,
        getPlayerCharacter,
        getNpc,
        getSkillAttribute,
        toggleItemEquipped,
        addChatMessage,
        rollOnTable,
        pushRoll,
        generateStartingNpcs,
        addCustomNpc,
        addNpcToHaven,
        removeNpcFromHaven,
        generateRandomNpc,
        generateRandomAnimal,
        removeNpc,
        designateCompanion,
        upgradeNpcToPc,
        addClock,
        updateClock,
        removeClock,
        advanceSessionClocks,
        addCharacter,
        addRandomCharacter,
        removeCharacter,
        toggleActiveTalent,
        purchaseTalent,
        purchaseSkillPoint,
        finalizeCharacterCreation,
        rollAndAddCriticalInjury,
        removeCriticalInjury,
        addInventoryItem,
        updateInventoryItem,
        removeInventoryItem,
        addTalent,
        updateTalent,
        removeTalent,
        addVehicle,
        updateVehicle,
        removeVehicle,
        addHavenProject,
        updateHavenProject,
        removeHavenProject,
        addHavenIssue,
        removeHavenIssue,
        initiateCombatSetup,
        updateCombatSetup,
        finalizeCombatSetup,
        endCombat,
        updateCombatant,
        nextTurn,
        setDuelRange,
        resolveOpposedAttack,
        resolveSwarmRound,
        applySwarmConsequence,
        setCombatantAction,
        resolveNextBrawlPhase,
        setTurnOrder,
        moveCombatant,
        toggleCover,
        generateAndSetBattlemap,
        addGridObject,
        updateGridObject,
        moveGridObject,
        removeGridObject,
        addRulerMeasurement,
        removeRulerMeasurement,
        clearAllRulers,
        initiateBrawl,
        endBrawl,
        addBrawlParticipant,
        updateBrawlParticipant,
        removeBrawlParticipant,
        setBrawlParticipantAction,
        nextBrawlPhase,
        nextBrawlRound,
        addBattlemapObject,
        updateBattlemapObject,
        removeBattlemapObject,
        generateBrawlBackground,
        updateThreat,
        askOracle,
        generateScene,
        addCustomArchetype,
        updateCustomArchetype,
        removeCustomArchetype,
        addCustomTalent,
        updateCustomTalent,
        removeCustomTalent,
        addCustomItem,
        updateCustomItem,
        removeCustomItem,
        addFaction,
        updateFaction,
        removeFaction,
        saveSession,
        loadSession,
    };

    return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
};

export const useGameState = (): GameStateContextType => {
    const context = useContext(GameStateContext);
    if (context === undefined) {
        throw new Error('useGameState must be used within a GameStateProvider');
    }
    return context;
};
