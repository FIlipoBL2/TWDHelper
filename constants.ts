

import { GameState, Attribute, Skill, SkillDefinition, Character, Talent, NPC, SkillExpertise, InventoryItem, RangeCategory, CriticalInjury, Vehicle, SurvivalScenarioDefinition, Archetype, ArchetypeDefinition, BrawlActionType } from './types';
import { ROOM_FLAVOR_TABLE, RANDOM_LOCATIONS_TABLE, NPC_FEATURES_TABLE, NPC_ISSUES_TABLE, NPC_SECRET_ISSUES_TABLE, SCAVENGING_TABLE, WALKER_PAST_TABLE, WALKER_WOUNDS_TABLE, RANDOM_EVENTS_TABLE, THEME_ORACLE_TABLE, MESSING_UP_ORACLE_SOLO_TABLE, LOSING_TO_A_SWARM_SOLO_TABLE, RANDOM_SWARM_ATTACKS_SOLO_TABLE } from './data/tables';

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  { name: Skill.CloseCombat, attribute: Attribute.Strength },
  { name: Skill.Endure, attribute: Attribute.Strength },
  { name: Skill.Force, attribute: Attribute.Strength },
  { name: Skill.Mobility, attribute: Attribute.Agility },
  { name: Skill.RangedCombat, attribute: Attribute.Agility },
  { name: Skill.Stealth, attribute: Attribute.Agility },
  { name: Skill.Scout, attribute: Attribute.Wits },
  { name: Skill.Survival, attribute: Attribute.Wits },
  { name: Skill.Tech, attribute: Attribute.Wits },
  { name: Skill.Leadership, attribute: Attribute.Empathy },
  { name: Skill.Manipulation, attribute: Attribute.Empathy },
  { name: Skill.Medicine, attribute: Attribute.Empathy },
];

export const ALL_SKILLS = Object.values(Skill).filter(s => s !== Skill.ManualRoll);


export const SHATTERED_STATES: string[] = [
    "Talks to dead people",
    "Sees dead people",
    "Thinks the walkers are alive",
    "Protects one special walker",
    "Wants to die",
    "Emotionally shut off",
    "Involuntary rage",
    "Paranoid",
    "Obsessive-compulsive behavior"
];

export const ARCHETYPE_DEFINITIONS: ArchetypeDefinition[] = [
  { name: Archetype.Criminal, keyAttribute: Attribute.Strength, keySkill: Skill.CloseCombat, description: "You lived a life outside the law, taking what you needed." },
  { name: Archetype.Doctor, keyAttribute: Attribute.Empathy, keySkill: Skill.Medicine, description: "You swore an oath to heal, a promise harder than ever to keep." },
  { name: Archetype.Homemaker, keyAttribute: Attribute.Strength, keySkill: Skill.Endure, description: "You were the heart of a home, and you'll fight to make a new one." },
  { name: Archetype.Kid, keyAttribute: Attribute.Agility, keySkill: Skill.Mobility, description: "You grew up in this fallen world, knowing nothing else." },
  { name: Archetype.LawEnforcer, keyAttribute: Attribute.Wits, keySkill: Skill.Scout, description: "You upheld the law in a world that no longer exists." },
  { name: Archetype.Nobody, keyAttribute: Attribute.Agility, keySkill: Skill.Stealth, description: "You were invisible before, a skill that's now invaluable." },
  { name: Archetype.Farmer, keyAttribute: Attribute.Strength, keySkill: Skill.Force, description: "You worked the land, and you know what it takes to survive." },
  { name: Archetype.Outcast, keyAttribute: Attribute.Wits, keySkill: Skill.Survival, description: "You were always on the fringes, and you're comfortable there." },
  { name: Archetype.Politician, keyAttribute: Attribute.Empathy, keySkill: Skill.Manipulation, description: "You know how to lead people, for better or worse." },
  { name: Archetype.Preacher, keyAttribute: Attribute.Empathy, keySkill: Skill.Leadership, description: "You offer faith in a faithless world." },
  { name: Archetype.Scientist, keyAttribute: Attribute.Wits, keySkill: Skill.Tech, description: "You understand the 'how' and 'why' of a world gone mad." },
  { name: Archetype.Soldier, keyAttribute: Attribute.Agility, keySkill: Skill.RangedCombat, description: "You were trained for combat, but not for this." },
  { name: Archetype.Custom, keyAttribute: Attribute.Strength, keySkill: Skill.CloseCombat, description: "Create your own archetype from scratch. You choose the name and key attribute." },
];

