/**
 * TWD RPG Rules Database - Complete Rebuild
 * Contains rule definitions for tooltips, autolinking, and /rule command
 */

export interface RuleDefinition {
  id: string;
  name: string;
  category: 'general' | 'rules' | 'combat' | 'characters' | 'gear' | 'locations' | 'factions' | 'npcs' | 'management' | 'solo';
  description: string;
  details?: string;
  keywords: string[]; // Alternative names/aliases
  examples?: string[];
  citations?: string;
}

// Comprehensive Rules Database - Direct Implementation
export const RULES_DATABASE: RuleDefinition[] = [
  // General Concepts
  {
    id: "general-1",
    name: "The Walking Dead Universe Roleplaying Game",
    category: "general",
    description: "The official roleplaying game where players struggle to survive in a hostile world. It deals with dark and existential themes, is violent and distressing, and raises issues of personal morals. The rules are based on the acclaimed Year Zero Engine, allowing groups to tailor the experience to their interests and play style.",
    keywords: ["walking", "dead", "universe", "roleplaying", "game", "rpg", "twd"],
    citations: "Pages 1-3"
  },
  {
    id: "general-2", 
    name: "The Walking Dead Universe",
    category: "general",
    description: "The fictional setting where the game takes place, shared with the AMC Networks television series, where the dead have come back as flesh-eating walkers and society has collapsed. The game can be set at any point in this timeline.",
    keywords: ["universe", "setting", "world", "timeline", "amc"],
    citations: "Pages 4-8"
  },
  {
    id: "general-3",
    name: "Walkers",
    category: "general", 
    description: "Flesh-eating undead, also referred to as the dead, who were once human. They are single-mindedly focused on feeding, do not require food, water, sleep, or breathing, and can only be killed by destroying their brains. They are everywhere and can form swarms.",
    keywords: ["walkers", "undead", "dead", "zombies", "brain", "swarms"],
    citations: "Pages 8-15, 42-45"
  },
  {
    id: "general-4",
    name: "The Outbreak",
    category: "general",
    description: "The moment when the dead started to come back. Everyone remembers it and carries a dormant virus that causes them to reanimate upon death.",
    keywords: ["outbreak", "virus", "reanimate", "death"],
    citations: "Pages 16-17"
  },
  {
    id: "general-5",
    name: "Herd",
    category: "general",
    description: "A TV series term for large groups of walkers (game's Swarm Size 4 to 6) that move in a random direction and kill everything in their way.",
    keywords: ["herd", "swarm", "group", "walkers"],
    citations: "Pages 18-19"
  },
  {
    id: "general-6",
    name: "Horde",
    category: "general", 
    description: "A TV series term for cataclysmic numbers of walkers, even greater than herds, which may exist in the game in specific, non-random scenarios (e.g., survival mode scenarios where the swarm is integral to the plot).",
    keywords: ["horde", "massive", "swarm", "cataclysmic"],
    citations: "Pages 18-19"
  },
  {
    id: "general-7",
    name: "The Living",
    category: "general",
    description: "Human survivors in the world who are still alive, as opposed to walkers. They include both Player Characters and Non-Player Characters.",
    keywords: ["living", "survivors", "humans", "alive"],
    citations: "Page 12"
  },
  {
    id: "general-8",
    name: "The Haven",
    category: "general",
    description: "A safe place where Player Characters can rest, store supplies, and plan their next moves. Havens have Capacity and Defense ratings that determine how many people they can house and how well they can withstand attacks.",
    keywords: ["haven", "safe", "base", "home", "shelter"],
    citations: "Pages 20-27"
  },
  {
    id: "general-9",
    name: "GM Map",
    category: "general",
    description: "The Game Master's secret version of the area map, where they can mark out places and groups still unknown to the players.",
    keywords: ["gm", "map", "secret", "master"],
    citations: "Pages 28-29"
  },

  // Rules and Mechanics
  {
    id: "rules-1",
    name: "Game Master",
    category: "rules",
    description: "The person who describes the world, manages Non-Player Characters, and makes decisions for what happens outside the Player Characters' control.",
    keywords: ["game", "master", "gm", "narrator"],
    citations: "Pages 4, 28, 30-34"
  },
  {
    id: "rules-2",
    name: "Player Character",
    category: "rules",
    description: "A character created and controlled by one of the players. PCs are the central figures of the story, making choices that shape their destiny.",
    keywords: ["player", "character", "pc", "hero", "protagonist"],
    citations: "Pages 4, 6, 30, 32, 35-38"
  },
  {
    id: "rules-3",
    name: "Non-Player Character",
    category: "rules", 
    description: "All other characters in the game world that are controlled by the GM. They can be allies or antagonists, and are described with Issues and basic stats.",
    keywords: ["non-player", "character", "npc", "ally", "enemy"],
    citations: "Pages 4, 30, 37, 39-41"
  },
  {
    id: "rules-4",
    name: "Skill Roll",
    category: "rules",
    description: "To attempt a difficult action, a player rolls a number of six-sided dice equal to their PC's relevant attribute score plus skill level. A roll of 6 on any die counts as a 'success.' Most tasks require only one success.",
    keywords: ["skill", "roll", "dice", "attribute", "success"],
    citations: "Pages 51-55"
  },
  {
    id: "rules-5",
    name: "Stress Die",
    category: "rules",
    description: "For each point of stress a PC has, a stress die is added to all skill rolls. Stress dice are typically a different color. A roll of 1 on a stress die (often marked with a walker symbol) indicates 'messing up.'",
    keywords: ["stress", "die", "dice", "walker", "symbol"],
    citations: "Pages 51, 56-58"
  },
  {
    id: "rules-6",
    name: "Messing Up",
    category: "rules",
    description: "Occurs when a 1 is rolled on a stress die during a skill roll, signifying a mistake due to the stressful situation. Typically, this alerts walkers (raising Threat Level or causing a single attack), but can also mean running out of ammo, self-harm, friendly fire, or other negative consequences determined by the GM.",
    keywords: ["messing", "up", "mistake", "consequence", "threat"],
    citations: "Pages 51, 56-67"
  },
  {
    id: "rules-7",
    name: "Pushing the Roll",
    category: "rules",
    description: "After failing an initial skill roll, a player can choose to try again by re-rolling all non-success dice. This action immediately incurs one stress point and adds a stress die to the re-roll. A roll can only be pushed once.",
    keywords: ["pushing", "push", "roll", "reroll", "stress"],
    citations: "Pages 51, 53, 56, 68-69"
  },
  {
    id: "rules-8",
    name: "Stress",
    category: "rules",
    description: "A mental state accumulated from frightening/dangerous situations or from pushing skill rolls. Stress adds stress dice to all skill rolls but increases the risk of 'messing up'.",
    keywords: ["stress", "mental", "state", "fear", "danger", "push"],
    citations: "Pages 33, 43, 50, 114-115"
  },
  {
    id: "rules-9",
    name: "Lucky Die",
    category: "rules",
    description: "A special die that can be awarded by the GM for good roleplaying, clever solutions, or heroic actions. When rolling a Lucky Die, any result of 6 counts as a success, and you don't suffer consequences from rolling a 1. Lucky dice are not stress dice.",
    keywords: ["lucky", "die", "dice", "bonus", "reward", "gm", "special"],
    citations: "Pages 70-71"
  },
  {
    id: "rules-10",
    name: "Bonus Dice",
    category: "rules",
    description: "Additional dice granted for favorable circumstances, good equipment, or assistance from others. Bonus dice work like regular base dice - 6s count as successes and don't cause stress when rolling 1s.",
    keywords: ["bonus", "dice", "die", "favorable", "equipment", "assistance", "help"],
    citations: "Pages 68-69"
  },
  {
    id: "rules-11",
    name: "Help Dice",
    category: "rules",
    description: "When another character assists you, they can grant you Help Dice equal to their relevant attribute. Help dice count as bonus dice - they give successes on 6s but don't add stress on 1s.",
    keywords: ["help", "dice", "die", "assist", "assistance", "cooperate", "teamwork"],
    citations: "Pages 72-73"
  },

  // Combat Rules
  {
    id: "combat-1",
    name: "Duels",
    category: "combat",
    description: "A type of combat scenario for conflicts involving just two or a few fighters, resolved primarily through opposed skill rolls.",
    keywords: ["duels", "combat", "opposed", "one-on-one"],
    citations: "Pages 75, 96-97"
  },
  {
    id: "combat-2",
    name: "Brawls",
    category: "combat",
    description: "A combat scenario designed for intense and complicated fights involving multiple individuals. Brawls are structured into rounds and phases, with each participant receiving one action per round.",
    keywords: ["brawls", "combat", "multiple", "rounds", "phases"],
    citations: "Pages 76, 79, 96, 98-99"
  },
  {
    id: "combat-3",
    name: "Range",
    category: "combat",
    description: "The abstract scale used to measure distance between combatants: Short (less than 25m, for close combat or revolvers), Long (25-100m, for ranged combat), and Extreme (beyond 100m, for special weapons).",
    keywords: ["range", "distance", "short", "long", "extreme"],
    citations: "Pages 75, 100-101"
  },
  {
    id: "combat-4",
    name: "Cover",
    category: "combat",
    description: "Being behind solid protection in combat. Ranged attacks against a character in cover require an additional success to hit. Cover does not apply in close combat.",
    keywords: ["cover", "protection", "shield", "barrier"],
    citations: "Pages 60, 102"
  },
  {
    id: "combat-5",
    name: "Health Points",
    category: "combat",
    description: "All living Player Characters and Non-Player Characters have three Health Points. Losing all HP results in the character becoming 'Broken'.",
    keywords: ["health", "points", "hp", "damage", "broken"],
    citations: "Pages 109, 114-115"
  },
  {
    id: "combat-6",
    name: "Broken",
    category: "combat",
    description: "A character who has lost all three Health Points. A Broken character is incapacitated, cannot perform meaningful actions, immediately takes one stress, and must roll on the critical injuries table. Further damage to a Broken character results in death.",
    keywords: ["broken", "incapacitated", "death", "critical", "injuries"],
    citations: "Pages 110, 112, 116"
  }
];

