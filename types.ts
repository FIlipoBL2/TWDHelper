

export enum Attribute {
  Strength = 'Strength',
  Agility = 'Agility',
  Wits = 'Wits',
  Empathy = 'Empathy',
}

export enum Archetype {
    Criminal = 'Criminal',
    Doctor = 'Doctor',
    Homemaker = 'Homemaker',
    Kid = 'Kid',
    LawEnforcer = 'Law Enforcer',
    Nobody = 'Nobody',
    Farmer = 'Farmer',
    Outcast = 'Outcast',
    Politician = 'Politician',
    Preacher = 'Preacher',
    Scientist = 'Scientist',
    Soldier = 'Soldier',
    Custom = 'Custom',
}

export interface ArchetypeDefinition {
  name: Archetype | string;
  keyAttribute: Attribute;
  keySkill: Skill;
  description: string;
}

export enum Skill {
  CloseCombat = 'Close Combat',
  Endure = 'Endure',
  Force = 'Force',
  Mobility = 'Mobility',
  RangedCombat = 'Ranged Combat',
  Stealth = 'Stealth',
  Scout = 'Scout',
  Survival = 'Survival',
  Tech = 'Tech',
  Leadership = 'Leadership',
  Manipulation = 'Manipulation',
  Medicine = 'Medicine',
  ManualRoll = 'Manual Roll',
}

export enum SkillExpertise {
  None = 'None',
  Trained = 'Trained',
  Expert = 'Expert',
  Master = 'Master',
}

export interface SkillDefinition {
  name: Skill;
  attribute: Attribute;
}

export interface CharacterSkill {
  name: Skill;
  rank: number;
}

export interface InventoryItem {
  id: string;
  name:string;
  bonus?: number;
  skillAffected?: Skill;
  damage?: number;
  slots: number;
  type?: 'Close' | 'Ranged' | 'Gear' | 'Armor' | 'Explosive';
  equipped: boolean;
  description?: string; // For item details
  armorLevel?: number;
  penalty?: number;
  range?: RangeCategory;
  blastPower?: number;
  broken?: boolean;
  // Additional weapon properties
  poisonLevel?: number; // Toxicity rating for poisoned weapons
  isIncendiary?: boolean; // Sets target on fire
}

export interface Vehicle {
  id: string;
  name: string;
  maneuverability: number;
  damage: number;
  hull: number;
  armor: number;
  issue: string;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
  archetype?: Archetype | string;
  bonus?: number;
  skillAffected?: Skill;
  prerequisiteNote?: string;
}

export interface CriticalInjury {
  name: string;
  penalty: number | string;
  recoveryTime: string; // e.g., "Hours", "Days", "Weeks"
  lethal: boolean;
  timeLimit?: 'Minutes' | 'Hours' | 'Days'; // for lethal injuries
  requires?: 'B' | 'A'; // Basic or Advanced gear
}


export interface Character {
  id:string;
  playerName?: string;
  name: string;
  archetype: Archetype | string;
  customArchetypeName?: string;
  keyAttribute: Attribute;
  keySkill?: Skill;
  drive: string;
  issue: string;
  pcAnchorId?: string;
  pcAnchorDescription?: string;
  npcAnchorId?: string;
  npcAnchorDescription?: string;
  attributes: Record<Attribute, number>;
  skills: Record<Skill, number>;
  health: number;
  maxHealth: number;
  stress: number;
  maxStress: number;
  xp: number;
  inventory: InventoryItem[];
  vehicles: Vehicle[];
  talents: Talent[];
  activeTalentIds: string[];
  isShattered: string | undefined;
  criticalInjuries: CriticalInjury[];
  creationComplete?: boolean;
  // Additional combat statuses
  isPoisoned?: boolean;
  poisonLevel?: number;
  isOnFire?: boolean;
  blastImmunity?: boolean;
  tokenImage?: string; // base64 encoded image
}

export interface NPC {
    id: string;
    name: string;
    archetype: string; // Background
    health: number;
    maxHealth: number;
    issues: string[];
    inventory: string[];
    skillExpertise: Record<Skill, SkillExpertise>;
    isCompanion?: boolean;
    isInHaven?: boolean;
    tokenImage?: string;
    // Animal combat stats (for animals only)
    isAnimal?: boolean;
    attackDice?: number;
    damage?: string; // Can be "1", "2", "1 (+poison)", etc.
}

export interface HavenProject {
  id: string;
  name: string;
  current: number;
  max: number;
}

export interface Haven {
  name: string;
  capacity: number;
  defense: number;
  issues: string[];
  projects: HavenProject[];
}

export type ClockType = 'Session' | 'Rumor' | 'Faction' | 'Endgame';

export interface Clock {
  id: string;
  name: string;
  current: number;
  max: number;
  type?: ClockType;
}