export const TALENT_DEFINITIONS: Omit<Talent, 'id'>[] = [
    // THE CRIMINAL’S TALENTS
    { name: 'Threatening Posture', archetype: Archetype.Criminal, description: 'You can use Force instead of Manipulation when you threaten someone. You ruined someone’s life.' },
    { name: 'Fixer', archetype: Archetype.Criminal, description: 'You gain +2 to Manipulation when you haggle for a deal. You scored big on a negotiation.', bonus: 2, skillAffected: Skill.Manipulation },
    { name: 'Fights Dirty', archetype: Archetype.Criminal, description: 'When you fight unarmed, you do +1 damage. You killed someone with your bare hands.' }, // This is damage, not dice bonus
    // THE DOCTOR’S TALENTS
    { name: 'Emergency Medicine', archetype: Archetype.Doctor, description: 'Gain +2 to Medicine when you stabilize a critical injury that needs basic medical gear. You used to work in an Emergency Room.', bonus: 2, skillAffected: Skill.Medicine },
    { name: 'Doctor/Patient Hierarchy', archetype: Archetype.Doctor, description: 'When you use Manipulation against someone who is injured, you get a bonus equal to the number of Health Points they have taken in damage. You somehow used one of your patients for your own benefit.' }, // Conditional bonus
    { name: 'Seen It All', archetype: Archetype.Doctor, description: 'You do not take stress from seeing someone get wounded, tormented, or even Broken. You tried to save your injured friend.' },
    // THE HOMEMAKER’S TALENTS
    { name: 'Innocent Face', archetype: Archetype.Homemaker, description: 'You get +2 on Manipulation when you act innocent in front of a stranger. You made someone believe you were weak.', bonus: 2, skillAffected: Skill.Manipulation },
    { name: 'Back Against the Wall', archetype: Archetype.Homemaker, description: 'When you fight against all odds and the enemies seem to be winning, you do +1 damage on all attacks. You fought back.' }, // Damage bonus
    { name: 'Rather Die than Break', archetype: Archetype.Homemaker, description: 'Once per session, after rolling for a skill, you can choose to lose one point of Health to get one (extra) success on that skill roll. You need to be able to explain, in the game, how you are damaged in the situation. You sacrificed yourself for a higher purpose.' },
    // THE KID’S TALENTS
    { name: 'Knife Fighter', archetype: Archetype.Kid, description: 'You inflict +1 damage when you fight with a knife. You stabbed someone.' }, // Damage bonus
    { name: 'Stubborn', archetype: Archetype.Kid, description: 'Your Drive gives you a +2 bonus instead of +2. You didn’t give up.' }, // Drive bonus, special case
    { name: 'A Child of This World', archetype: Archetype.Kid, description: 'You do not take Stress when you see someone get bitten. Someone you loved was bitten.' },
    // THE LAW ENFORCER’S TALENTS
    { name: 'Steady Hands', archetype: Archetype.LawEnforcer, description: 'Once every session you may choose to not roll any stress dice on one skill roll. You kept it together despite extreme pressure.' },
    { name: 'Watchful', archetype: Archetype.LawEnforcer, description: 'You may use Scout to learn the dynamics in a group of people, and the opportunities and risks therein. You need to spend some time with them. In this way, you may learn of both regular Issues and secret Issues. You foresaw the danger.' },
    { name: 'Moral Compass', archetype: Archetype.LawEnforcer, description: 'When you put yourself in danger to stand up for what’s right, you relieve one point of stress. You did what you had to do.' },
    // THE NOBODY’S TALENTS
    { name: 'Speed Freak', archetype: Archetype.Nobody, description: 'Gain +2 when you use Mobility to drive a vehicle. You won a race.', bonus: 2, skillAffected: Skill.Mobility },
    { name: 'Wallflower', archetype: Archetype.Nobody, description: 'You do not have to choose a single NPC as your NPC Anchor. Instead, a whole group is your Anchor. You do not have to handle your fear if any of them die, so long as at least one of them is left standing. You were part of a group, without any of them really noticing you.' },
    { name: 'Gatherer', archetype: Archetype.Nobody, description: 'You get +2 to Stealth when you are on your own. You brought back food that kept others alive.', bonus: 2, skillAffected: Skill.Stealth },
    // THE FARMER’S TALENTS
    { name: 'Tracker', archetype: Archetype.Farmer, description: 'Gain +2 on Survival when you either track someone or try to hide your own tracks. You tracked someone or something.', bonus: 2, skillAffected: Skill.Survival },
    { name: 'Tough as Nails', archetype: Archetype.Farmer, description: 'Gain +2 to Endure when you starve or work hard. You had to push yourself beyond your own limits.', bonus: 2, skillAffected: Skill.Endure },
    { name: 'Living Off the Land', archetype: Archetype.Farmer, description: 'Gain +2 to Tech when you work on projects that increase Capacity for your haven. You made a living off the land.', bonus: 2, skillAffected: Skill.Tech },
    // THE OUTCAST’S TALENTS
    { name: 'Knows All the Tricks', archetype: Archetype.Outcast, description: 'You can use Stealth instead of Manipulation when you lie. You fooled someone who tried to dominate you.' },
    { name: 'Scavenger', archetype: Archetype.Outcast, description: 'When you scavenge and roll Survival, you get +2 rations for each extra success instead of +1. You survived on nothing.' },
    { name: 'Lone Wolf', archetype: Archetype.Outcast, description: 'You can have yourself as one of your two Anchors. You were betrayed by someone you trusted.' },
    // THE POLITICIAN’S TALENTS
    { name: 'Recruiter', archetype: Archetype.Politician, description: 'You can use Leadership instead of Manipulation when you speak for your cause. You won someone over to your side.' },
    { name: 'Mind Games', archetype: Archetype.Politician, description: 'You relieve one stress when you successfully Manipulate someone. You broke your opponent in a debate.' },
    { name: 'Right Word at the Right Time', archetype: Archetype.Politician, description: 'When you succeed with Leadership, you get an automatic extra success. You had them in the palm of your hand.' },
    // THE PREACHER’S TALENTS
    { name: 'Shepherd', archetype: Archetype.Preacher, description: 'Anyone can use you as an Anchor when they need to relieve stress, even if you are not their Anchor. You tended to your flock.' },
    { name: 'Guarded by a Higher Power', archetype: Archetype.Preacher, description: 'When you roll a random die to see if you are hit or bitten, you may reroll once. You were saved against all odds.' },
    { name: 'Preacher', archetype: Archetype.Preacher, description: 'Gain +2 to Leadership when trying to sway a group of people. They followed you.', bonus: 2, skillAffected: Skill.Leadership },
    // THE SCIENTIST’S TALENTS
    { name: 'Intuition', archetype: Archetype.Scientist, description: 'Once per game session, you can ask the GM about how things in the game world work and are related, to get some useful information or suggestions on how to proceed. You tackled an impossible Challenge.' },
    { name: 'Techno Babble', archetype: Archetype.Scientist, description: 'You can use Tech instead of Manipulation when you discuss complex matters. You used science to get what you wanted.' },
    { name: 'Handy', archetype: Archetype.Scientist, description: 'With a little time and some tools, you can repair most things – even if you don’t have the right parts. You also get +2 to Tech when you repair things as a project. Someone taught you to repair and build things.', bonus: 2, skillAffected: Skill.Tech },
    // THE SOLDIER’S TALENTS
    { name: 'Disillusioned', archetype: Archetype.Soldier, description: 'You do not take stress from seeing others commit brutal acts of violence, or when committing them yourself. You saw great suffering.' },
    { name: 'Eye on the Ball', archetype: Archetype.Soldier, description: 'Relieve one Stress every time a threat or an enemy is defeated or overcome. You did what had to be done.' },
    { name: 'Suppressive Fire', archetype: Archetype.Soldier, description: 'You can attack up to three enemies with the same attack when you use Ranged Combat, but they all take one less point of damage and you can’t add damage from extra successes. You were trained to be a soldier.' },
];


export const ARMOR_DEFINITIONS: Omit<InventoryItem, 'id'|'equipped'>[] = [
    { name: 'Soft Vest', type: 'Armor', slots: 1, armorLevel: 4, penalty: -1, description: 'Subtracts 1 from Mobility rolls.' },
    { name: 'Body Armor', type: 'Armor', slots: 2, armorLevel: 6, penalty: -2, description: 'Subtracts 2 from Mobility rolls.' },
    { name: 'Metal-plated Armor', type: 'Armor', slots: 3, armorLevel: 8, penalty: -3, description: 'Subtracts 3 from Mobility rolls.' },
];

export const GENERAL_GEAR_DEFINITIONS: Omit<InventoryItem, 'id'|'equipped'>[] = [
    { name: 'Advanced medical gear', slots: 1, bonus: 2, skillAffected: Skill.Medicine, type: 'Gear' },
    { name: 'Basic medical gear', slots: 1, bonus: 1, skillAffected: Skill.Medicine, type: 'Gear' },
    { name: 'Binoculars', slots: 0.5, bonus: 2, skillAffected: Skill.Scout, type: 'Gear' },
    { name: 'Book of maps', slots: 0.5, bonus: 1, skillAffected: Skill.Scout, type: 'Gear' },
    { name: 'Bottle of liquor', slots: 0.5, bonus: 2, skillAffected: Skill.Manipulation, type: 'Gear' },
    { name: 'Camera', slots: 0.5, type: 'Gear' },
    { name: 'Compass', slots: 0, bonus: 1, skillAffected: Skill.Survival, type: 'Gear' },
    { name: 'Crowbar (Tool)', description: 'Use for Force checks.', slots: 1, bonus: 2, skillAffected: Skill.Force, type: 'Gear' },
    { name: 'Dog', slots: 0, bonus: 2, skillAffected: Skill.CloseCombat, type: 'Gear', description: "A loyal companion." },
    { name: 'Field kitchen', slots: 1, type: 'Gear' },
    { name: 'Horse', slots: 0, type: 'Gear' },
    { name: 'Guitar', slots: 1, bonus: 1, skillAffected: Skill.Leadership, type: 'Gear' },
    { name: 'Lockpicks', slots: 0.5, bonus: 2, skillAffected: Skill.Stealth, type: 'Gear' },
    { name: 'Pack of gum/cigarettes', slots: 0.5, bonus: 1, skillAffected: Skill.Manipulation, type: 'Gear' },
    { name: 'Ration of food', slots: 0.5, type: 'Gear' },
    { name: 'Rope (10 meters)', slots: 1, bonus: 2, skillAffected: Skill.Mobility, type: 'Gear' },
    { name: 'Sleeping bag', slots: 1, bonus: 1, skillAffected: Skill.Survival, type: 'Gear' },
    { name: 'Tent', slots: 2, bonus: 2, skillAffected: Skill.Survival, type: 'Gear' },
    { name: 'Toolbox', slots: 1, bonus: 2, skillAffected: Skill.Tech, type: 'Gear' },
    { name: 'Walkie-talkie', slots: 0.5, bonus: 1, skillAffected: Skill.Leadership, type: 'Gear' },
];

