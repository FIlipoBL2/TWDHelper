// NPC-specific utilities following Single Responsibility Principle

import { NPC, Skill, SkillExpertise } from '../types';

export class NPCSearchService {
  static getSearchableText(npc: NPC): string[] {
    return [
      npc.name.toLowerCase(),
      npc.archetype.toLowerCase(),
      ...(npc.issues || []).map(issue => issue.toLowerCase()),
      ...(npc.inventory || []).map(item => item.toLowerCase())
    ];
  }

  static matchesQuery(npc: NPC, query: string): boolean {
    if (!query) return true;
    
    const searchText = this.getSearchableText(npc);
    const lowerQuery = query.toLowerCase();
    
    return searchText.some(text => text.includes(lowerQuery));
  }

  static filterByLocation(npcs: NPC[], inHaven: boolean): NPC[] {
    return npcs.filter(npc => Boolean(npc.isInHaven) === inHaven);
  }

  static filterByType(npcs: NPC[], isCompanion: boolean): NPC[] {
    return npcs.filter(npc => Boolean(npc.isCompanion) === isCompanion);
  }
}

export class NPCManagementService {
  static canBeMovedToHaven(npc: NPC): boolean {
    return npc.isAnimal !== true && !npc.isInHaven && npc.health > 0;
  }

  static canBeRemovedFromHaven(npc: NPC): boolean {
    return npc.isAnimal !== true && Boolean(npc.isInHaven);
  }

  static getHavenNPCs(npcs: NPC[]): NPC[] {
    return NPCSearchService.filterByLocation(npcs.filter(npc => !npc.isAnimal), true);
  }

  static getWildNPCs(npcs: NPC[]): NPC[] {
    return NPCSearchService.filterByLocation(npcs.filter(npc => !npc.isAnimal), false);
  }

  static getCompanions(npcs: NPC[]): NPC[] {
    return NPCSearchService.filterByType(npcs.filter(npc => !npc.isAnimal), true);
  }
}

export class NPCSkillService {
  static getSkillLevel(npc: NPC, skill: Skill): SkillExpertise {
    return npc.skillExpertise?.[skill] ?? SkillExpertise.None;
  }

  static hasSkillExpertise(npc: NPC, skill: Skill): boolean {
    const level = this.getSkillLevel(npc, skill);
    return level !== SkillExpertise.None;
  }

  static getExpertiseSkills(npc: NPC): Skill[] {
    if (!npc.skillExpertise) return [];
    
    return Object.entries(npc.skillExpertise)
      .filter(([_, level]) => level !== SkillExpertise.None)
      .map(([skill, _]) => skill as Skill);
  }

  static updateSkillExpertise(npc: NPC, skill: Skill, level: SkillExpertise): void {
    if (!npc.skillExpertise) {
      npc.skillExpertise = {} as Record<Skill, SkillExpertise>;
    }
    npc.skillExpertise[skill] = level;
  }
}

export class NPCValidationService {
  static isValidNPC(entity: any): entity is NPC {
    return (
      entity &&
      typeof entity.id === 'string' &&
      typeof entity.name === 'string' &&
      entity.isAnimal !== true &&
      typeof entity.health === 'number' &&
      typeof entity.maxHealth === 'number' &&
      typeof entity.skillExpertise === 'object'
    );
  }

  static validateSkillExpertise(npc: NPC): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!npc.skillExpertise) {
      errors.push('Missing skill expertise object');
      return { isValid: false, errors };
    }

    // Check if all required skills have valid expertise levels
    const validExpertiseLevels = Object.values(SkillExpertise);
    
    for (const [skill, level] of Object.entries(npc.skillExpertise)) {
      if (!Object.values(Skill).includes(skill as Skill)) {
        errors.push(`Invalid skill: ${skill}`);
      }
      
      if (!validExpertiseLevels.includes(level)) {
        errors.push(`Invalid expertise level for ${skill}: ${level}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