export interface SessionState {
  clocks: Clock[];
}

export interface DiceRollResult {
  baseDice: number[];
  stressDice: number[];
  helpDice?: number[]; // Help dice (positive) or hurt dice (negative count)
  helpDiceCount?: number; // Track original help/hurt dice count for display
  successes: number;
  pushed: boolean;
  messedUp: boolean;
  skill: Skill | 'Handle Fear' | 'Armor' | 'Mobility';
  baseDicePool: number;
  stressDicePool: number;
}

export type ChatMessageType = 'OOC' | 'IC' | 'ROLL' | 'SYSTEM' | 'SCENARIO_INTRO' | 'COMBAT_SETUP';

export interface TableRollResult {
  tableName: string;
  roll: string; // The text representation of the roll, e.g., "34" or "3"
  dice?: number[]; // The individual dice values, e.g., [3, 4] for a d66
  resultText: string;
}

export interface CombatSetupParticipant {
  id: string;
  type: 'PC' | 'NPC';
}

export interface CombatSetupPayload {
  sideA: CombatSetupParticipant[]; // List of participant IDs
  sideB: CombatSetupParticipant[]; // List of participant IDs
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  characterId: string; // 'GM', 'SYSTEM', PC id or NPC id
  characterName: string;
  characterTokenImage?: string;
  content: string;
  type: ChatMessageType;
  rollResult?: DiceRollResult;
  tableRollResult?: TableRollResult;
  diceResult?: { dice: number[]; total?: number; type: string };
  canBePushed?: boolean;
  combatSetupPayload?: CombatSetupPayload;
  ruleCard?: any; // RuleDefinition from data/rules.ts
}

export enum RangeCategory {
  Short = 'Short',
  Long = 'Long',
  Extreme = 'Extreme',
}

export type BrawlActionType = 'TakeCover' | 'RangedAttack' | 'CloseAttack' | 'Move' | 'FirstAid' | 'Other' | 'UseLeadership' | 'Overwatch';

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  position: { x: number, y: number };
}

export interface AttackAnimation {
    id: string;
    type: 'ranged' | 'melee';
    startPos: { x: number, y: number };
    endPos: { x: number, y: number };
}

export interface GridObject {
  id: string;
  type: 'car' | 'barrel' | 'crate' | 'text' | 'circle' | 'rectangle' | 'line' | 'emoji';
  position: { x: number; y: number };
  emoji?: string; // Custom emoji for the object
  size?: number; // Size multiplier (default 1.0)
  width?: number; // For shapes
  height?: number; // For shapes
  text?: string; // For text objects
  color?: string; // Color for shapes and text
  strokeWidth?: number; // For lines and shape borders
  rotation?: number; // Rotation angle in degrees
  endPosition?: { x: number; y: number }; // For lines
}

export interface BattlemapTool {
  type: 'select' | 'text' | 'circle' | 'rectangle' | 'line' | 'emoji' | 'ruler';
  name: string;
  icon: string;
  cursor: string;
}

export interface RulerMeasurement {
  id: string;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  distance: number;
  temporary?: boolean;
}

export interface Combatant {
  id: string; // PC or NPC id
  type: 'PC' | 'NPC';
  name: string;
  tokenImage?: string;
  targetId?: string;
  hasActed: boolean;
  health: number; // Snapshot of health for combat
  armorLevel: number;
  armorPenalty: number;
  selectedSwarmSkill?: Skill;
  leadershipBonus?: number;
  plannedAction: { type: BrawlActionType, targetId?: string } | null;
  position: { x: number; y: number };
  isTakingCover: boolean;
  isOnOverwatch: boolean;
  range: RangeCategory;
}

export type CombatType = 'Duel' | 'Brawl' | 'Swarm';


export interface SwarmRoundResult {
    successes: number;
    needed: number;
    isWin: boolean;
    almost: boolean;
}

export interface CombatState {
  isActive: boolean;
  type: CombatType;
  combatants: Combatant[];
  round: number;
  currentTurnIndex: number; // Used for Duels
  currentPhaseIndex: number; // Used for Brawls
  turnOrder: string[]; // Array of combatant IDs in turn order
  swarmSize?: number; // For Swarm
  pendingSwarmConsequence: boolean;
  swarmRoundResult: SwarmRoundResult | null;
  duelRange?: RangeCategory; // Shared range for duel combat
  grid: {
    width: number;
    height: number;
    cover: { x: number; y: number }[];
  };
  backgroundImage: string | null;
  floatingText: FloatingText[];
  animations: AttackAnimation[];
  gridObjects: GridObject[];
  rulerMeasurements: RulerMeasurement[];
  lastProcessedPhase?: string; // Track last processed phase to prevent duplicates
}