export const CLOSE_COMBAT_WEAPONS_DEFINITIONS: Omit<InventoryItem, 'id'|'equipped'>[] = [
    { name: 'Foot or fist', type: 'Close', damage: 1, bonus: 0, slots: 0 },
    { name: 'Improvised weapon', type: 'Close', damage: 1, bonus: 1, slots: 1 },
    { name: 'Knuckle duster', type: 'Close', damage: 1, bonus: 1, slots: 0.5 },
    { name: 'Rifle butt', type: 'Close', damage: 1, bonus: 1, slots: 0 },
    { name: 'Knife', type: 'Close', damage: 1, bonus: 2, slots: 0.5 },
    { name: 'Small axe', type: 'Close', damage: 1, bonus: 2, slots: 1 },
    { name: 'Quarterstaff', type: 'Close', damage: 1, bonus: 3, slots: 1 },
    { name: 'Crowbar', type: 'Close', damage: 2, bonus: 1, slots: 1 },
    { name: 'Baseball bat', type: 'Close', damage: 2, bonus: 1, slots: 1 },
    { name: 'Spear', type: 'Close', damage: 2, bonus: 2, slots: 1 },
    { name: 'Sword', type: 'Close', damage: 2, bonus: 2, slots: 1 },
    { name: 'Big axe', type: 'Close', damage: 2, bonus: 2, slots: 2 },
    { name: 'Sledgehammer', type: 'Close', damage: 3, bonus: 0, slots: 2 },
    { name: 'Poisoned knife', type: 'Close', damage: 1, bonus: 2, slots: 0.5, poisonLevel: 4 },
    { name: 'Poisoned spear', type: 'Close', damage: 2, bonus: 2, slots: 1, poisonLevel: 4 },
    { name: 'Flaming sword', type: 'Close', damage: 2, bonus: 2, slots: 1, isIncendiary: true },
];

export const RANGED_WEAPONS_DEFINITIONS: Omit<InventoryItem, 'id'|'equipped'>[] = [
    { name: 'Throwing knife', type: 'Ranged', damage: 1, bonus: 1, range: RangeCategory.Short, slots: 0.5 },
    { name: 'Bow', type: 'Ranged', damage: 1, bonus: 2, range: RangeCategory.Long, slots: 1 },
    { name: 'Poisoned arrows', type: 'Ranged', damage: 1, bonus: 2, range: RangeCategory.Long, slots: 1, poisonLevel: 4 },
    { name: 'Crossbow', type: 'Ranged', damage: 2, bonus: 2, range: RangeCategory.Short, slots: 1 },
    { name: 'Pistol or revolver', type: 'Ranged', damage: 2, bonus: 2, range: RangeCategory.Short, slots: 1 },
    { name: 'Pipe Gun', type: 'Ranged', damage: 2, bonus: 1, range: RangeCategory.Short, slots: 1 },
    { name: 'Shotgun', type: 'Ranged', damage: 2, bonus: 3, range: RangeCategory.Short, slots: 1 },
    { name: 'Rifle', type: 'Ranged', damage: 2, bonus: 2, range: RangeCategory.Long, slots: 1 },
    { name: 'Sniper rifle', type: 'Ranged', damage: 2, bonus: 2, range: RangeCategory.Extreme, slots: 2 },
    { name: 'Submachine gun', type: 'Ranged', damage: 2, bonus: 3, range: RangeCategory.Short, slots: 1 },
    { name: 'Assault rifle', type: 'Ranged', damage: 2, bonus: 3, range: RangeCategory.Long, slots: 1 },
    { name: 'Heavy machine gun', type: 'Ranged', damage: 3, bonus: 3, range: RangeCategory.Extreme, slots: 3 },
    { name: 'Incendiary rounds', type: 'Ranged', damage: 2, bonus: 2, range: RangeCategory.Long, slots: 1, isIncendiary: true },
];

export const EXPLOSIVE_WEAPONS_DEFINITIONS: Omit<InventoryItem, 'id'|'equipped'>[] = [
    { name: 'Molotov cocktail', type: 'Explosive', blastPower: 6, bonus: 0, range: RangeCategory.Short, slots: 0.5, isIncendiary: true },
    { name: 'Hand grenade', type: 'Explosive', blastPower: 8, bonus: 1, range: RangeCategory.Short, slots: 0.5 },
    { name: 'Rocket launcher', type: 'Explosive', blastPower: 10, bonus: 2, range: RangeCategory.Long, slots: 2 },
    { name: 'Mortar', type: 'Explosive', blastPower: 12, bonus: 0, range: RangeCategory.Extreme, slots: 4 },
    { name: 'Howitzer', type: 'Explosive', blastPower: 14, bonus: 0, range: RangeCategory.Extreme, slots: 10 },
    { name: 'Tank cannon', type: 'Explosive', blastPower: 12, bonus: 3, range: RangeCategory.Extreme, slots: 10 },
    { name: 'Incendiary grenade', type: 'Explosive', blastPower: 6, bonus: 1, range: RangeCategory.Short, slots: 0.5, isIncendiary: true },
    { name: 'Poison gas grenade', type: 'Explosive', blastPower: 4, bonus: 1, range: RangeCategory.Short, slots: 0.5, poisonLevel: 6 },
];

export const VEHICLE_DEFINITIONS: Omit<Vehicle, 'id'>[] = [
    { name: 'Car', maneuverability: 2, damage: 2, hull: 4, armor: 4, issue: 'Will run out of gas' },
    { name: 'Bicycle', maneuverability: 2, damage: 0, hull: 2, armor: 0, issue: 'Easily gets a flat tire' },
    { name: 'Horse', maneuverability: 2, damage: 1, hull: 4, armor: 0, issue: 'Needs to be fed, easily scared' },
    { name: 'Motorcycle', maneuverability: 3, damage: 2, hull: 3, armor: 2, issue: 'Will run out of gas' },
    { name: 'Battle Tank', maneuverability: 1, damage: 4, hull: 10, armor: 8, issue: 'Will run out of gas, loud' },
];

export const RANGE_CATEGORIES = {
    [RangeCategory.Short]: { description: 'You can attack with Close Combat.' },
    [RangeCategory.Long]: { description: 'You need to use Ranged Combat to attack.' },
    [RangeCategory.Extreme]: { description: 'Only special weapons can be used.' },
};

export const MESSING_UP_IN_COMBAT_TABLE: { [key: number]: string } = {
    1: "Out of ammo/weapon breaks.",
    2: "Hurts oneself – accidentally falls, gets cut, or gets shot (1 damage).",
    3: "Friendly fire. Hits friend with weapon’s damage.",
    4: "Attracts walkers (raise Threat Level by 1, or suffer a single walker attack).",
    5: "The overall situation gets worse (house collapses, falls out a window, slips etc.).",
    6: "Bad positioning, opponent gets an extra success on the next roll.",
};

