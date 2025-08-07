// Test file to verify all imports work correctly
import { AnimalList } from './components/animal/AnimalList';
import { AnimalListItem } from './components/animal/AnimalListItem';
import AnimalDiceRoller from './components/animal/AnimalDiceRoller';
import { NPCList } from './components/npc/NPCList';
import { NPCListItem } from './components/npc/NPCListItem';
import { useAnimals } from './hooks/useAnimals';
import { useNPCs } from './hooks/useNPCs';
import { AnimalCombatService, AnimalSearchService, AnimalManagementService } from './utils/animalUtils';
import { NPCSearchService, NPCManagementService, NPCSkillService } from './utils/npcUtils';

// This file verifies that all our refactored components can be imported successfully
console.log('All SOLID refactored components imported successfully!');
