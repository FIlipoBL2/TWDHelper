// Animal-specific utilities following Single Responsibility Principle

import { NPC } from '../types';
import { DiceRollResult } from '../types';
import * as diceService from '../services/diceService';
import { Skill } from '../types';

export class AnimalCombatService {
  static performAttack(animal: NPC): DiceRollResult {
    if (!animal.isAnimal || !animal.attackDice) {
      throw new Error('Animal has no attack dice configured');
    }

    return diceService.rollSkillCheck(
      animal.attackDice,
      0, // Animals don't use stress dice
      Skill.CloseCombat
    );
  }

  static canAttack(animal: NPC): boolean {
    return animal.isAnimal === true && animal.health > 0 && (animal.attackDice ?? 0) > 0;
  }

  static getAttackDescription(animal: NPC, result: DiceRollResult): string {
    const hitMiss = result.successes > 0 ? 'Hit' : 'Missed';
    const damage = result.successes > 0 ? (animal.damage ?? '1') : '0';
    return `${animal.name} attacks with ${animal.attackDice ?? 0} dice! ${hitMiss}${result.successes > 0 ? ` for ${damage} damage!` : '!'}`;
  }

  static getCombatStats(animal: NPC): { attackDice: number; damage: string } {
    return {
      attackDice: animal.attackDice ?? 0,
      damage: animal.damage ?? '1'
    };
  }
}

export class AnimalSearchService {
  static getSearchableText(animal: NPC): string[] {
    return [
      animal.name.toLowerCase(),
      animal.archetype.toLowerCase(),
      ...(animal.issues || []).map(issue => issue.toLowerCase())
    ];
  }

  static matchesQuery(animal: NPC, query: string): boolean {
    if (!query) return true;
    
    const searchText = this.getSearchableText(animal);
    const lowerQuery = query.toLowerCase();
    
    return searchText.some(text => text.includes(lowerQuery));
  }
}

export class AnimalManagementService {
  static canBeMovedToHaven(animal: NPC): boolean {
    return animal.isAnimal === true && !animal.isInHaven && animal.health > 0;
  }

  static canBeRemovedFromHaven(animal: NPC): boolean {
    return animal.isAnimal === true && Boolean(animal.isInHaven);
  }

  static getSpeciesFromArchetype(archetype: string): string {
    // Extract species name from archetype like "Dog (Animal)" -> "Dog"
    return archetype.replace(' (Animal)', '');
  }
}

export class AnimalValidationService {
  static isValidAnimal(entity: any): entity is NPC {
    return (
      entity &&
      typeof entity.id === 'string' &&
      typeof entity.name === 'string' &&
      entity.isAnimal === true &&
      typeof entity.attackDice === 'number' &&
      typeof entity.damage === 'string' &&
      typeof entity.health === 'number' &&
      typeof entity.maxHealth === 'number'
    );
  }
}