export const WALKER_ATTACK_TABLE: { [key: number]: string } = {
    11: "They come after you, but you got away. Take one point of stress.",
    12: "You manage to hold the walker off, but it drools all over your face. You start vomiting heavily. Take one stress point.",
    13: "They have you cornered, and you know it’s probably the end. But somehow you survive. Describe what happens. Take one stress point.",
    14: "You kill it, but you break or lose your weapon or something else important.",
    15: "You hold it down and crack its head with a stone. Take one stress point.",
    16: "It pulls the hair from your head as it tries to drag you close enough to bite. You punch it in the face until it dies. Take one point of damage.",
    21: "It headbutts you and throws you to the floor. But then you kill it. Take one point of damage.",
    22: "Its dead weight pushes into you as you kill it, so you hit the back of your head on the ground. Take one point of damage.",
    23: "As you fight it, you accidentally cut yourself on something sharp. Take one point of damage and take one more if you don’t succeed with a Medicine roll to stop the blood loss.",
    24: "You jump to get away from them. Make a Mobility roll. If you fail, you fall and take one point of damage.",
    25: "They get on top off you, but you manage to slay them and avoid being bitten. You must make a Force roll to push them off. If you fail, you black out for D6 minutes pinned down by the corpses.",
    26: "It chases after you. You get away, but you must make a Mobility roll to not stumble and fall. If you fail, you hit your head on something sharp and takes two points of damage.",
    31: "It grabs your head to bite you in the face. Make a Close Combat roll to keep it from headbutting you repeatedly in its attempts to take a bite. Take two points of damage if you fail.",
    32: "It bites at your clothes, at your hair, and even at your shoes. But you manage to elbow it in the face, several times, until the skull breaks. Your arm is in bad shape. Take two points of damage.",
    33: "Somehow you kill it and hit yourself at the same time. Take your own weapon’s damage.",
    34: "You fight it on the ground for what seems like forever, but finally you kill it. Take one point each of damage and stress.",
    35: "It tears off one of your ears and you bleed heavily. Take two points of damage.",
    36: "You’re stuck between two walkers, who are pulling you in opposite directions. You feel skin, muscles, and sinews in your arms and legs being stretched out and snapping. Take two points of damage and make an Endure roll not to pass out for D6 minutes.",
    41: "It repeatedly cuts and stabs you with a rusty, sharp object wedged through one of its hands. Take two points of damage.",
    42: "You lose your balance, and it forces you backwards. You bump into sharp objects; fall over and hit your head; stumble, severely twisting your ankles and wrists. Take two points of damage.",
    43: "It gets on top of you and your head is hammered against the ground before you can kill it. Take three points of damage.",
    44: "It breaks your arm while you wrestle it. Take three points of damage.",
    45: "It tears off your left kneecap with its teeth and starts chewing on it. You need to amputate the whole leg within {D6×10} minutes, or you die. Take three points of damage.",
    46: "You protect your face, but it bites you in both earlobes. Your only chance to survive is to cut the earlobes off within D6 hours. Take two points of damage.",
    51: "It is just a small scratch, but within days the infection will take root, and you will die. Your only chance is to carve off the infected meat within D6 hours. Take two points of damage.",
    52: "You get bitten on a toe. Your only chance to survive is to amputate the foot within D6 hours. Take two points of damage.",
    53: "One of your fingers gets bitten off and the infection from the bite spreads into your body. Your only chance to survive is to amputate the hand within D6 minutes. Take two points of damage.",
    54: "You are bitten in the stomach. The wound is not that deep, but soon you will get a fever, and within D6 days you will be dead.",
    55: "You are bitten in the throat. Blood everywhere. You die.",
    56: "They bite you several times in the back. Within D6 hours you are dead.",
    61: "You manage to fight them off, but somehow you are tagged in the head, either by your own weapon or friendly fire. You die cursing your bad luck.",
    62: "As you grapple with a walker, you failed to notice another walker on the ground reaching for your leg. It takes a huge bite out of your calf. You fall screaming as both walkers overwhelm you. You’ve lost a fatal amount of blood before you hit the ground.",
    63: "You defeat it, and everything is fine. But you failed to notice that one of them is still coming for you. It bites into your back and you die screaming.",
    64: "They surround you and push you to the ground. For several seconds, you manage to fight them, but then one of them presses its face against your stomach and starts tearing out your intestines with its teeth. You die screaming.",
    65: "A walker bites you in the face and eats one of your eyes and your nose. You try to fight it, but you soon bleed to death.",
    66: "You are overwhelmed by walkers that tear the flesh from your bones. You are dead.",
};

export const CRITICAL_INJURY_TABLE: { [key: number]: CriticalInjury } = {
    11: { name: "Winded", lethal: false, penalty: -1, recoveryTime: "D6 Hours" },
    12: { name: "Broken fingers", lethal: false, penalty: -1, recoveryTime: "D6 Hours" },
    13: { name: "Ruptured tendons", lethal: false, penalty: -1, recoveryTime: "D6 Hours" },
    14: { name: "Skin lesion", lethal: false, penalty: -1, recoveryTime: "D6 Hours" },
    15: { name: "Fracture", lethal: false, penalty: -1, recoveryTime: "D6 Hours" },
    16: { name: "Slashed shoulder", lethal: false, penalty: -1, recoveryTime: "D6 Hours" },
    21: { name: "Knee injury", lethal: false, penalty: -1, recoveryTime: "D6 Days" },
    22: { name: "Knocked out teeth", lethal: false, penalty: -1, recoveryTime: "D6 Days" },
    23: { name: "Ripped off ear", lethal: false, penalty: -1, recoveryTime: "D6 Days" },
    24: { name: "Broken nose", lethal: false, penalty: -1, recoveryTime: "D6 Days" },
    25: { name: "Broken ribs", lethal: false, penalty: -1, recoveryTime: "D6 Days" },
    26: { name: "Crushed foot", lethal: false, penalty: -2, recoveryTime: "D6 Days" },
    31: { name: "Damaged throat", lethal: true, timeLimit: 'Days', requires: 'B', penalty: -2, recoveryTime: "D6 Days" },
    32: { name: "Cut open leg", lethal: true, timeLimit: 'Days', requires: 'B', penalty: -2, recoveryTime: "D6 Days" },
    33: { name: "Deep flesh wound", lethal: true, timeLimit: 'Days', requires: 'B', penalty: -2, recoveryTime: "D6 Days" },
    34: { name: "Loose bone splinters", lethal: true, timeLimit: 'Days', requires: 'B', penalty: -2, recoveryTime: "D6 Days" },
    35: { name: "Cracked head", lethal: true, timeLimit: 'Days', requires: 'B', penalty: -2, recoveryTime: "D6 Weeks" },
    36: { name: "Punctured lung", lethal: true, timeLimit: 'Days', requires: 'B', penalty: -2, recoveryTime: "D6 Weeks" },
    41: { name: "Internal bleeding", lethal: true, timeLimit: 'Hours', requires: 'B', penalty: -2, recoveryTime: "D6 Days" },
    42: { name: "Severe internal bleeding", lethal: true, timeLimit: 'Hours', requires: 'B', penalty: -2, recoveryTime: "D6 Weeks" },
    43: { name: "Dirty wound", lethal: true, timeLimit: 'Days', requires: 'B', penalty: -2, recoveryTime: "D6 Days" },
    44: { name: "Crushed leg", lethal: true, timeLimit: 'Hours', requires: 'B', penalty: -3, recoveryTime: "D6 Weeks" },
    45: { name: "Crushed intestines", lethal: true, timeLimit: 'Hours', requires: 'B', penalty: -3, recoveryTime: "D6 Weeks" },
    46: { name: "Severe bleeding", lethal: true, timeLimit: 'Hours', requires: 'A', penalty: -3, recoveryTime: "D6 Weeks" },
    51: { name: "Destroyed eye", lethal: true, timeLimit: 'Days', requires: 'A', penalty: -3, recoveryTime: "D6 Weeks" },
    52: { name: "Ruptured bowel", lethal: true, timeLimit: 'Hours', requires: 'A', penalty: -3, recoveryTime: "D6 Weeks" },
    53: { name: "Shattered kidney", lethal: true, timeLimit: 'Days', requires: 'A', penalty: -3, recoveryTime: "D6 Weeks" },
    54: { name: "Stabbed in forehead", lethal: true, timeLimit: 'Days', requires: 'A', penalty: -4, recoveryTime: "D6 Weeks" },
    55: { name: "Spinal injury", lethal: true, timeLimit: 'Hours', requires: 'A', penalty: -4, recoveryTime: "D6 Months" },
    56: { name: "Coma", lethal: true, timeLimit: 'Days', requires: 'A', penalty: "Cannot act", recoveryTime: "D6 Months" },
    61: { name: "Severed limb", lethal: true, timeLimit: 'Hours', requires: 'A', penalty: -4, recoveryTime: "D6 Weeks" },
    62: { name: "Ruptured aorta", lethal: true, timeLimit: 'Minutes', requires: 'A', penalty: -5, recoveryTime: "D6 Weeks" },
    63: { name: "Crushed body", lethal: true, penalty: 'You die', recoveryTime: "-" },
    64: { name: "Disemboweled", lethal: true, penalty: 'You die', recoveryTime: "-" },
    65: { name: "Pierced head", lethal: true, penalty: 'You die', recoveryTime: "-" },
    66: { name: "Impaled heart", lethal: true, penalty: 'You die', recoveryTime: "-" },
};

