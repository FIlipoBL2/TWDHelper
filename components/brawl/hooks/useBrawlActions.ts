import { useCallback, useRef, useEffect } from 'react';
import { BrawlParticipant } from '../../../types/brawl';
import { Character, NPC, Skill, DiceRollResult, SkillExpertise } from '../../../types';
import { rollSkillCheck, calculateDicePool } from '../../../services/diceService';

interface UseBrawlActionsProps {
  participants: BrawlParticipant[];
  characters: Character[];
  npcs: NPC[];
  addChatMessage: (message: any) => void;
  setCombatantAction: (id: string, action: string) => void;
  setRollResult: (result: DiceRollResult | null) => void;
  getParticipantHelpDice: (id: string) => number;
}

export const useBrawlActions = ({
  participants,
  characters,
  npcs,
  addChatMessage,
  setCombatantAction,
  setRollResult,
  getParticipantHelpDice
}: UseBrawlActionsProps) => {

  // Race condition protection: Track pending actions to prevent double-execution
  const pendingActions = useRef<Set<string>>(new Set());
  const rollTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      rollTimeouts.current.forEach(timeout => clearTimeout(timeout));
      rollTimeouts.current.clear();
      pendingActions.current.clear();
    };
  }, []);

  const findCharacterData = useCallback((participant: BrawlParticipant) => {
    if (participant.type === 'PC') {
      return characters.find(c => c.id === participant.id);
    }
    return npcs.find(n => n.id === participant.id);
  }, [characters, npcs]);

  // Protected action execution to prevent race conditions
  const executeProtectedAction = useCallback((
    participant: BrawlParticipant,
    actionId: string,
    action: () => void
  ) => {
    const key = `${participant.id}-${actionId}`;
    
    // Check if action is already pending
    if (pendingActions.current.has(key)) {
      console.warn(`Action ${actionId} already pending for ${participant.name}, skipping duplicate`);
      return false;
    }

    // Mark action as pending
    pendingActions.current.add(key);

    try {
      action();
    } finally {
      // Clear pending status after a short delay to prevent immediate re-execution
      const timeout = setTimeout(() => {
        pendingActions.current.delete(key);
        rollTimeouts.current.delete(key);
      }, 500); // 500ms cooldown

      rollTimeouts.current.set(key, timeout);
    }

    return true;
  }, []);

  const performSkillRoll = useCallback((
    participant: BrawlParticipant,
    skill: Skill,
    actionDescription: string,
    icon: string = '🎲'
  ) => {
    const characterData = findCharacterData(participant);
    if (!characterData) return;

    const actionId = `skill-roll-${skill}`;
    
    executeProtectedAction(participant, actionId, () => {
      const helpDice = getParticipantHelpDice(participant.id);

      try {
        let result: DiceRollResult;
        
        if (participant.type === 'PC') {
          // For PCs, use the standard calculateDicePool function
          const character = characterData as Character;
          const dicePool = calculateDicePool(character, skill, helpDice);
          result = rollSkillCheck(
            dicePool.baseDicePool,
            dicePool.stressDicePool,
            skill,
            false,
            helpDice
          );
        } else {
          // For NPCs, use expertise-based rolling
          const npc = characterData as NPC;
          const expertise = npc.skillExpertise[skill] || SkillExpertise.None;
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
          
          diceCount += helpDice; // Add help dice
          const dice = Array.from({ length: Math.max(1, diceCount) }, () => Math.floor(Math.random() * 6) + 1);
          const successes = dice.filter(die => die === 6).length;
          
          result = {
            baseDice: dice,
            stressDice: [],
            successes,
            messedUp: false,
            pushed: false,
            skill,
            helpDice: helpDice > 0 ? Array.from({ length: helpDice }, () => Math.floor(Math.random() * 6) + 1) : undefined,
            helpDiceCount: helpDice,
            baseDicePool: diceCount - helpDice,
            stressDicePool: 0
          };
        }
        
        setRollResult(result);

        addChatMessage({
          characterId: participant.id,
          characterName: participant.name,
          content: `${icon} ${actionDescription}${helpDice !== 0 ? ` with ${helpDice > 0 ? '+' : ''}${helpDice} help dice` : ''}`,
          type: 'ROLL',
          rollResult: result,
          canBePushed: !result.pushed && result.successes === 0 && participant.type === 'PC'
        });
      } catch (error) {
        console.error(`Error rolling ${skill}:`, error);
      }
    });
  }, [findCharacterData, getParticipantHelpDice, setRollResult, addChatMessage, executeProtectedAction]);

  const actions = {
    move: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Mobility, 'Attempts to move (Mobility roll)', '🏃');
    }, [performSkillRoll]),

    takeCover: useCallback((participant: BrawlParticipant) => {
      const actionId = 'take-cover';
      executeProtectedAction(participant, actionId, () => {
        setCombatantAction(participant.id, 'TakeCover');
        addChatMessage({
          characterId: participant.id,
          characterName: participant.name,
          content: `🛡️ ${participant.name} prepares to take cover (will roll during phase resolution)`,
          type: 'SYSTEM'
        });
      });
    }, [setCombatantAction, addChatMessage, executeProtectedAction]),

    closeCombat: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.CloseCombat, 'Close Combat Attack (Close Combat + Strength)', '⚔️');
    }, [performSkillRoll]),

    rangedCombat: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.RangedCombat, 'Ranged Combat Attack (Ranged Combat + Agility)', '🏹');
    }, [performSkillRoll]),

    firstAid: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Medicine, 'First Aid (Medicine + Empathy)', '🏥');
    }, [performSkillRoll]),

    leadership: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Leadership, 'Leadership Action (Leadership + Empathy)', '👥');
    }, [performSkillRoll]),

    overwatch: useCallback((participant: BrawlParticipant) => {
      const actionId = 'overwatch';
      executeProtectedAction(participant, actionId, () => {
        addChatMessage({
          characterId: participant.id,
          characterName: participant.name,
          content: `👁️ ${participant.name} takes overwatch position (prepared action).`,
          type: 'SYSTEM'
        });
      });
    }, [addChatMessage, executeProtectedAction]),

    // Additional combat actions with proper skill rolls
    stealth: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Stealth, 'Stealth Action (Stealth + Agility)', '🥷');
    }, [performSkillRoll]),

    scout: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Scout, 'Scout Check (Scout + Awareness)', '👀');
    }, [performSkillRoll]),

    survival: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Survival, 'Survival Action (Survival + Awareness)', '🌿');
    }, [performSkillRoll]),

    tech: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Tech, 'Tech Use (Tech + Logic)', '💻');
    }, [performSkillRoll]),

    force: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Force, 'Force Action (Force + Strength)', '💪');
    }, [performSkillRoll]),

    endure: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Endure, 'Endurance Check (Endure + Stamina)', '🛡️');
    }, [performSkillRoll]),

    manipulation: useCallback((participant: BrawlParticipant) => {
      performSkillRoll(participant, Skill.Manipulation, 'Manipulation (Manipulation + Empathy)', '�️');
    }, [performSkillRoll]),

    other: useCallback((participant: BrawlParticipant) => {
      const actionId = 'other';
      executeProtectedAction(participant, actionId, () => {
        addChatMessage({
          characterId: participant.id,
          characterName: participant.name,
          content: `🔧 ${participant.name} performs another action.`,
          type: 'SYSTEM'
        });
      });
    }, [addChatMessage, executeProtectedAction])
  };

  return actions;
};
