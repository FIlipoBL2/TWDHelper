// TWD RPG Brawl Phases Data
import { BrawlPhase } from '../types/brawl';

export const BRAWL_PHASES: BrawlPhase[] = [
  {
    id: 1,
    name: "Taking Cover",
    description: "Characters attempt to find cover. Requires a Mobility roll. Success provides immediate cover (+1 success needed to hit with ranged attacks). Failure means cover is reached at end of round.",
    actions: [
      "Roll Mobility to take cover",
      "If successful, gain cover immediately",
      "If failed, reach cover at end of round",
      "Cover provides +1 success needed for ranged attacks"
    ]
  },
  {
    id: 2,
    name: "Ranged Combat",
    description: "Attacks with ranged weapons and explosives. NPCs declare targets first, then PCs. Simultaneous shooting becomes opposed rolls.",
    actions: [
      "NPCs declare ranged attacks first",
      "PCs declare ranged attacks",
      "Resolve opposed rolls for simultaneous combat",
      "Apply damage and status effects"
    ]
  },
  {
    id: 3,
    name: "Close Combat",
    description: "Hand-to-hand fighting and melee weapons. Only possible within Short range. Cover does not apply to close combat.",
    actions: [
      "Declare close combat targets (Short range only)",
      "Resolve opposed Close Combat rolls", 
      "Apply damage from successful attacks",
      "Cover bonuses do not apply"
    ]
  },
  {
    id: 4,
    name: "Movement",
    description: "Move one distance category closer or further. Requires Mobility roll. Chases become opposed Mobility rolls.",
    actions: [
      "Declare movement intentions",
      "Roll Mobility for movement",
      "Resolve opposed rolls for chases",
      "Update positions and ranges"
    ]
  },
  {
    id: 5,
    name: "First Aid",
    description: "Provide medical assistance to Broken characters within Short range. Cannot provide first aid to oneself.",
    actions: [
      "Target Broken character within Short range",
      "Roll Medicine skill",
      "Success: Character regains 1 HP, no longer Broken but critically injured",
      "Cannot provide first aid to yourself"
    ]
  },
  {
    id: 6,
    name: "Other Actions",
    description: "Catch-all phase for actions not covered by other phases. GM determines if skill rolls are required.",
    actions: [
      "Barricade doors or windows",
      "Hotwire vehicles",
      "Set off explosives", 
      "Operate radios or electronics",
      "Any other non-combat actions"
    ]
  }
];

export const BRAWL_GENERAL_RULES = {
  leadership: {
    description: "A PC not making main skill rolls can 'bark orders' and roll Leadership. Each success grants +1 bonus dice (max +3 to any single ally) for their skill rolls this round.",
    limitation: "Only one PC can roll Leadership per round"
  },
  messUp: {
    description: "Rolling a 'walker' (1 on stress die) during combat means messing up.",
    consequences: [
      "Make noise and attract walkers (raise Threat Level by 1)",
      "Single walker attack",
      "Run out of ammunition", 
      "Friendly fire incident",
      "Hurt yourself",
      "Give opponent positional advantage"
    ]
  },
  quickActions: {
    description: "Simple activities can be done alongside main actions",
    examples: ["Shouting", "Drawing a knife", "Pressing a button"]
  }
};