export const THREAT_LEVELS = [
    { level: 0, situation: 'You are in a cleared area and safe. For now.' },
    { level: 1, situation: 'There are walkers around, but they have not noticed you.' },
    { level: 2, situation: 'There are walkers close by, but they are not aware of you. Yet.' },
    { level: 3, situation: 'The walkers are aware of you and will move towards you.' },
    { level: 4, situation: 'The walkers are closing in on you.' },
    { level: 5, situation: 'They are at arm’s length.' },
    { level: 6, situation: 'The dead are in your face, surrounding you.' }
];

export const SWARM_SIZES = [
    { size: 1, count: '5–10' },
    { size: 2, count: '11–20' },
    { size: 3, count: '21–50' },
    { size: 4, count: '51–100' },
    { size: 5, count: '100+' },
    { size: 6, count: '1000+' }
];

export const SWARM_COMBAT_TABLE: { [key: string]: { skills: Skill[], attacks: string[] } } = {
    '0': { skills: [], attacks: [] },
    '1': { skills: [], attacks: [] },
    '2': { skills: [Skill.RangedCombat, Skill.Stealth, Skill.CloseCombat, Skill.Mobility], attacks: [] },
    '3': { skills: [Skill.Endure, Skill.Force, Skill.Mobility, Skill.RangedCombat, Skill.Stealth], attacks: ['Single attack', 'Block'] },
    '4': { skills: [Skill.Force, Skill.Mobility, Skill.RangedCombat], attacks: ['Single attack', 'Block'] },
    '5': { skills: [Skill.Force, Skill.CloseCombat, Skill.RangedCombat], attacks: ['Single attack', 'Block'] },
    '6': { skills: [Skill.Force, Skill.CloseCombat], attacks: ['Mass attack'] },
};

export const BRAWL_PHASES = ['Taking Cover', 'Ranged Combat', 'Close Combat', 'Movement', 'First Aid', 'Other'];

export const BRAWL_ACTION_DEFINITIONS: { [key in BrawlActionType]: { name: string, phaseIndex: number, requiresTarget: boolean, skill?: Skill } } = {
    'TakeCover': { name: 'Take Cover', phaseIndex: 0, requiresTarget: false, skill: Skill.Mobility },
    'RangedAttack': { name: 'Ranged Attack', phaseIndex: 1, requiresTarget: true, skill: Skill.RangedCombat },
    'Overwatch': { name: 'Overwatch', phaseIndex: 1, requiresTarget: false, skill: Skill.RangedCombat },
    'CloseAttack': { name: 'Close Attack', phaseIndex: 2, requiresTarget: true, skill: Skill.CloseCombat },
    'Move': { name: 'Move', phaseIndex: 3, requiresTarget: false, skill: Skill.Mobility },
    'FirstAid': { name: 'First Aid', phaseIndex: 4, requiresTarget: true, skill: Skill.Medicine },
    'UseLeadership': { name: 'Use Leadership', phaseIndex: 5, requiresTarget: false, skill: Skill.Leadership },
    'Other': { name: 'Other Action', phaseIndex: 5, requiresTarget: false },
};

export const OVERWHELMED_TABLE: { [key: number]: string } = {
    1: 'You lose your Drive.',
    2: 'You lose your Drive.',
    3: 'You become Shattered.',
    4: 'You become Shattered.',
    5: 'You become Shattered.',
    6: 'Your Issue changes, or you gain another one.',
};

export const VEHICLE_CONDITION_TABLE: { [key: number]: { condition: string, fuel: string } } = {
    1: { condition: 'Broken and cannot be fixed', fuel: 'Empty' },
    2: { condition: 'Broken and in need of extensive repairs', fuel: 'Empty' },
    3: { condition: 'Broken and in need of repairs', fuel: 'Empty' },
    4: { condition: 'Functional but breaks down after driving D6 sectors if not repaired', fuel: 'Fumes' },
    5: { condition: 'Functional but breaks down after driving D6 days if not repaired', fuel: 'Half full' },
    6: { condition: 'Functional', fuel: 'Full tank' },
};

export const CRITICAL_VEHICLE_DAMAGE_TABLE: { [key: number]: string } = {
    1: "A random person in the vehicle gets hit and takes 3 points of damage.",
    2: "The driver gets hit and takes 2 points of damage.",
    3: "The gas tank is damaged, and fuel starts leaking.",
    4: "The windshield and several windows are busted.",
    5: "The driver loses control and the vehicle rams something. Roll on the Crash Objects table, but the Crash damage is dealt to the driver instead of the vehicle.",
    6: "The vehicle starts burning. Everyone inside is hit by Intensity 6 fire. Roll a die to determine how many minutes it takes before the vehicle explodes (Blast Power 8).",
};

export const CRASH_OBJECTS_TABLE: { [key: number]: { object: string, crashDice: number, durability: string } } = {
    1: { object: 'Soft material (haystack)', crashDice: 2, durability: '1' },
    2: { object: 'Fragile construction', crashDice: 3, durability: '2' },
    3: { object: 'Another car', crashDice: 4, durability: 'Vehicle’s hull' },
    4: { object: 'Wooden house', crashDice: 6, durability: '3' },
    5: { object: 'Brick wall', crashDice: 8, durability: '4' },
    6: { object: 'Enhanced concrete wall', crashDice: 10, durability: '5' },
};

