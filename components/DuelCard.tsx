import React, { useState, memo, useRef, useEffect, useCallback } from 'react';
import { Combatant, RangeCategory, InventoryItem, Skill } from '../types';
import { useGameState } from '../context/GameStateContext';
import { CLOSE_COMBAT_WEAPONS_DEFINITIONS, RANGED_WEAPONS_DEFINITIONS } from '../constants';
import { calculateDicePool } from '../services/diceService';
import { rollSkillCheck } from '../services/diceService';
import { 
  getAttackIcon, 
  getShieldIcon, 
  getMovementIcon, 
  getActionIcon,
  getWarningIcon,
  getMeleeIcon,
  getRangedIcon,
  getSniperIcon,
  getArmorIcon,
  getCoverIcon
} from './common/GameIcons';

interface DuelCardProps {
  combatants: Combatant[];
  currentTurn: number;
  round: number;
  onEndDuel: () => void;
  onNextTurn: () => void;
}

const DuelCard: React.FC<DuelCardProps> = ({ combatants, currentTurn, round, onEndDuel, onNextTurn }) => {
  const { addChatMessage, resolveOpposedAttack, getPlayerCharacter, getNpc, gameState, setDuelRange, updateCombatant } = useGameState();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);
  const [helpDice, setHelpDice] = useState<number>(0);
  const [isInCover, setIsInCover] = useState(false);
  const [showCombatTypeButtons, setShowCombatTypeButtons] = useState(false);
  const [showMoveButtons, setShowMoveButtons] = useState(false);
  const [lastRollResult, setLastRollResult] = useState<any>(null);
  const duelRange = gameState.combat.duelRange || RangeCategory.Short;

  // Auto-clear selected action as a fallback in case of stuck states
  useEffect(() => {
    if (selectedAction) {
      const fallbackTimer = setTimeout(() => {
        console.log('Auto-clearing stuck action:', selectedAction);
        setSelectedAction(null);
        setShowMoveButtons(false);
        setShowCombatTypeButtons(false);
      }, 5000); // 5 second fallback

      return () => clearTimeout(fallbackTimer);
    }
  }, [selectedAction]);
  
  // Use refs to track timeouts for cleanup
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Helper function to safely set timeout with cleanup tracking
  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      timeoutRefs.current.delete(timeout);
      callback();
    }, delay);
    timeoutRefs.current.add(timeout);
    return timeout;
  }, []);
  
  if (combatants.length !== 2) {
    return (
      <div className="bg-gray-800 border border-red-500 rounded-lg p-6 max-w-4xl mx-auto">
        <div className="text-center text-red-400 font-bold text-xl flex items-center justify-center gap-2">
          {getWarningIcon("", 20)} INVALID DUEL: Must have exactly 2 combatants
        </div>
      </div>
    );
  }

  const [combatant1, combatant2] = combatants;
  const activeCombatant = combatants[currentTurn];
  const inactiveCombatant = combatants[1 - currentTurn];

  // Get combatant data
  const getCharacterData = (combatant: Combatant) => {
    if (combatant.type === 'PC') {
      return getPlayerCharacter(combatant.id);
    } else {
      return getNpc(combatant.id);
    }
  };

  const activeCharacter = getCharacterData(activeCombatant);
  const inactiveCharacter = getCharacterData(inactiveCombatant);

  // Get available weapons for active combatant
  const getAvailableWeapons = (): InventoryItem[] => {
    if (!activeCharacter) return [];
    
    if (activeCombatant.type === 'PC') {
      const pc = activeCharacter as any; // Character type
      return pc.inventory.filter((item: InventoryItem) => 
        (item.type === 'Close' || item.type === 'Ranged') && !item.broken
      );
    } else {
      // For NPCs, provide basic weapon options
      return [
        { id: 'npc-unarmed', name: 'Unarmed', type: 'Close', damage: 1, bonus: 0, slots: 0, equipped: false },
        { id: 'npc-knife', name: 'Knife', type: 'Close', damage: 1, bonus: 1, slots: 1, equipped: false },
        { id: 'npc-pistol', name: 'Pistol', type: 'Ranged', damage: 2, bonus: 2, slots: 1, equipped: false }
      ] as InventoryItem[];
    }
  };

  const availableWeapons = getAvailableWeapons();
  const selectedWeapon = selectedWeaponId ? availableWeapons.find(w => w.id === selectedWeaponId) : null;

  // Calculate dice pools for display
  const getAttackDicePool = () => {
    if (!activeCharacter || !selectedWeapon || activeCombatant.type !== 'PC') {
      return { baseDicePool: 0, stressDicePool: 0 };
    }
    
    const skill = selectedWeapon.type === 'Close' ? Skill.CloseCombat : Skill.RangedCombat;
    return calculateDicePool(activeCharacter as any, skill, helpDice);
  };

  const dicePool = getAttackDicePool();

  // Get armor information for both combatants
  const getArmorInfo = (combatant: Combatant) => {
    if (combatant.type === 'PC') {
      const pc = getPlayerCharacter(combatant.id);
      if (pc) {
        const armor = pc.inventory.find(i => i.equipped && i.type === 'Armor');
        return armor ? { name: armor.name, level: armor.armorLevel || 0 } : null;
      }
    } else {
      const npc = getNpc(combatant.id);
      if (npc && combatant.armorLevel > 0) {
        return { name: 'Armor', level: combatant.armorLevel };
      }
    }
    return null;
  };

  const handleAttack = () => {
    if (!selectedWeapon) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: 'Please select a weapon before attacking!',
        type: 'SYSTEM'
      });
      return;
    }

    setSelectedAction('Attack');
    setShowCombatTypeButtons(true);
    setShowMoveButtons(false);
  };

  const handleCloseCombatAttack = () => {
    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `${activeCombatant.name} attacks ${inactiveCombatant.name} with ${selectedWeapon!.name} in close combat! ${helpDice !== 0 ? `(${helpDice > 0 ? '+' : ''}${helpDice} ${helpDice > 0 ? 'Help' : 'Hurt'} Dice)` : ''}`,
      type: 'IC'
    });
    
    // Perform actual attack roll using the dice service
    if (activeCharacter && activeCombatant.type === 'PC') {
      const skill = selectedWeapon!.type === 'Close' ? Skill.CloseCombat : Skill.RangedCombat;
      const attackPool = calculateDicePool(activeCharacter as any, skill, 0);
      const rollResult = rollSkillCheck(
        attackPool.baseDicePool,
        0, // No stress dice for initial roll
        skill,
        false,
        helpDice // Apply help/hurt dice to dice pool
      );
      
      // Store result for potential pushing
      setLastRollResult(rollResult);
      
      const success = rollResult.successes > 0;
      
      // Add the detailed roll result to chat with the dice card
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for ${skill}.`,
        type: 'ROLL',
        rollResult: rollResult
      });
      
      if (success) {
        const damage = selectedWeapon!.damage || 1;
        const armorInfo = getArmorInfo(inactiveCombatant);
        const armorLevel = armorInfo?.level || 0;
        
        if (armorLevel > 0) {
          // Roll armor defense
          const armorRoll = rollSkillCheck(armorLevel, 0, 'Armor');
          addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `${inactiveCombatant.name}'s armor rolls for defense.`,
            type: 'ROLL',
            rollResult: armorRoll
          });
          
          const damageReduced = Math.min(damage, armorRoll.successes);
          const finalDamage = Math.max(0, damage - damageReduced);
          
          addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `✅ Hit! ${damage} damage ${damageReduced > 0 ? `reduced by ${damageReduced} (armor)` : ''} = ${finalDamage} final damage!`,
            type: 'SYSTEM'
          });
        } else {
          addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `✅ Hit! ${damage} damage dealt!`,
            type: 'SYSTEM'
          });
        }
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ Attack missed!`,
          type: 'SYSTEM'
        });
      }
    } else {
      // For NPCs, use simplified roll
      const npcRoll = rollSkillCheck(3, 0, Skill.CloseCombat);
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Close Combat.`,
        type: 'ROLL',
        rollResult: npcRoll
      });
      
      if (npcRoll.successes > 0) {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ Hit! 1 damage dealt!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ Attack missed!`,
          type: 'SYSTEM'
        });
      }
    }
    
    // Reset UI state but don't auto-advance turn - let player manually end turn
    setSelectedAction(null);
    setSelectedWeaponId(null);
    setHelpDice(0);
    setShowCombatTypeButtons(false);
  };

  const handlePushRoll = () => {
    if (!lastRollResult || !activeCharacter || activeCombatant.type !== 'PC') {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: 'Cannot push this roll!',
        type: 'SYSTEM'
      });
      return;
    }

    if (lastRollResult.successes > 0) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: 'Cannot push a successful roll!',
        type: 'SYSTEM'
      });
      return;
    }

    if (lastRollResult.pushed) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: 'This roll has already been pushed!',
        type: 'SYSTEM'
      });
      return;
    }

    // Calculate stress dice from previous non-success base dice
    const stressDiceCount = lastRollResult.baseDice.filter(d => d !== 6).length;
    
    const skill = selectedWeapon!.type === 'Close' ? Skill.CloseCombat : Skill.RangedCombat;
    const attackPool = calculateDicePool(activeCharacter as any, skill, 0);
    
    const pushedResult = rollSkillCheck(
      attackPool.baseDicePool,
      stressDiceCount,
      skill,
      true,
      helpDice
    );

    setLastRollResult(pushedResult);

    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `pushes the roll for ${skill}! (${stressDiceCount} stress dice)`,
      type: 'ROLL',
      rollResult: pushedResult
    });

    if (pushedResult.messedUp) {
      addChatMessage({
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `💥 ${activeCombatant.name} messed up! (Rolled 1 on stress dice)`,
        type: 'SYSTEM'
      });
    }
  };

  const handleRangedCombatAttack = () => {
    const coverMessage = inactiveCombatant.isTakingCover ? ' (Target in cover - harder to hit!)' : '';
    
    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `${activeCombatant.name} attacks ${inactiveCombatant.name} with ${selectedWeapon!.name} at range!${coverMessage} ${helpDice !== 0 ? `(${helpDice > 0 ? '+' : ''}${helpDice} ${helpDice > 0 ? 'Help' : 'Hurt'} Dice)` : ''}`,
      type: 'IC'
    });
    
    // Perform actual attack roll using the dice service
    if (activeCharacter && activeCombatant.type === 'PC') {
      const skill = selectedWeapon!.type === 'Close' ? Skill.CloseCombat : Skill.RangedCombat;
      let effectiveHelpDice = helpDice;
      
      // Apply cover penalty
      if (inactiveCombatant.isTakingCover) {
        effectiveHelpDice -= 2; // Cover imposes -2 dice penalty
      }
      
      const attackPool = calculateDicePool(activeCharacter as any, skill, 0);
      const rollResult = rollSkillCheck(
        attackPool.baseDicePool,
        0, // No stress dice for initial roll
        skill,
        false,
        effectiveHelpDice // Apply effective help/hurt dice to dice pool
      );
      
      // Store result for potential pushing
      setLastRollResult(rollResult);
      
      const success = rollResult.successes > 0;
      
      // Add the detailed roll result to chat with the dice card
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for ${skill}${inactiveCombatant.isTakingCover ? ' (vs Cover)' : ''}.`,
        type: 'ROLL',
        rollResult: rollResult
      });
      
      if (success) {
        const damage = selectedWeapon!.damage || 1;
        const armorInfo = getArmorInfo(inactiveCombatant);
        const armorLevel = armorInfo?.level || 0;
        
        if (armorLevel > 0) {
          // Roll armor defense
          const armorRoll = rollSkillCheck(armorLevel, 0, 'Armor');
          addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `${inactiveCombatant.name}'s armor rolls for defense.`,
            type: 'ROLL',
            rollResult: armorRoll
          });
          
          const damageReduced = Math.min(damage, armorRoll.successes);
          const finalDamage = Math.max(0, damage - damageReduced);
          
          addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `✅ Hit! ${damage} damage ${damageReduced > 0 ? `reduced by ${damageReduced} (armor)` : ''} = ${finalDamage} final damage!`,
            type: 'SYSTEM'
          });
        } else {
          addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: `✅ Hit! ${damage} damage dealt!`,
            type: 'SYSTEM'
          });
        }
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ Attack missed!`,
          type: 'SYSTEM'
        });
      }
    } else {
      // For NPCs, use simplified roll
      const npcRoll = rollSkillCheck(3, 0, Skill.RangedCombat);
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Ranged Combat.`,
        type: 'ROLL',
        rollResult: npcRoll
      });
      
      if (npcRoll.successes > 0) {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ Hit! 2 damage dealt!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ Attack missed!`,
          type: 'SYSTEM'
        });
      }
    }
    
    // Reset UI state but don't auto-advance turn - let player manually end turn
    setSelectedAction(null);
    setSelectedWeaponId(null);
    setHelpDice(0);
    setShowCombatTypeButtons(false);
  };

  const handleTakeCover = () => {
    setSelectedAction('TakeCover');
    
    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `${activeCombatant.name} attempts to take cover! (Rolling Mobility...)`,
      type: 'IC'
    });

    // Perform actual Mobility roll using the dice service
    if (activeCharacter && activeCombatant.type === 'PC') {
      const mobilityPool = calculateDicePool(activeCharacter as any, Skill.Mobility, 0);
      const rollResult = rollSkillCheck(
        mobilityPool.baseDicePool,
        mobilityPool.stressDicePool,
        'Mobility'
      );
      
      const success = rollResult.successes > 0;
      
      // Add the detailed roll result to chat with the dice card
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: rollResult
      });
      
      if (success) {
        setIsInCover(true);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully finds cover! Ranged attacks against them will be harder to hit.`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to find adequate cover this round.`,
          type: 'SYSTEM'
        });
      }
    } else {
      // For NPCs, create a simplified roll result that still uses the card system
      const npcRollResult = rollSkillCheck(2, 0, 'Mobility'); // Simple 2-dice roll for NPCs
      const success = npcRollResult.successes > 0;
      
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: npcRollResult
      });
      
      if (success) {
        setIsInCover(true);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully finds cover! Ranged attacks against them will be harder to hit.`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to find adequate cover this round.`,
          type: 'SYSTEM'
        });
      }
    }
    
    // Reset UI state but don't auto-advance turn - let player manually end turn
    setSelectedAction(null);
  };

  const handleMove = () => {
    setSelectedAction('Move');
    setShowMoveButtons(true);
    setShowCombatTypeButtons(false);
  };

  const handleMoveToShort = () => {
    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `${activeCombatant.name} attempts to move to short range! (Rolling Mobility...)`,
      type: 'IC'
    });

    // Perform Mobility roll for movement
    if (activeCharacter && activeCombatant.type === 'PC') {
      const mobilityPool = calculateDicePool(activeCharacter as any, Skill.Mobility, 0);
      const rollResult = rollSkillCheck(
        mobilityPool.baseDicePool,
        mobilityPool.stressDicePool,
        'Mobility'
      );
      
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: rollResult
      });
      
      if (rollResult.successes > 0) {
        setDuelRange(RangeCategory.Short);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully moves to short range!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to move - stays at current range!`,
          type: 'SYSTEM'
        });
      }
    } else {
      // For NPCs, use simplified roll
      const npcRoll = rollSkillCheck(2, 0, 'Mobility');
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: npcRoll
      });
      
      if (npcRoll.successes > 0) {
        setDuelRange(RangeCategory.Short);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully moves to short range!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to move - stays at current range!`,
          type: 'SYSTEM'
        });
      }
    }
    
    finishMoveAction();
  };

  const handleMoveToLong = () => {
    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `${activeCombatant.name} attempts to move to long range! (Rolling Mobility...)`,
      type: 'IC'
    });

    // Perform Mobility roll for movement
    if (activeCharacter && activeCombatant.type === 'PC') {
      const mobilityPool = calculateDicePool(activeCharacter as any, Skill.Mobility, 0);
      const rollResult = rollSkillCheck(
        mobilityPool.baseDicePool,
        mobilityPool.stressDicePool,
        'Mobility'
      );
      
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: rollResult
      });
      
      if (rollResult.successes > 0) {
        setDuelRange(RangeCategory.Long);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully moves to long range!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to move - stays at current range!`,
          type: 'SYSTEM'
        });
      }
    } else {
      // For NPCs, use simplified roll
      const npcRoll = rollSkillCheck(2, 0, 'Mobility');
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: npcRoll
      });
      
      if (npcRoll.successes > 0) {
        setDuelRange(RangeCategory.Long);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully moves to long range!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to move - stays at current range!`,
          type: 'SYSTEM'
        });
      }
    }
    
    finishMoveAction();
  };

  const handleMoveToExtreme = () => {
    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `${activeCombatant.name} attempts to move to extreme range! (Rolling Mobility...)`,
      type: 'IC'
    });

    // Perform Mobility roll for movement
    if (activeCharacter && activeCombatant.type === 'PC') {
      const mobilityPool = calculateDicePool(activeCharacter as any, Skill.Mobility, 0);
      const rollResult = rollSkillCheck(
        mobilityPool.baseDicePool,
        mobilityPool.stressDicePool,
        'Mobility'
      );
      
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: rollResult
      });
      
      if (rollResult.successes > 0) {
        setDuelRange(RangeCategory.Extreme);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully moves to extreme range!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to move - stays at current range!`,
          type: 'SYSTEM'
        });
      }
    } else {
      // For NPCs, use simplified roll
      const npcRoll = rollSkillCheck(2, 0, 'Mobility');
      addChatMessage({
        characterId: activeCombatant.id,
        characterName: activeCombatant.name,
        content: `rolled for Mobility.`,
        type: 'ROLL',
        rollResult: npcRoll
      });
      
      if (npcRoll.successes > 0) {
        setDuelRange(RangeCategory.Extreme);
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `✅ ${activeCombatant.name} successfully moves to extreme range!`,
          type: 'SYSTEM'
        });
      } else {
        addChatMessage({
          characterId: 'SYSTEM',
          characterName: 'System',
          content: `❌ ${activeCombatant.name} fails to move - stays at current range!`,
          type: 'SYSTEM'
        });
      }
    }
    
    finishMoveAction();
  };

  const finishMoveAction = () => {
    // Reset UI state but don't auto-advance turn - let player manually end turn
    setSelectedAction(null);
    setShowMoveButtons(false);
  };

  const handleOther = () => {
    setSelectedAction('Other');
    addChatMessage({
      characterId: activeCombatant.id,
      characterName: activeCombatant.name,
      content: `${activeCombatant.name} performs another action.`,
      type: 'IC'
    });
    
    // Reset UI state but don't auto-advance turn - let player manually end turn
    setSelectedAction(null);
  };

  const getHealthColor = (health: number) => {
    if (health <= 1) return 'text-red-400';
    if (health <= 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRangeColor = (range: RangeCategory) => {
    switch (range) {
      case RangeCategory.Short: return 'text-yellow-400';
      case RangeCategory.Long: return 'text-blue-400';
      case RangeCategory.Extreme: return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 border border-red-500 rounded-lg p-4 max-w-2xl mx-auto shadow-lg">
      {/* Header with VS Logo */}
      <div className="flex items-center justify-center mb-4">
        <img 
          src="/VS logo.png" 
          alt="VS" 
          className="w-16 h-16"
        />
      </div>

      {/* Round Counter */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-red-500">DUEL - Round {round}</h3>
        <p className="text-gray-400 text-sm">Current Turn: {activeCombatant.name}</p>
      </div>

      {/* Combatants Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left Combatant */}
        <div className={`text-center p-3 rounded border-2 ${
          currentTurn === 0 ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600'
        }`}>
          <img 
            src={combatant1.tokenImage || "/default-token.svg"} 
            alt={combatant1.name}
            className="w-12 h-12 mx-auto mb-1 rounded-full border-2 border-blue-500"
          />
          <h4 className="font-bold text-blue-400 text-sm">{combatant1.name}</h4>
          <div className="text-xs">
            <div className={`font-medium ${getHealthColor(combatant1.health)}`}>
              Health: {combatant1.health}/3
            </div>
            <div className="flex justify-center gap-1 mt-1">
              <button
                onClick={() => updateCombatant(combatant1.id, { health: Math.max(0, combatant1.health - 1) })}
                className="px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                disabled={combatant1.health <= 0}
              >
                -
              </button>
              <button
                onClick={() => updateCombatant(combatant1.id, { health: Math.min(3, combatant1.health + 1) })}
                className="px-1 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                disabled={combatant1.health >= 3}
              >
                +
              </button>
            </div>
            {getArmorInfo(combatant1) && (
              <div className="text-green-400 text-xs flex items-center gap-1">
                {getArmorIcon("", 12)} {getArmorInfo(combatant1)!.name} ({getArmorInfo(combatant1)!.level})
              </div>
            )}
            {combatant1.isTakingCover && (
              <div className="text-blue-300 text-xs flex items-center gap-1">
                {getCoverIcon("", 12)} In Cover
              </div>
            )}
          </div>
        </div>

        {/* Right Combatant */}
        <div className={`text-center p-3 rounded border-2 ${
          currentTurn === 1 ? 'border-red-500 bg-red-900/20' : 'border-gray-600'
        }`}>
          <img 
            src={combatant2.tokenImage || "/default-token.svg"} 
            alt={combatant2.name}
            className="w-12 h-12 mx-auto mb-1 rounded-full border-2 border-red-500"
          />
          <h4 className="font-bold text-red-400 text-sm">{combatant2.name}</h4>
          <div className="text-xs">
            <div className={`font-medium ${getHealthColor(combatant2.health)}`}>
              Health: {combatant2.health}/3
            </div>
            <div className="flex justify-center gap-1 mt-1">
              <button
                onClick={() => updateCombatant(combatant2.id, { health: Math.max(0, combatant2.health - 1) })}
                className="px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                disabled={combatant2.health <= 0}
              >
                -
              </button>
              <button
                onClick={() => updateCombatant(combatant2.id, { health: Math.min(3, combatant2.health + 1) })}
                className="px-1 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                disabled={combatant2.health >= 3}
              >
                +
              </button>
            </div>
            {getArmorInfo(combatant2) && (
              <div className="text-green-400 text-xs flex items-center gap-1">
                {getArmorIcon("", 12)} {getArmorInfo(combatant2)!.name} ({getArmorInfo(combatant2)!.level})
              </div>
            )}
            {combatant2.isTakingCover && (
              <div className="text-blue-300 text-xs flex items-center gap-1">
                {getCoverIcon("", 12)} In Cover
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weapon Selection and Help Dice - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Weapon Selection */}
        <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-700">
          <label className="block text-purple-300 font-bold text-sm mb-2">
            🗡️ SELECT WEAPON
          </label>
          
          <select
            value={selectedWeaponId || ''}
            onChange={(e) => setSelectedWeaponId(e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="">-- Choose Weapon --</option>
            {availableWeapons.map((weapon) => {
              const damage = weapon.damage || 1;
              const bonus = weapon.bonus || 0;
              return (
                <option key={weapon.id} value={weapon.id}>
                  {weapon.name} ({damage} dmg{bonus > 0 ? `, +${bonus} bonus` : ''})
                </option>
              );
            })}
          </select>
          
          {selectedWeapon && (
            <div className="mt-2 p-2 bg-purple-800/20 rounded border border-purple-600/50">
              <div className="text-xs text-purple-200">
                <div className="font-bold text-purple-100 mb-1">SELECTED WEAPON:</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-white font-semibold">{selectedWeapon.name}</span>
                  <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs font-bold">
                    {selectedWeapon.damage || 1} DMG
                  </span>
                  {selectedWeapon.bonus && selectedWeapon.bonus > 0 && (
                    <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs font-bold">
                      +{selectedWeapon.bonus} BONUS
                    </span>
                  )}
                  {selectedWeapon.poisonLevel && selectedWeapon.poisonLevel > 0 && (
                    <span className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-xs font-bold">
                      ☠️ POISON {selectedWeapon.poisonLevel}
                    </span>
                  )}
                  {selectedWeapon.isIncendiary && (
                    <span className="px-2 py-1 bg-orange-600 text-orange-100 rounded text-xs font-bold">
                      🔥 INCENDIARY
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Dice Controls */}
        <div className="p-2 bg-green-900/30 rounded border border-green-700">
          <label className="block font-bold text-sm mb-1 text-center">
            {helpDice >= 0 ? 'HELP DICE:' : 'HURT DICE:'}
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                // Get current combatant's dice pool to calculate hurt dice limit
                const currentCharacter = getCharacterData(activeCombatant);
                if (currentCharacter) {
                  const skill = selectedWeapon?.type === 'Close' ? Skill.CloseCombat : Skill.RangedCombat;
                  const attackPool = calculateDicePool(currentCharacter as any, skill, 0);
                  const baseDicePool = attackPool.baseDicePool;
                  // Can't reduce dice pool below 1
                  const minHelpDice = -(baseDicePool - 1);
                  setHelpDice(Math.max(minHelpDice, helpDice - 1));
                } else {
                  setHelpDice(helpDice - 1);
                }
              }}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              -
            </button>
            <span className={`font-bold text-sm min-w-[1.5rem] text-center ${
              helpDice > 0 ? 'text-green-400' : helpDice < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {helpDice}
            </span>
            <button
              onClick={() => setHelpDice(Math.min(3, helpDice + 1))}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
              disabled={helpDice >= 3}
            >
              +
            </button>
            <span className={`text-xs ml-1 ${
              helpDice > 0 ? 'text-green-200' : helpDice < 0 ? 'text-red-200' : 'text-gray-400'
            }`}>
              {helpDice > 0 ? `+${helpDice} dice to pool` : helpDice < 0 ? `${helpDice} dice from pool` : 'No modifier'}
              {helpDice >= 3 ? ' (Max)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={handleAttack}
          disabled={selectedAction === 'Attack' || !selectedWeapon}
          className={`px-3 py-2 rounded font-bold text-white transition-all text-sm ${
            selectedAction === 'Attack'
              ? 'bg-yellow-600 cursor-not-allowed'
              : !selectedWeapon
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <div className="flex items-center gap-1">
            {getAttackIcon("", 14)}
            {selectedAction === 'Attack' ? 'ATTACKING...' : 'ATTACK'}
          </div>
        </button>

        <button
          onClick={handleTakeCover}
          disabled={selectedAction === 'TakeCover'}
          className={`px-3 py-2 rounded font-bold text-white transition-all text-sm ${
            selectedAction === 'TakeCover'
              ? 'bg-yellow-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <div className="flex items-center gap-1">
            {getShieldIcon("", 14)}
            {selectedAction === 'TakeCover' ? 'TAKING COVER...' : 'TAKE COVER'}
          </div>
        </button>

        <button
          onClick={handleMove}
          disabled={selectedAction === 'Move'}
          className={`px-3 py-2 rounded font-bold text-white transition-all text-sm ${
            selectedAction === 'Move'
              ? 'bg-yellow-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <div className="flex items-center gap-1">
            {getMovementIcon("", 14)}
            {selectedAction === 'Move' ? 'MOVING...' : 'MOVE'}
          </div>
        </button>

        <button
          onClick={handleOther}
          disabled={selectedAction === 'Other'}
          className={`px-3 py-2 rounded font-bold text-white transition-all text-sm ${
            selectedAction === 'Other'
              ? 'bg-yellow-600 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <div className="flex items-center gap-1">
            {getActionIcon("", 14)}
            {selectedAction === 'Other' ? 'ACTING...' : 'OTHER'}
          </div>
        </button>
      </div>

      {/* Combat Type Sub-buttons */}
      {showCombatTypeButtons && selectedAction === 'Attack' && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-md border border-red-500/30">
          <h4 className="text-center text-red-400 font-bold text-sm mb-2">Choose Attack Type:</h4>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleCloseCombatAttack}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                {getMeleeIcon("", 14)}
                CLOSE COMBAT ATTACK
              </div>
            </button>
            <button
              onClick={handleRangedCombatAttack}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                {getRangedIcon("", 14)}
                RANGED COMBAT ATTACK
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Movement Sub-buttons */}
      {showMoveButtons && selectedAction === 'Move' && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-md border border-green-500/30">
          <h4 className="text-center text-green-400 font-bold text-sm mb-2">Choose Movement:</h4>
          <div className="grid grid-cols-1 gap-2">
            {duelRange !== RangeCategory.Short && (
              <button
                onClick={handleMoveToShort}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  {getMeleeIcon("", 14)}
                  MOVE TO SHORT RANGE
                </div>
              </button>
            )}
            {duelRange !== RangeCategory.Long && (
              <button
                onClick={handleMoveToLong}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  {getRangedIcon("", 14)}
                  MOVE TO LONG RANGE
                </div>
              </button>
            )}
            {duelRange !== RangeCategory.Extreme && (
              <button
                onClick={handleMoveToExtreme}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  {getSniperIcon("", 14)}
                  MOVE TO EXTREME RANGE
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Push Roll Button (only for PCs with failed rolls) */}
      {lastRollResult && 
       activeCombatant.type === 'PC' && 
       lastRollResult.successes === 0 && 
       !lastRollResult.pushed && (
        <div className="mb-4 p-3 bg-yellow-700/30 rounded-md border border-yellow-500/30">
          <div className="text-center">
            <button
              onClick={handlePushRoll}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold text-sm transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                🎲 PUSH ROLL (Add Stress Dice)
              </div>
            </button>
            <p className="text-yellow-300 text-xs mt-1">
              Add stress dice equal to failed base dice. Risk messing up!
            </p>
          </div>
        </div>
      )}

      {/* Debug: Reset Action Button (temporary) */}
      {selectedAction && (
        <div className="text-center mb-4">
          <button
            onClick={() => {
              setSelectedAction(null);
              setShowMoveButtons(false);
              setShowCombatTypeButtons(false);
            }}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs"
          >
            Reset Action (Debug)
          </button>
        </div>
      )}

      {/* End Duel Button */}
      <div className="text-center">
        <button
          onClick={onEndDuel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
        >
          End Duel
        </button>
      </div>
    </div>
  );
};

export default memo(DuelCard);
