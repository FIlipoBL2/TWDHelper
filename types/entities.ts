// Entity interfaces following SOLID principles
import { DiceRollResult, Skill, SkillExpertise } from '../types';

export interface Entity {
  id: string;
  name: string;
}

export interface Combatant {
  health: number;
  maxHealth: number;
  canEngageInCombat(): boolean;
}

export interface Searchable {
  matchesQuery(query: string): boolean;
}

export interface Manageable {
  canBeMovedToHaven(): boolean;
  canBeRemovedFromHaven(): boolean;
}

// Base character entity with common properties
export interface BaseCharacterEntity extends Entity {
  archetype: string;
  health: number;
  maxHealth: number;
  issues: string[];
  inventory: string[];
  isInHaven?: boolean;
  tokenImage?: string;
}

// Animal-specific entity (subset of NPC for TWD RPG animals)
export interface AnimalEntity extends BaseCharacterEntity, Combatant, Searchable, Manageable {
  isAnimal: true;
  attackDice: number;
  damage: string;
  // Note: Animals in TWD RPG don't use skills, only attack dice
}

// NPC-specific entity  
export interface NPCEntity extends BaseCharacterEntity, Combatant, Searchable, Manageable {
  isAnimal?: false;
  skillExpertise: Record<Skill, SkillExpertise>;
  isCompanion?: boolean;
}

// Union type for compatibility with existing NPC interface
export type CharacterEntity = AnimalEntity | NPCEntity;