export const ITEM_QUALITY_TABLE: { [key: number]: string } = {
    1: 'Broken/useless',
    2: 'Bad',
    3: 'Bad',
    4: 'Bad',
    5: 'Okay',
    6: 'Okay and roll again; if another 6, the item is of extremely good quality',
};

// --- BATTLEMAP ---
export const GRID_WIDTH = 30;
export const GRID_HEIGHT = 20;
export const CELL_SIZE = 40; // in pixels
export const RANGE_THRESHOLDS = {
    [RangeCategory.Short]: 6 * CELL_SIZE, // ~24 meters
    [RangeCategory.Long]: 25 * CELL_SIZE, // 100 meters
    [RangeCategory.Extreme]: Infinity
};


// --- CHARACTER CREATION ---
export const ATTRIBUTE_CREATION_POINTS = 13;
export const SKILL_CREATION_POINTS = 12;
export const SOLO_SKILL_CREATION_POINTS = 14;
export const MAX_SKILL_AT_CREATION = 2;
export const MAX_KEY_SKILL_AT_CREATION = 3;
export const XP_COST_FOR_TALENT = 10;
export const MAX_ATTRIBUTE_AT_CREATION = 4;
export const MAX_KEY_ATTRIBUTE_AT_CREATION = 5;
export const MIN_ATTRIBUTE_AT_CREATION = 2;

export const DEFAULT_PC_TEMPLATE: Omit<Character, 'id'> = {
    playerName: 'New Player',
    name: 'New Survivor',
    archetype: Archetype.Nobody,
    keyAttribute: Attribute.Agility,
    drive: '',
    issue: '',
    pcAnchorDescription: '',
    npcAnchorDescription: '',
    attributes: { [Attribute.Strength]: 2, [Attribute.Agility]: 2, [Attribute.Wits]: 2, [Attribute.Empathy]: 2 },
    skills: Object.fromEntries(Object.values(Skill).map(skill => [skill, 0])) as Record<Skill, number>,
    health: 3,
    maxHealth: 3,
    stress: 0,
    maxStress: 5,
    xp: 0,
    inventory: [],
    vehicles: [],
    talents: [],
    activeTalentIds: [],
    isShattered: undefined,
    criticalInjuries: [],
    creationComplete: false,
    tokenImage: '',
};

const emptySkillExpertise = () => Object.fromEntries(Object.values(Skill).map(skill => [skill, SkillExpertise.None])) as Record<Skill, SkillExpertise>;

