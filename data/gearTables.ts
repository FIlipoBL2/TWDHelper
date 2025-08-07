// TWD RPG Gear and Equipment Data
export interface GearItem {
  name: string;
  slots: string | number;
  bonus?: string | number;
  damage?: number;
  range?: string;
  armorLevel?: number;
  penalty?: string;
  type: 'General' | 'CloseCombat' | 'Ranged' | 'Armor';
  description?: string;
}

export interface WeaponItem extends Omit<GearItem, 'bonus'> {
  damage: number;
  bonus: number;
  type: 'CloseCombat' | 'Ranged';
}

export interface ArmorItem extends GearItem {
  armorLevel: number;
  penalty: string;
  type: 'Armor';
}

// General Gear Table
export const GENERAL_GEAR: GearItem[] = [
  { name: "Advanced medical gear", slots: "Varies", bonus: "Medicine +2", type: "General" },
  { name: "Basic medical gear", slots: 1, bonus: "Medicine +1", type: "General" },
  { name: "Binoculars", slots: 0.5, bonus: "Scout +2", type: "General" },
  { name: "Book of maps", slots: 0.5, bonus: "Scout +1", type: "General" },
  { name: "Bottle of liquor", slots: 0.5, bonus: "Manipulate +2", type: "General" },
  { name: "Camera", slots: 0.5, type: "General" },
  { name: "Compass", slots: 0, bonus: "Survival +2", type: "General" },
  { name: "Crowbar", slots: 1, bonus: "Force +2", type: "General", description: "Can also be used as weapon (2 damage, +1 bonus)" },
  { name: "Dog", slots: 0, bonus: "Close Combat +2", type: "General" },
  { name: "Field kitchen", slots: 1, type: "General" },
  { name: "Horse", slots: 0, type: "General" },
  { name: "Guitar", slots: 1, bonus: "Leadership +1", type: "General" },
  { name: "Lockpicks", slots: 0, bonus: "Stealth +2", type: "General" },
  { name: "Pack of gum/cigarettes", slots: 0, bonus: "Manipulate +1", type: "General" },
  { name: "Ration of food", slots: 0.5, type: "General" },
  { name: "Rope (10 meters)", slots: 1, bonus: "Mobility +2", type: "General" },
  { name: "Sleeping bag", slots: 1, bonus: "Survival +1", type: "General" },
  { name: "Tent", slots: 2, bonus: "Survival +2", type: "General" },
  { name: "Toolbox", slots: 1, bonus: "Tech +2", type: "General" },
  { name: "Walkie-talkies", slots: 0.5, bonus: "Leadership +1", type: "General" }
];

// Close Combat Weapons Table
export const CLOSE_COMBAT_WEAPONS: WeaponItem[] = [
  { name: "Foot or fist", damage: 1, bonus: 0, slots: 0, type: "CloseCombat", description: "Unarmed combat - always available" },
  { name: "Improvised weapon", damage: 1, bonus: 1, slots: 0.5, type: "CloseCombat" },
  { name: "Knuckle duster", damage: 1, bonus: 1, slots: 0.5, type: "CloseCombat" },
  { name: "Rifle butt", damage: 1, bonus: 1, slots: 1, type: "CloseCombat" },
  { name: "Knife", damage: 1, bonus: 2, slots: 0.5, type: "CloseCombat" },
  { name: "Small axe", damage: 1, bonus: 2, slots: 0.5, type: "CloseCombat" },
  { name: "Quarterstaff", damage: 1, bonus: 3, slots: 1, type: "CloseCombat" },
  { name: "Crowbar", damage: 2, bonus: 1, slots: 1, type: "CloseCombat", description: "Can also provide Force +2 bonus" },
  { name: "Baseball bat", damage: 2, bonus: 1, slots: 1, type: "CloseCombat" },
  { name: "Spear", damage: 2, bonus: 2, slots: 1, type: "CloseCombat" },
  { name: "Sword", damage: 2, bonus: 2, slots: 1, type: "CloseCombat" },
  { name: "Big axe", damage: 2, bonus: 2, slots: 1, type: "CloseCombat" },
  { name: "Sledgehammer", damage: 3, bonus: 0, slots: 2, type: "CloseCombat" }
];