// Search function for rules - returns array of rules for multiple results
export const searchRules = (query: string, limit?: number): RuleDefinition[] => {
  console.log('🔍 Searching for:', query);
  const normalizedQuery = query.toLowerCase().trim();
  const results: RuleDefinition[] = [];
  
  // First try exact name match
  const exactMatch = RULES_DATABASE.find(rule => 
    rule.name.toLowerCase() === normalizedQuery
  );
  if (exactMatch) {
    console.log('✅ Found exact match:', exactMatch.name);
    results.push(exactMatch);
  }
  
  // Then try keyword match (if not already found)
  if (results.length === 0) {
    const keywordMatches = RULES_DATABASE.filter(rule => 
      rule.keywords.some(keyword => keyword.toLowerCase() === normalizedQuery)
    );
    console.log('🎯 Found keyword matches:', keywordMatches.length);
    keywordMatches.forEach(match => console.log('  -', match.name));
    results.push(...keywordMatches);
  }
  
  // Finally try partial match (if not already found)
  if (results.length === 0) {
    const partialMatches = RULES_DATABASE.filter(rule => 
      rule.name.toLowerCase().includes(normalizedQuery) ||
      rule.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery))
    );
    console.log('🔎 Found partial matches:', partialMatches.length);
    partialMatches.forEach(match => console.log('  -', match.name));
    results.push(...partialMatches);
  }
  
  console.log('📊 Total results:', results.length);
  results.forEach(r => console.log('📖 Result:', r.name, '- Description:', r.description.substring(0, 50) + '...'));
  
  // Apply limit if specified
  return limit ? results.slice(0, limit) : results;
};