export const NPC_SURVIVOR_GROUPS: Omit<NPC, 'id' | 'health' | 'maxHealth'>[][] = [
    // Group 1
    [
        { name: 'Anthony Brooks', archetype: 'Teacher', issues: ['Stubborn', 'sleeps with Abigail'], inventory: ['Car', 'revolver', 'map with a safe house marked out'], skillExpertise: { ...emptySkillExpertise(), [Skill.Survival]: SkillExpertise.Trained, [Skill.Tech]: SkillExpertise.Trained } },
        { name: 'Melissa Anderson', archetype: 'Screenplay writer', issues: ['Easily scared', 'looks to others for protection'], inventory: ['Kitchen knife', 'big flashlight', 'taser'], skillExpertise: { ...emptySkillExpertise(), [Skill.Manipulation]: SkillExpertise.Trained } },
        { name: 'Robert Young', archetype: 'Kid', issues: ['Thinks he can take care of himself', 'asthmatic'], inventory: [], skillExpertise: { ...emptySkillExpertise(), [Skill.Stealth]: SkillExpertise.Trained, [Skill.Mobility]: SkillExpertise.Trained } },
        { name: 'Bobby Miller', archetype: 'Boxer and thief', issues: ['Wants to be top dog', 'secretly in love with Melissa'], inventory: ['Hammer', 'Vespa'], skillExpertise: { ...emptySkillExpertise(), [Skill.CloseCombat]: SkillExpertise.Expert, [Skill.Mobility]: SkillExpertise.Trained } },
        { name: 'Abigail Miller', archetype: 'Farmer', issues: ['Will protect her son Bobby at any cost', 'sleeps with Anthony', 'broken foot that healed badly'], inventory: ['Shotgun', 'pitchfork', 'seeds that can be planted'], skillExpertise: { ...emptySkillExpertise(), [Skill.Tech]: SkillExpertise.Trained, [Skill.Endure]: SkillExpertise.Trained } },
    ],
    // Group 2
    [
        { name: 'George Lee', archetype: 'Plumber', issues: ['Only one eye'], inventory: ['Axe', 'tent', 'survival gear', 'canned food'], skillExpertise: { ...emptySkillExpertise(), [Skill.Scout]: SkillExpertise.Trained, [Skill.Tech]: SkillExpertise.Trained } },
        { name: 'Kayla Clark', archetype: 'Dancer', issues: ['Easily insulted', 'wants to know what is happening'], inventory: ['Spear', 'bicycle', 'American football helmet'], skillExpertise: { ...emptySkillExpertise(), [Skill.CloseCombat]: SkillExpertise.Trained, [Skill.Mobility]: SkillExpertise.Trained } },
        { name: 'Doris Young', archetype: 'Elderly', issues: ['Sick and frail', 'keeps to the old morals and laws'], inventory: ['Wheelchair', 'bottle of schnapps'], skillExpertise: { ...emptySkillExpertise(), [Skill.Tech]: SkillExpertise.Expert, [Skill.Leadership]: SkillExpertise.Trained } },
        { name: 'Elijah Flores', archetype: 'Politician', issues: ['Has a way with words', 'visionary', 'dislikes Doris Young'], inventory: ['Dog named Rosa', 'small revolver'], skillExpertise: { ...emptySkillExpertise(), [Skill.Manipulation]: SkillExpertise.Trained } },
        { name: 'Amber King', archetype: 'Soldier', issues: ['Protects Elijah Flores and believes every word he says'], inventory: ['Assault rifle', 'three hand grenades', 'bayonet', 'camouflage gear', 'survival equipment', 'good maps', 'compass', 'wind up radio'], skillExpertise: { ...emptySkillExpertise(), [Skill.RangedCombat]: SkillExpertise.Trained, [Skill.CloseCombat]: SkillExpertise.Trained } },
    ],
    // Group 3
    [
        { name: 'Betty “Anvil” Hall', archetype: 'Teen punk rocker', issues: ['Won’t talk about what happened to her'], inventory: ['Knife'], skillExpertise: { ...emptySkillExpertise(), [Skill.Survival]: SkillExpertise.Trained, [Skill.Stealth]: SkillExpertise.Trained } },
        { name: 'Daniel Perez', archetype: 'Stockbroker', issues: ['Exaggerates his own ability', 'wants to keep the group together'], inventory: ['Pistol'], skillExpertise: { ...emptySkillExpertise(), [Skill.Leadership]: SkillExpertise.Trained, [Skill.Manipulation]: SkillExpertise.Trained } },
        { name: 'Nicole Perez', archetype: 'Immigrant/domestic worker', issues: ['Trusts no one'], inventory: ['Pistol', 'basic medical supplies'], skillExpertise: { ...emptySkillExpertise(), [Skill.Medicine]: SkillExpertise.Trained, [Skill.Scout]: SkillExpertise.Trained } },
        { name: 'Samuel Carter', archetype: 'Construction worker', issues: ['Looks out for his daughter Denise', 'will follow the strongest leader'], inventory: ['Hammer', 'rifle'], skillExpertise: { ...emptySkillExpertise(), [Skill.CloseCombat]: SkillExpertise.Expert, [Skill.Endure]: SkillExpertise.Trained } },
        { name: 'Denise Carter', archetype: 'Kid', issues: ['Traumatized', 'emotionally sensitive and empathetic'], inventory: ['Hidden revolver'], skillExpertise: { ...emptySkillExpertise(), [Skill.Stealth]: SkillExpertise.Trained } },
    ],
    // Group 4
    [
        { name: 'Raymond Green', archetype: 'Doctor', issues: ['Depressed', 'mourns his family'], inventory: ['Advanced medical gear'], skillExpertise: { ...emptySkillExpertise(), [Skill.Medicine]: SkillExpertise.Expert, [Skill.Manipulation]: SkillExpertise.Trained } },
        { name: 'Emma Wilson', archetype: 'Athlete', issues: ['Injured', 'God-fearing'], inventory: ['Bow and arrows', 'tent'], skillExpertise: { ...emptySkillExpertise(), [Skill.Endure]: SkillExpertise.Trained, [Skill.Mobility]: SkillExpertise.Trained } },
        { name: 'Ryan Smith', archetype: 'Senior citizen', issues: ['Taciturn', 'plans for the worst'], inventory: ['Mobile home', 'toolkit', 'rifle'], skillExpertise: { ...emptySkillExpertise(), [Skill.Tech]: SkillExpertise.Trained, [Skill.Survival]: SkillExpertise.Trained } },
        { name: 'Sharon Smith', archetype: 'Senior citizen', issues: ['Careless', 'wants everyone to feel good', 'loud'], inventory: ['Revolver', '3 liquor bottles'], skillExpertise: { ...emptySkillExpertise(), [Skill.RangedCombat]: SkillExpertise.Trained } },
        { name: 'Anna Jones', archetype: 'Spiritualistic medium', issues: ['Believes she will save mankind', 'dissociates'], inventory: ['Bludgeon', 'holy symbols', 'dream catchers', 'incense', 'magic mushrooms'], skillExpertise: { ...emptySkillExpertise(), [Skill.Medicine]: SkillExpertise.Trained, [Skill.Manipulation]: SkillExpertise.Trained } },
    ],
    // Group 5
    [
        { name: 'Nicolas White', archetype: 'Criminal', issues: ['Only respects strength', 'loves to tease and harass others'], inventory: ['Machete', 'revolver'], skillExpertise: { ...emptySkillExpertise(), [Skill.CloseCombat]: SkillExpertise.Trained, [Skill.RangedCombat]: SkillExpertise.Trained } },
        { name: 'Amy Hall', archetype: 'Soldier', issues: ['Rules with an iron fist', 'macho'], inventory: ['Assault rifle', 'explosive paste', 'pistol', 'knife', 'night-googles'], skillExpertise: { ...emptySkillExpertise(), [Skill.RangedCombat]: SkillExpertise.Expert, [Skill.Force]: SkillExpertise.Trained } },
        { name: 'Ronald Green', archetype: 'Engineer', issues: ['Tries to not get in anyone’s way', 'dependent on others for protection', 'a poet'], inventory: ['Toolkit', 'hand wired radio'], skillExpertise: { ...emptySkillExpertise(), [Skill.Tech]: SkillExpertise.Trained, [Skill.Scout]: SkillExpertise.Trained } },
        { name: 'Ki Wilson', archetype: 'Nurse', issues: ['Will do whatever it takes'], inventory: ['Basic medical gear'], skillExpertise: { ...emptySkillExpertise(), [Skill.Medicine]: SkillExpertise.Trained, [Skill.Manipulation]: SkillExpertise.Trained } },
        { name: 'Demián Vergara', archetype: 'Drifter', issues: ['Searches for something to believe in', 'does not take shit from anyone'], inventory: ['Revolver', 'screwdriver'], skillExpertise: { ...emptySkillExpertise(), [Skill.Survival]: SkillExpertise.Trained } },
    ],
    // Group 6
    [
        { name: 'Gael Barraza', archetype: 'Psychotherapist', issues: ['Eager to make hard decisions', 'empathically exhausted'], inventory: ['Rifle', 'a pair of sharp scissors', 'several packs of cigarettes'], skillExpertise: { ...emptySkillExpertise(), [Skill.Leadership]: SkillExpertise.Expert, [Skill.Manipulation]: SkillExpertise.Trained } },
        { name: 'Angela Flores', archetype: 'Medical student', issues: ['Does not share her pains and concerns', 'takes care of her baby'], inventory: ['Basic medical gear'], skillExpertise: { ...emptySkillExpertise(), [Skill.Medicine]: SkillExpertise.Trained, [Skill.Tech]: SkillExpertise.Trained, [Skill.Manipulation]: SkillExpertise.Trained } },
        { name: 'Jacob Flores', archetype: 'Baby', issues: ['Unwanted baby to a young mother', 'screams when scared, hungry, tired, or sick'], inventory: [], skillExpertise: { ...emptySkillExpertise() } },
        { name: 'Jason Lee', archetype: 'Farmer', issues: ['Thinks he is responsible for the others', 'wants to keep everyone happy'], inventory: ['Sniper rifle', 'big knife', 'guitar', 'hidden stash of marshmallows'], skillExpertise: { ...emptySkillExpertise(), [Skill.Survival]: SkillExpertise.Trained, [Skill.Endure]: SkillExpertise.Trained } },
        { name: 'Barbara Ferrara', archetype: 'Runaway teen', issues: ['Secretly in love with Angela Flores', 'wants to protect the others from the harsh realities in the world', 'likes to take risks'], inventory: ['Big axe', 'stiletto', 'revolver', 'motorbike'], skillExpertise: { ...emptySkillExpertise(), [Skill.CloseCombat]: SkillExpertise.Trained, [Skill.Stealth]: SkillExpertise.Trained } },
    ]
];