// Ranged Weapons Table
export const RANGED_WEAPONS: WeaponItem[] = [
  { name: "Throwing knife", damage: 1, bonus: 1, range: "Short", slots: 0.5, type: "Ranged" },
  { name: "Bow", damage: 1, bonus: 2, range: "Long", slots: 1, type: "Ranged" },
  { name: "Crossbow", damage: 2, bonus: 2, range: "Short", slots: 1, type: "Ranged" },
  { name: "Pistol or revolver", damage: 2, bonus: 2, range: "Short", slots: 1, type: "Ranged" },
  { name: "Pipe Gun", damage: 2, bonus: 1, range: "Short", slots: 1, type: "Ranged" },
  { name: "Shotgun", damage: 2, bonus: 3, range: "Short", slots: 1, type: "Ranged" },
  { name: "Rifle", damage: 2, bonus: 2, range: "Long", slots: 1, type: "Ranged" },
  { name: "Sniper rifle", damage: 2, bonus: 2, range: "Extreme", slots: 2, type: "Ranged" },
  { name: "Sub machine gun", damage: 2, bonus: 3, range: "Short", slots: 1, type: "Ranged" },
  { name: "Assault rifle", damage: 2, bonus: 3, range: "Long", slots: 1, type: "Ranged" },
  { name: "Heavy machine gun", damage: 3, bonus: 3, range: "Extreme", slots: 3, type: "Ranged" },
  { name: "Molotov cocktail", damage: 0, bonus: 0, range: "Short", slots: 0.5, type: "Ranged", description: "BP 6 (Blast Power)" },
  { name: "Hand grenade", damage: 0, bonus: 1, range: "Short", slots: 0.5, type: "Ranged", description: "BP 8 (Blast Power)" },
  { name: "Rocket launcher", damage: 0, bonus: 2, range: "Long", slots: 2, type: "Ranged", description: "BP 10 (Blast Power)" },
  { name: "Tank cannon", damage: 0, bonus: 3, range: "Extreme", slots: "X", type: "Ranged", description: "BP 12 (Blast Power)" }
];

// Armor Types Table
export const ARMOR_TYPES: ArmorItem[] = [
  { name: "Soft vest", armorLevel: 4, penalty: "-1", slots: 1, type: "Armor" },
  { name: "Body armor", armorLevel: 6, penalty: "-2", slots: 1, type: "Armor" },
  { name: "Metal-plated armor", armorLevel: 8, penalty: "-3", slots: 2, type: "Armor" }
];

// Combined gear for easy searching
export const ALL_GEAR: GearItem[] = [
  ...GENERAL_GEAR,
  ...CLOSE_COMBAT_WEAPONS,
  ...RANGED_WEAPONS,
  ...ARMOR_TYPES
];

// Utility functions
export const getGearByName = (name: string): GearItem | undefined => {
  return ALL_GEAR.find(item => item.name.toLowerCase() === name.toLowerCase());
};

export const getGearByType = (type: GearItem['type']): GearItem[] => {
  return ALL_GEAR.filter(item => item.type === type);
};

export const getWeapons = (): WeaponItem[] => {
  return [...CLOSE_COMBAT_WEAPONS, ...RANGED_WEAPONS];
};

export const getArmor = (): ArmorItem[] => {
  return ARMOR_TYPES;
};

// Search function for gear picker
export const searchGear = (query: string): GearItem[] => {
  const lowercaseQuery = query.toLowerCase();
  return ALL_GEAR.filter(item => 
    item.name.toLowerCase().includes(lowercaseQuery) ||
    (item.bonus && String(item.bonus).toLowerCase().includes(lowercaseQuery)) ||
    (item.description && item.description.toLowerCase().includes(lowercaseQuery))
  );
};

// Ensure unarmed combat is always available
export const ensureUnarmedCombat = (inventory: string[]): string[] => {
  const hasUnarmed = inventory.some(item => 
    item.toLowerCase().includes('foot') ||
    item.toLowerCase().includes('fist') ||
    item.toLowerCase().includes('unarmed') ||
    item.toLowerCase().includes('bare hands')
  );
  
  if (!hasUnarmed) {
    return ['Foot or fist (1 damage, Close Combat)', ...inventory];
  }
  return inventory;
};