// Search function for single rule (for backwards compatibility)
export const searchRule = (query: string): RuleDefinition | null => {
  const results = searchRules(query, 1);
  return results.length > 0 ? results[0] : null;
};

// Get rule suggestions for autocomplete
export const getRuleSuggestions = (query: string, limit: number = 10): string[] => {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return getAllRuleNames().slice(0, limit);
  }
  
  const suggestions = RULES_DATABASE
    .filter(rule => 
      rule.name.toLowerCase().includes(normalizedQuery) ||
      rule.keywords.some(keyword => keyword.includes(normalizedQuery))
    )
    .map(rule => rule.name)
    .sort()
    .slice(0, limit);
    
  return suggestions;
};

// Get all rule names for autocomplete
export const getAllRuleNames = (): string[] => {
  return RULES_DATABASE.map(rule => rule.name).sort();
};

// Create keyword map for fast lookup
export const RULES_BY_KEYWORD = new Map<string, RuleDefinition[]>();

// Populate keyword map
RULES_DATABASE.forEach(rule => {
  // Add exact name
  const exactName = rule.name.toLowerCase();
  if (!RULES_BY_KEYWORD.has(exactName)) {
    RULES_BY_KEYWORD.set(exactName, []);
  }
  RULES_BY_KEYWORD.get(exactName)!.push(rule);
  
  // Add all keywords
  rule.keywords.forEach(keyword => {
    const normalizedKeyword = keyword.toLowerCase();
    if (!RULES_BY_KEYWORD.has(normalizedKeyword)) {
      RULES_BY_KEYWORD.set(normalizedKeyword, []);
    }
    RULES_BY_KEYWORD.get(normalizedKeyword)!.push(rule);
  });
});