// --- SURVIVAL SCENARIOS ---
const GOLDEN_AMBULANCE_SCENARIO: SurvivalScenarioDefinition = {
    name: "The Golden Ambulance",
    description: "Your group is sick. The only hope is to find medicine in an ambulance atop a parking garage. But it's a trap, and another group is already there.",
    startingLog: [{
        characterId: 'SYSTEM',
        characterName: 'System',
        content: `---
The air is cold. A constant, low moan echoes from the streets below.
Your group, weakened by sickness, stands at the base of the Alford Spring parking garage.
The mission is simple: get to the ambulance on the roof, get the medicine, and get out.
---`,
        type: 'SCENARIO_INTRO',
    }],
    threat: { level: 1, swarmSize: 1 },
    characters: [
      { ...DEFAULT_PC_TEMPLATE, creationComplete: true, id: 'ga-pc1', name: 'Fionna Ruiz', archetype: Archetype.Outcast, keyAttribute: Attribute.Wits, drive: 'To protect Kalani', issue: 'Overly protective of Kalani Clark', attributes: { [Attribute.Strength]: 3, [Attribute.Agility]: 3, [Attribute.Wits]: 3, [Attribute.Empathy]: 3 }, skills: { ...DEFAULT_PC_TEMPLATE.skills, [Skill.CloseCombat]: 2, [Skill.Survival]: 2, [Skill.Stealth]: 1, }, talents: [{ ...(TALENT_DEFINITIONS.find(t => t.name === 'Lone Wolf') as Talent), id: 'ga-t-fr1' }], inventory: [{ id: 'ga-i1', name: 'Baseball bat', type: 'Close', damage: 2, bonus: 1, slots: 1, equipped: true }] },
      { ...DEFAULT_PC_TEMPLATE, creationComplete: true, id: 'ga-pc2', name: 'Jaxson Price', archetype: Archetype.Criminal, keyAttribute: Attribute.Strength, drive: 'To get what I deserve', issue: 'Can\'t resist a good score', attributes: { [Attribute.Strength]: 4, [Attribute.Agility]: 3, [Attribute.Wits]: 2, [Attribute.Empathy]: 3 }, skills: { ...DEFAULT_PC_TEMPLATE.skills, [Skill.Force]: 2, [Skill.Manipulation]: 2, [Skill.Stealth]: 1, }, talents: [{ ...(TALENT_DEFINITIONS.find(t => t.name === 'Fixer') as Talent), id: 'ga-t-jp1' }], inventory: [{ id: 'ga-i2', name: 'Pistol', type: 'Ranged', damage: 2, bonus: 2, range: RangeCategory.Short, slots: 1, equipped: true }] },
      { ...DEFAULT_PC_TEMPLATE, creationComplete: true, id: 'ga-pc3', name: 'Kalani Clark', archetype: Archetype.Kid, keyAttribute: Attribute.Agility, drive: 'To find my parents', issue: 'Terrified of being alone', attributes: { [Attribute.Strength]: 2, [Attribute.Agility]: 4, [Attribute.Wits]: 3, [Attribute.Empathy]: 3 }, skills: { ...DEFAULT_PC_TEMPLATE.skills, [Skill.Mobility]: 2, [Skill.Stealth]: 2, [Skill.Scout]: 1, }, talents: [{ ...(TALENT_DEFINITIONS.find(t => t.name === 'A Child of This World') as Talent), id: 'ga-t-kc1' }], inventory: [{ id: 'ga-i3', name: 'Small knife', type: 'Close', damage: 1, bonus: 2, slots: 0.5, equipped: true }] },
      { ...DEFAULT_PC_TEMPLATE, creationComplete: true, id: 'ga-pc4', name: 'Luka Woods', archetype: Archetype.Soldier, keyAttribute: Attribute.Agility, drive: 'To complete the mission', issue: 'Follows orders without question', attributes: { [Attribute.Strength]: 3, [Attribute.Agility]: 3, [Attribute.Wits]: 3, [Attribute.Empathy]: 3 }, skills: { ...DEFAULT_PC_TEMPLATE.skills, [Skill.RangedCombat]: 2, [Skill.Endure]: 2, [Skill.Force]: 1, }, talents: [{ ...(TALENT_DEFINITIONS.find(t => t.name === 'Suppressive Fire') as Talent), id: 'ga-t-lw1' }], inventory: [{ id: 'ga-i4', name: 'Assault Rifle', type: 'Ranged', damage: 2, bonus: 3, range: RangeCategory.Long, slots: 1, equipped: true }] },
      { ...DEFAULT_PC_TEMPLATE, creationComplete: true, id: 'ga-pc5', name: 'Grace Hoffman', archetype: Archetype.Doctor, keyAttribute: Attribute.Empathy, drive: 'To save as many as I can', issue: 'Takes unnecessary risks for patients', attributes: { [Attribute.Strength]: 2, [Attribute.Agility]: 3, [Attribute.Wits]: 4, [Attribute.Empathy]: 3 }, skills: { ...DEFAULT_PC_TEMPLATE.skills, [Skill.Medicine]: 2, [Skill.Tech]: 2, [Skill.Scout]: 1, }, talents: [{ ...(TALENT_DEFINITIONS.find(t => t.name === 'Emergency Medicine') as Talent), id: 'ga-t-gh1' }], inventory: [{ id: 'ga-i5', name: 'Scalpel', type: 'Close', damage: 1, bonus: 0, slots: 0, equipped: true }, { id: 'ga-i6', name: 'Basic medical gear', type: 'Gear', bonus: 1, skillAffected: Skill.Medicine, slots: 1, equipped: true }] },
    ],
    npcs: [],
};

export const SURVIVAL_SCENARIOS = {
    'The Golden Ambulance': GOLDEN_AMBULANCE_SCENARIO,
};

export const INITIAL_GAME_STATE: GameState = {
  gameMode: 'Unset',
  characters: [],
  npcs: [],
  session: {
    clocks: [],
  },
  haven: {
    name: 'The Haven',
    capacity: 2,
    defense: 1,
    issues: ['Leaky roof in the main hall'],
    projects: [{id: 'p1', name: 'Reinforce the east wall', current: 2, max: 6}],
  },
  chatLog: [],
  combat: {
    isActive: false,
    type: 'Duel',
    combatants: [],
    round: 1,
    currentTurnIndex: 0,
    currentPhaseIndex: 0,
    turnOrder: [],
    swarmSize: undefined,
    pendingSwarmConsequence: false,
    swarmRoundResult: null,
    duelRange: RangeCategory.Short,
    grid: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      cover: [],
    },
    backgroundImage: null,
    floatingText: [],
    animations: [],
    gridObjects: [],
    rulerMeasurements: [],
  },
  brawl: {
    isActive: false,
    currentRound: 1,
    currentPhaseIndex: 0,
    participants: [],
    battlemapObjects: [],
    backgroundImageUrl: undefined,
    aiPrompt: undefined,
  },
  threat: {
    level: 0,
    swarmSize: 1,
  },
  customArchetypes: [],
  customTalents: [],
  customItems: [],
  factions: [],
};

export const ALL_TABLES: { [key: string]: any } = {
    'Random Event': RANDOM_EVENTS_TABLE,
    'Critical Injury': CRITICAL_INJURY_TABLE,
    'Overwhelmed': OVERWHELMED_TABLE,
    'Messing up in Combat': MESSING_UP_IN_COMBAT_TABLE,
    'Walker Attack': WALKER_ATTACK_TABLE,
    'Vehicle Condition': VEHICLE_CONDITION_TABLE,
    'Crash Objects': CRASH_OBJECTS_TABLE,
    'Critical Vehicle Damage': CRITICAL_VEHICLE_DAMAGE_TABLE,
    'Item Quality': ITEM_QUALITY_TABLE,
    'Walker Past': WALKER_PAST_TABLE,
    'Walker Wounds': WALKER_WOUNDS_TABLE,
    'Room Flavor': ROOM_FLAVOR_TABLE,
    'Random Location': RANDOM_LOCATIONS_TABLE,
    'NPC Feature': NPC_FEATURES_TABLE,
    'NPC Issue': NPC_ISSUES_TABLE,
    'NPC Secret Issue': NPC_SECRET_ISSUES_TABLE,
    'Scavenging': SCAVENGING_TABLE,
    'Theme Oracle (Solo)': THEME_ORACLE_TABLE,
    'Messing Up (Solo)': MESSING_UP_ORACLE_SOLO_TABLE,
    'Swarm Loss (Solo)': LOSING_TO_A_SWARM_SOLO_TABLE,
    'Swarm Attack (Solo)': RANDOM_SWARM_ATTACKS_SOLO_TABLE,
};
