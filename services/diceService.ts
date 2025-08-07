/**
 * Dice Service - Centralized dice rolling functionality for TWD Helper
 * This service handles all dice mechanics, including standard rolls, stress dice,
 * and special mechanics like pushing and table rolls.
 * 
 * Performance optimizations:
 * - Caching for expensive calculations
 * - Memoized selectors for skill lookups
 * - Batch operations for multiple rolls
 */

import { DiceRollResult, TableRollResult, Skill, Character } from '../types';
import { SKILL_DEFINITIONS } from '../constants';

// Performance caches
const skillAttributeCache = new Map<Skill, string | undefined>();
const dicePoolCache = new Map<string, { baseDicePool: number; stressDicePool: number }>();
const successChanceCache = new Map<string, { initial: number; pushed: number }>();

// Cache size limits to prevent memory leaks
const MAX_CACHE_SIZE = 200;

/**
 * Clear all caches (useful for testing or memory management)
 */
export const clearCaches = (): void => {
  skillAttributeCache.clear();
  dicePoolCache.clear();
  successChanceCache.clear();
};

/**
 * Roll a specific number of dice
 * @param count Number of dice to roll
 * @returns Array of dice values (1-6)
 */
export const rollDice = (count: number): number[] => {
  if (count <= 0) return [];
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
};

/**
 * Get skill's associated attribute with caching for performance
 */
const getSkillAttribute = (skill: Skill): string | undefined => {
  if (skillAttributeCache.has(skill)) {
    return skillAttributeCache.get(skill);
  }
  
  const attribute = SKILL_DEFINITIONS.find(s => s.name === skill)?.attribute;
  
  // Manage cache size
  if (skillAttributeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = skillAttributeCache.keys().next().value;
    skillAttributeCache.delete(firstKey);
  }
  
  skillAttributeCache.set(skill, attribute);
  return attribute;
};

/**
 * Calculate dice pool for a character and skill with enhanced caching
 */
export const calculateCharacterDicePool = (
  character: Character, 
  skill: Skill,
  helpDice: number = 0,
  gearBonus: number = 0
): { baseDicePool: number; stressDicePool: number; attributeName?: string } => {
  // Create cache key
  const cacheKey = `${character.id}-${skill}-${helpDice}-${gearBonus}-${character.stress}`;
  
  if (dicePoolCache.has(cacheKey)) {
    const cached = dicePoolCache.get(cacheKey)!;
    return { ...cached, attributeName: getSkillAttribute(skill) };
  }

  const attributeName = getSkillAttribute(skill);
  const attributeValue = attributeName ? character.attributes[attributeName] || 0 : 0;
  const skillValue = character.skills[skill] || 0;
  
  // Calculate base dice pool
  let baseDicePool = attributeValue + skillValue + gearBonus;
  
  // Apply help dice (capped at +3, minimum 1 die)
  const cappedHelpDice = Math.max(-baseDicePool + 1, Math.min(3, helpDice));
  baseDicePool = Math.max(1, baseDicePool + cappedHelpDice);
  
  // Stress dice pool equals current stress
  const stressDicePool = character.stress || 0;
  
  const result = { baseDicePool, stressDicePool };
  
  // Manage cache size
  if (dicePoolCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dicePoolCache.keys().next().value;
    dicePoolCache.delete(firstKey);
  }
  
  dicePoolCache.set(cacheKey, result);
  return { ...result, attributeName };
};

/**
 * Calculate success probability for a given dice pool
 * @param baseDicePool Number of base dice
 * @param stressDicePool Number of stress dice
 * @returns Chance of success as percentage (0-100)
 */
export const calculateSuccessChancePercentage = (baseDicePool: number, stressDicePool: number): { initial: number; pushed: number } => {
  const cacheKey = `${baseDicePool}-${stressDicePool}`;
  
  if (successChanceCache.has(cacheKey)) {
    return successChanceCache.get(cacheKey)!;
  }

  // Probability of success on a single die is 1/6
  const singleDieSuccessChance = 1/6;
  
  // Calculate initial success chance
  const totalDice = baseDicePool + stressDicePool;
  const initialChance = Math.round((1 - Math.pow(5/6, totalDice)) * 100);
  
  // Calculate pushed success chance (with extra stress die)
  const pushedTotalDice = baseDicePool + stressDicePool + 1;
  const pushedChance = Math.round((1 - Math.pow(5/6, pushedTotalDice)) * 100);
  
  const result = { initial: initialChance, pushed: pushedChance };
  
  // Manage cache size
  if (successChanceCache.size >= MAX_CACHE_SIZE) {
    const firstKey = successChanceCache.keys().next().value;
    successChanceCache.delete(firstKey);
  }
  
  successChanceCache.set(cacheKey, result);
  return result;
};