export interface ThreatState {
  level: number;
  swarmSize: number;
}

export type GameMode = 'Campaign' | 'Survival' | 'Solo' | 'Unset';

export interface FactionKeyNpc {
    name: string;
    role: string;
    expert_skills: string[];
    trained_skills: string[];
    issues: string[];
}

export interface FactionHaven {
    name: string;
    description: string;
    capacity?: number;
    defense?: number;
    issues?: string[];
}

export interface Faction {
  id: string;
  name: string;
  description?: string;
  size: number | string;
  type: string;
  leadership: string;
  assets: string;
  needs: string;
  issues: string[];
  haven?: FactionHaven;
  key_npcs?: FactionKeyNpc[];
  endgame_example?: string;
}


export interface GameState {
  gameMode: GameMode;
  scenarioName?: string;
  characters: Character[];
  npcs: NPC[];
  session: SessionState;
  haven: Haven;
  chatLog: ChatMessage[];
  combat: CombatState;
  brawl: BrawlState;
  threat: ThreatState;
  customArchetypes: ArchetypeDefinition[];
  customTalents: Omit<Talent, 'id'>[];
  customItems: Omit<InventoryItem, 'id' | 'equipped'>[];
  factions: Faction[];
}

export interface GameStateContextType {
  gameState: GameState;
  isEditMode: boolean;
  toggleEditMode: () => void;
  setGameMode: (mode: GameMode) => void;
  resetGame: () => void;
  loadSurvivalScenario: (scenarioName: string) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  updateNpc: (npcId: string, updates: Partial<NPC>) => void;
  updateHaven: (updates: Partial<Haven>) => void;
  getPlayerCharacter: (characterId: string) => Character | undefined;
  getNpc: (npcId: string) => NPC | undefined;
  getSkillAttribute: (skill: Skill) => Attribute | undefined;
  toggleItemEquipped: (characterId: string, itemId: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  rollOnTable: (tableName: string) => TableRollResult | null;
  pushRoll: (messageId: string) => void;

  generateStartingNpcs: () => void;
  addCustomNpc: (npc: NPC) => void;
  addNpcToHaven: (npcId: string) => void;
  removeNpcFromHaven: (npcId: string) => void;
  generateRandomNpc: () => void;
  generateRandomAnimal: () => void;
  removeNpc: (npcId: string, npcName: string) => void;
  designateCompanion: (npcId: string) => void;
  upgradeNpcToPc: (npcId: string) => void;
  
  // Clock management
  addClock: (name: string, max: number, type?: ClockType) => void;
  updateClock: (clockId: string, updates: Partial<Clock>) => void;
  removeClock: (clockId: string) => void;
  advanceSessionClocks: () => void;

  // PC management
  addCharacter: () => string;
  addRandomCharacter: () => string;
  removeCharacter: (characterId: string, characterName: string) => void;
  toggleActiveTalent: (characterId: string, talentId: string) => void;
  purchaseTalent: (characterId: string, talentData: Omit<Talent, 'id'>) => boolean;
  purchaseSkillPoint: (characterId: string, skill: Skill) => boolean;
  finalizeCharacterCreation: (characterId: string) => void;
  rollAndAddCriticalInjury: (characterId: string) => void;
  removeCriticalInjury: (characterId: string, injuryIndex: number) => void;

  // Granular PC update functions for edit mode
  addInventoryItem: (characterId: string, itemTemplate?: Omit<InventoryItem, 'id'|'equipped'>) => void;
  updateInventoryItem: (characterId: string, itemId: string, updates: Partial<InventoryItem>) => void;
  removeInventoryItem: (characterId: string, itemId: string) => void;
  addTalent: (characterId: string, talentData: Omit<Talent, 'id'>) => void;
  updateTalent: (characterId: string, talentId: string, updates: Partial<Talent>) => void;
  removeTalent: (characterId: string, talentId: string) => void;
  addVehicle: (characterId: string, vehicleTemplate?: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (characterId: string, vehicleId: string, updates: Partial<Vehicle>) => void;
  removeVehicle: (characterId: string, vehicleId: string) => void;

  // Haven management
  addHavenProject: () => void;
  updateHavenProject: (projectId: string, updates: Partial<HavenProject>) => void;
  removeHavenProject: (projectId: string) => void;
  addHavenIssue: (issue: string) => void;
  removeHavenIssue: (issueIndex: number) => void;

  // Combat management
  initiateCombatSetup: () => void;
  updateCombatSetup: (messageId: string, updates: Partial<CombatSetupPayload>) => void;
  finalizeCombatSetup: (messageId: string, type: CombatType) => void;
  endCombat: () => void;
  updateCombatant: (combatantId: string, updates: Partial<Combatant>) => void;
  nextTurn: () => void;
  resolveOpposedAttack: (attackerId: string, defenderId: string, isBrawl?: boolean) => void;
  resolveSwarmRound: () => void;
  applySwarmConsequence: (consequence?: 'Increase Threat' | 'Increase Swarm Size' | 'Swarm Attack') => void;
  setCombatantAction: (combatantId: string, action: BrawlActionType | null, targetId?: string) => void;
  resolveNextBrawlPhase: () => void;
  setTurnOrder: (order: string[]) => void;
  moveCombatant: (combatantId: string, newPosition: { x: number; y: number }) => void;
  toggleCover: (position: { x: number; y: number }) => void;
  generateAndSetBattlemap: (prompt: string) => void;
  addGridObject: (type: GridObject['type'], position: { x: number; y: number }, options?: {
    emoji?: string;
    text?: string;
    color?: string;
    width?: number;
    height?: number;
    endPosition?: { x: number; y: number };
    size?: number;
  }) => void;
  updateGridObject: (objectId: string, updates: Partial<GridObject>) => void;
  moveGridObject: (objectId: string, newPosition: { x: number; y: number }) => void;
  removeGridObject: (objectId: string) => void;
  addRulerMeasurement: (startPos: { x: number; y: number }, endPos: { x: number; y: number }) => void;
  removeRulerMeasurement: (rulerId: string) => void;
  clearAllRulers: () => void;
  setDuelRange: (range: RangeCategory) => void;

  // Brawl management
  initiateBrawl: () => void;
  endBrawl: () => void;
  addBrawlParticipant: (participant: Omit<BrawlParticipant, 'id'>) => void;
  updateBrawlParticipant: (participantId: string, updates: Partial<BrawlParticipant>) => void;
  removeBrawlParticipant: (participantId: string) => void;
  setBrawlParticipantAction: (participantId: string, action: BrawlActionType, targetId?: string) => void;
  nextBrawlPhase: () => void;
  nextBrawlRound: () => void;
  addBattlemapObject: (object: Omit<BattlemapObject, 'id'>) => void;
  updateBattlemapObject: (objectId: string, updates: Partial<BattlemapObject>) => void;
  removeBattlemapObject: (objectId: string) => void;
  generateBrawlBackground: (prompt: AIBackgroundPrompt) => Promise<void>;

  // Threat Management
  updateThreat: (updates: Partial<ThreatState>) => void;
  
  // AI Oracle
  askOracle: (question: string) => Promise<string>;
  generateScene: () => Promise<string>;

  // Custom Data Management
  addCustomArchetype: (archetype: ArchetypeDefinition) => void;
  updateCustomArchetype: (index: number, updates: Partial<ArchetypeDefinition>) => void;
  removeCustomArchetype: (index: number) => void;
  addCustomTalent: (talent: Omit<Talent, 'id'>) => void;
  updateCustomTalent: (index: number, updates: Partial<Omit<Talent, 'id'>>) => void;
  removeCustomTalent: (index: number) => void;
  addCustomItem: (item: Omit<InventoryItem, 'id'|'equipped'>) => void;
  updateCustomItem: (index: number, updates: Partial<Omit<InventoryItem, 'id'|'equipped'>>) => void;
  removeCustomItem: (index: number) => void;
  
  // Faction Management
  addFaction: (faction: Omit<Faction, 'id'>) => void;
  updateFaction: (factionId: string, updates: Partial<Faction>) => void;
  removeFaction: (factionId: string) => void;


  // Session Management
  saveSession: () => void;
  loadSession: (saveFileContent: string) => boolean;
}

export interface SurvivalScenarioDefinition {
  name: string;
  description: string;
  characters: Character[];
  npcs: NPC[];
  haven?: Haven;
  threat?: ThreatState;
  startingLog?: Omit<ChatMessage, 'id' | 'timestamp'>[];
}

// Brawl System Types
export interface BrawlParticipant {
  id: string;
  name: string;
  token?: string;
  position: { x: number; y: number };
  initiative: number;
  isPlayer: boolean;
  isActive: boolean;
  currentAction?: BrawlActionType;
  targetId?: string;
}

export interface BattlemapObject {
  id: string;
  type: 'cover' | 'obstacle' | 'decoration' | 'custom';
  position: { x: number; y: number };
  size: { width: number; height: number };
  name: string;
  icon?: string;
  color?: string;
}

export interface AIBackgroundPrompt {
  scene: string;
  environment: string;
  mood: string;
  timeOfDay: string;
  weather: string;
  customDetails: string;
}

export interface BrawlState {
  isActive: boolean;
  currentRound: number;
  currentPhaseIndex: number;
  participants: BrawlParticipant[];
  battlemapObjects: BattlemapObject[];
  backgroundImageUrl?: string;
  aiPrompt?: AIBackgroundPrompt;
}