/**
 * Roll dice for a specific skill check
 * @param baseDicePool Number of base dice to roll
 * @param stressDicePool Number of stress dice to roll
 * @param skill The skill being tested
 * @param isPushed Whether this is a pushed roll
 * @param helpDiceCount Number of help dice (positive) or hurt dice (negative)
 * @returns Complete dice roll result
 */
export const rollSkillCheck = (
  baseDicePool: number,
  stressDicePool: number,
  skill: Skill | 'Handle Fear' | 'Armor' | 'Mobility',
  isPushed: boolean = false,
  helpDiceCount: number = 0
): DiceRollResult => {
  // Apply help/hurt dice to base dice pool
  // Help dice capped at +3, hurt dice can reduce pool but minimum 1 die
  const cappedHelpDice = Math.max(-baseDicePool + 1, Math.min(3, helpDiceCount));
  const finalBaseDicePool = Math.max(1, baseDicePool + cappedHelpDice);
  
  // Roll base dice (these cannot mess up)
  const baseDice = rollDice(finalBaseDicePool);
  let stressDice: number[] = [];
  
  // Roll stress dice if provided (only from pushing or character stress)
  if (stressDicePool > 0) {
    stressDice = rollDice(stressDicePool);
  }
  
  // Calculate successes from all dice
  const baseSuccesses = baseDice.filter(d => d === 6).length;
  const stressSuccesses = stressDice.filter(d => d === 6).length;
  const totalSuccesses = baseSuccesses + stressSuccesses;
  
  // Check for mess up (only stress dice can roll 1)
  const messedUp = stressDice.includes(1);
  
  return {
    baseDice,
    stressDice,
    helpDice: cappedHelpDice !== 0 ? [] : undefined, // Store help dice count for display
    helpDiceCount: cappedHelpDice,
    successes: totalSuccesses,
    pushed: isPushed,
    messedUp,
    skill,
    baseDicePool: finalBaseDicePool,
    stressDicePool
  };
};

/**
 * Push a previous roll (add stress die and reroll)
 */
export const pushPreviousRoll = (previousRoll: DiceRollResult): DiceRollResult => {
  return rollSkillCheck(
    previousRoll.baseDicePool,
    previousRoll.stressDicePool + 1, // Add one stress die
    previousRoll.skill,
    true, // Mark as pushed
    previousRoll.helpDiceCount
  );
};

/**
 * Batch roll multiple dice checks (useful for group actions)
 */
export const batchRollSkillChecks = (
  rolls: Array<{
    baseDicePool: number;
    stressDicePool: number;
    skill: Skill | 'Handle Fear' | 'Armor' | 'Mobility';
    helpDiceCount?: number;
  }>
): DiceRollResult[] => {
  return rolls.map(roll => 
    rollSkillCheck(
      roll.baseDicePool,
      roll.stressDicePool,
      roll.skill,
      false,
      roll.helpDiceCount || 0
    )
  );
};

/**
 * Roll a d6
 * @param tableName The name of the table being rolled on
 * @returns Table roll result with values between 1-6
 */
export const rollD6 = (tableName: string): TableRollResult => {
  const dice = rollDice(1);
  const roll = `${dice[0]}`;
  
  return {
    tableName,
    roll,
    dice,
    resultText: `Rolled ${roll} on ${tableName}`
  };
};

/**
 * Roll a d66 (two d6, read as tens and ones)
 * @param tableName The name of the table being rolled on
 * @returns Table roll result with values between 11-66
 */
export const rollD66 = (tableName: string): TableRollResult => {
  const dice = rollDice(2);
  const roll = `${dice[0]}${dice[1]}`;
  
  return {
    tableName,
    roll,
    dice,
    resultText: `Rolled ${roll} on ${tableName}`
  };
};

/**
 * Roll a d666 (three d6, read as hundreds, tens, and ones)
 * @param tableName The name of the table being rolled on
 * @returns Table roll result with values between 111-666
 */
export const rollD666 = (tableName: string): TableRollResult => {
  const dice = rollDice(3);
  const roll = `${dice[0]}${dice[1]}${dice[2]}`;
  
  return {
    tableName,
    roll,
    dice,
    resultText: `Rolled ${roll} on ${tableName}`
  };
};

// Legacy compatibility functions
export const calculateSuccessChance = calculateSuccessChancePercentage;
export const calculateDicePool = calculateCharacterDicePool;
export const pushRoll = pushPreviousRoll;
