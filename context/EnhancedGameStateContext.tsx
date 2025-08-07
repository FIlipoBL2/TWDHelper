/**
 * Enhanced Game State Management
 * Addresses race conditions, performance issues, and implements better architecture
 */
import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useRef, 
  useEffect,
  useMemo
} from 'react';
import { GameState, GameStateContextType } from '../types';
import { INITIAL_GAME_STATE, SKILL_DEFINITIONS } from '../constants';
import { BaseRepository, BaseService, CacheService, globalEventBus } from '../services/serviceLayer';
import { useSafeAsync, useSafeTimeout } from '../utils/performance';

// Action types for the reducer
type GameStateAction = 
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'UPDATE_CHARACTER'; payload: { id: string; updates: any } }
  | { type: 'ADD_CHARACTER'; payload: any }
  | { type: 'REMOVE_CHARACTER'; payload: string }
  | { type: 'UPDATE_NPC'; payload: { id: string; updates: any } }
  | { type: 'ADD_NPC'; payload: any }
  | { type: 'REMOVE_NPC'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: any }
  | { type: 'SET_GAME_MODE'; payload: any }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_HAVEN'; payload: any }
  | { type: 'UPDATE_SESSION'; payload: any }
  | { type: 'UPDATE_COMBAT'; payload: any }
  | { type: 'BATCH_UPDATE'; payload: Partial<GameState> };

// Reducer for game state management
function gameStateReducer(state: GameState, action: GameStateAction): GameState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return action.payload;
    
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map(char => 
          char.id === action.payload.id 
            ? { ...char, ...action.payload.updates }
            : char
        )
      };
    
    case 'ADD_CHARACTER':
      return {
        ...state,
        characters: [...state.characters, action.payload]
      };
    
    case 'REMOVE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter(char => char.id !== action.payload)
      };
    
    case 'UPDATE_NPC':
      return {
        ...state,
        npcs: state.npcs.map(npc => 
          npc.id === action.payload.id 
            ? { ...npc, ...action.payload.updates }
            : npc
        )
      };
    
    case 'ADD_NPC':
      return {
        ...state,
        npcs: [...state.npcs, action.payload]
      };
    
    case 'REMOVE_NPC':
      return {
        ...state,
        npcs: state.npcs.filter(npc => npc.id !== action.payload)
      };
    
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatLog: [...state.chatLog, action.payload]
      };
    
    case 'SET_GAME_MODE':
      return {
        ...state,
        gameMode: action.payload
      };
    
    case 'RESET_GAME':
      return INITIAL_GAME_STATE;
    
    case 'UPDATE_HAVEN':
      return {
        ...state,
        haven: { ...state.haven, ...action.payload }
      };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        session: { ...state.session, ...action.payload }
      };
    
    case 'UPDATE_COMBAT':
      return {
        ...state,
        combat: { ...state.combat, ...action.payload }
      };
    
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload
      };
    
    default:
      return state;
  }
}

// Enhanced context with proper separation of concerns
const EnhancedGameStateContext = createContext<GameStateContextType | undefined>(undefined);

// Service for managing game state persistence
class GameStateService extends BaseService {
  private cache = new CacheService<string, GameState>();
  private storageKey = 'twd-game-state';
  
  initialize(): void {
    this.isInitialized = true;
    // Load from localStorage on initialization
    this.loadFromStorage();
  }

  private loadFromStorage(): GameState | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.validateGameState(parsed) ? parsed : null;
      }
    } catch (error) {
      console.error('Failed to load game state from storage:', error);
    }
    return null;
  }

  private validateGameState(state: any): state is GameState {
    // Basic validation - extend as needed
    return state && 
           typeof state === 'object' && 
           Array.isArray(state.characters) &&
           Array.isArray(state.npcs) &&
           Array.isArray(state.chatLog) &&
           state.gameMode !== undefined;
  }

  saveToStorage(state: GameState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      this.cache.set('current', state, 60000); // Cache for 1 minute
      
      // Emit event for other components
      globalEventBus.emit('gameState:saved', { state });
    } catch (error) {
      console.error('Failed to save game state to storage:', error);
    }
  }

  getCachedState(): GameState | null {
    return this.cache.get('current');
  }

  clearStorage(): void {
    localStorage.removeItem(this.storageKey);
    this.cache.clear();
    globalEventBus.emit('gameState:cleared');
  }

  exportState(state: GameState): string {
    return JSON.stringify(state, null, 2);
  }

  importState(jsonString: string): GameState | null {
    try {
      const parsed = JSON.parse(jsonString);
      return this.validateGameState(parsed) ? parsed : null;
    } catch (error) {
      console.error('Failed to import game state:', error);
      return null;
    }
  }
}

// Create service instance
const gameStateService = new GameStateService();

interface EnhancedGameStateProviderProps {
  children: React.ReactNode;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export const EnhancedGameStateProvider: React.FC<EnhancedGameStateProviderProps> = ({ 
  children, 
  autoSave = true,
  autoSaveInterval = 30000 // 30 seconds
}) => {
  const [gameState, dispatch] = useReducer(gameStateReducer, INITIAL_GAME_STATE);
  const [isEditMode, setIsEditMode] = React.useState(false);
  
  // Refs for managing async operations
  const pendingOperations = useRef<Set<string>>(new Set());
  const { setSafeTimeout } = useSafeTimeout();
  const executeAsync = useSafeAsync();

  // Initialize service on mount
  useEffect(() => {
    gameStateService.initialize();
    
    // Try to load saved state
    const savedState = gameStateService.getCachedState() || gameStateService['loadFromStorage']();
    if (savedState) {
      dispatch({ type: 'SET_GAME_STATE', payload: savedState });
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const saveTimer = setSafeTimeout(() => {
      gameStateService.saveToStorage(gameState);
    }, autoSaveInterval);

    return () => clearTimeout(saveTimer);
  }, [gameState, autoSave, autoSaveInterval, setSafeTimeout]);

  // Optimized action creators with race condition protection
  const createSafeAction = useCallback(<T extends any[]>(
    actionKey: string,
    action: (...args: T) => GameStateAction | Promise<GameStateAction>
  ) => {
    return async (...args: T) => {
      // Prevent duplicate operations
      if (pendingOperations.current.has(actionKey)) {
        return;
      }

      pendingOperations.current.add(actionKey);

      try {
        const actionResult = await action(...args);
        dispatch(actionResult);
      } catch (error) {
        console.error(`Error in action ${actionKey}:`, error);
      } finally {
        pendingOperations.current.delete(actionKey);
      }
    };
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<GameStateContextType>(() => {
    // Helper function to create stub methods for compatibility
    const createStub = <T extends any[], R>(name: string, returnValue: R) => 
      (...args: T): R => {
        console.warn(`Method ${name} not yet implemented in EnhancedGameStateContext`);
        return returnValue;
      };

    return {
      gameState,
      isEditMode,
      
      // Basic state management
      toggleEditMode: () => setIsEditMode(prev => !prev),
      resetGame: () => dispatch({ type: 'RESET_GAME' }),
      setGameMode: (mode) => dispatch({ type: 'SET_GAME_MODE', payload: mode }),
      
      // Character management
      addCharacter: () => {
        const newChar = {
          id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'New Character',
          attributes: { Strength: 3, Agility: 3, Wits: 3, Empathy: 3 },
          skills: {},
          gear: [],
          conditions: [],
          stress: 0,
          trauma: 0,
          archetype: 'Nobody'
        };
        dispatch({ type: 'ADD_CHARACTER', payload: newChar });
        return newChar.id;
      },
      
      updateCharacter: createSafeAction('updateCharacter', (id: string, updates: any) => ({
        type: 'UPDATE_CHARACTER',
        payload: { id, updates }
      })),
      
      removeCharacter: createSafeAction('removeCharacter', (id: string) => ({
        type: 'REMOVE_CHARACTER',
        payload: id
      })),
      
      // NPC management
      addNPC: createSafeAction('addNPC', (npc: any) => ({
        type: 'ADD_NPC',
        payload: npc
      })),
      
      updateNpc: createSafeAction('updateNpc', (id: string, updates: any) => ({
        type: 'UPDATE_NPC',
        payload: { id, updates }
      })),
      
      removeNpc: createSafeAction('removeNpc', (id: string) => ({
        type: 'REMOVE_NPC',
        payload: id
      })),
      
      // Chat management
      addChatMessage: createSafeAction('addChatMessage', (message: any) => ({
        type: 'ADD_CHAT_MESSAGE',
        payload: message
      })),
      
      // File operations
      saveSession: async () => {
        return executeAsync(async (signal) => {
          if (signal.aborted) return;
          
          const dataStr = gameStateService.exportState(gameState);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `twd-session-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          
          URL.revokeObjectURL(url);
        });
      },
      
      loadSession: (saveFileContent: string): boolean => {
        try {
          const importedState = gameStateService.importState(saveFileContent);
          if (importedState) {
            dispatch({ type: 'SET_GAME_STATE', payload: importedState });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to load session:', error);
          return false;
        }
      },

      // Essential methods that are commonly used - implement these
      getPlayerCharacter: (characterId: string) => gameState.characters.find(c => c.id === characterId),
      getNpc: (npcId: string) => gameState.npcs.find(n => n.id === npcId),
      getSkillAttribute: (skill: any) => SKILL_DEFINITIONS.find(s => s.name === skill)?.attribute,
      
      // Stub methods for compatibility - these will be implemented incrementally
      loadSurvivalScenario: createStub('loadSurvivalScenario', undefined),
      updateThreat: createStub('updateThreat', undefined),
      rollOnTable: createStub('rollOnTable', null),
      pushRoll: createStub('pushRoll', undefined),
      generateStartingNpcs: createStub('generateStartingNpcs', undefined),
      designateCompanion: createStub('designateCompanion', undefined),
      upgradeNpcToPc: createStub('upgradeNpcToPc', undefined),
      advanceSessionClocks: createStub('advanceSessionClocks', undefined),
      generateRandomSkillExpertise: createStub('generateRandomSkillExpertise', {}),
      generateRandomAnimal: createStub('generateRandomAnimal', undefined),
      addNpcToHaven: createStub('addNpcToHaven', undefined),
      removeNpcFromHaven: createStub('removeNpcFromHaven', undefined),
      addCustomNpc: createStub('addCustomNpc', undefined),
      generateRandomNpc: createStub('generateRandomNpc', undefined),
      updateHaven: createStub('updateHaven', undefined),
      toggleItemEquipped: createStub('toggleItemEquipped', undefined),
      
      // Clock management
      addClock: createStub('addClock', undefined),
      updateClock: createStub('updateClock', undefined),
      removeClock: createStub('removeClock', undefined),
      
      // PC management
      addRandomCharacter: createStub('addRandomCharacter', ''),
      toggleActiveTalent: createStub('toggleActiveTalent', undefined),
      purchaseTalent: createStub('purchaseTalent', false),
      purchaseSkillPoint: createStub('purchaseSkillPoint', false),
      finalizeCharacterCreation: createStub('finalizeCharacterCreation', undefined),
      rollAndAddCriticalInjury: createStub('rollAndAddCriticalInjury', undefined),
      removeCriticalInjury: createStub('removeCriticalInjury', undefined),
      
      // Inventory management
      addInventoryItem: createStub('addInventoryItem', undefined),
      updateInventoryItem: createStub('updateInventoryItem', undefined),
      removeInventoryItem: createStub('removeInventoryItem', undefined),
      addTalent: createStub('addTalent', undefined),
      updateTalent: createStub('updateTalent', undefined),
      removeTalent: createStub('removeTalent', undefined),
      addVehicle: createStub('addVehicle', undefined),
      updateVehicle: createStub('updateVehicle', undefined),
      removeVehicle: createStub('removeVehicle', undefined),
      
      // Haven management
      addHavenProject: createStub('addHavenProject', undefined),
      updateHavenProject: createStub('updateHavenProject', undefined),
      removeHavenProject: createStub('removeHavenProject', undefined),
      addHavenIssue: createStub('addHavenIssue', undefined),
      removeHavenIssue: createStub('removeHavenIssue', undefined),
      
      // Combat management
      initiateCombatSetup: createStub('initiateCombatSetup', undefined),
      updateCombatSetup: createStub('updateCombatSetup', undefined),
      finalizeCombatSetup: createStub('finalizeCombatSetup', undefined),
      endCombat: createStub('endCombat', undefined),
      updateCombatant: createStub('updateCombatant', undefined),
      nextTurn: createStub('nextTurn', undefined),
      resolveOpposedAttack: createStub('resolveOpposedAttack', undefined),
      resolveSwarmRound: createStub('resolveSwarmRound', undefined),
      applySwarmConsequence: createStub('applySwarmConsequence', undefined),
      setCombatantAction: createStub('setCombatantAction', undefined),
      resolveNextBrawlPhase: createStub('resolveNextBrawlPhase', undefined),
      setTurnOrder: createStub('setTurnOrder', undefined),
      moveCombatant: createStub('moveCombatant', undefined),
      toggleCover: createStub('toggleCover', undefined),
      generateAndSetBattlemap: createStub('generateAndSetBattlemap', undefined),
      addGridObject: createStub('addGridObject', undefined),
      updateGridObject: createStub('updateGridObject', undefined),
      moveGridObject: createStub('moveGridObject', undefined),
      removeGridObject: createStub('removeGridObject', undefined),
      addRulerMeasurement: createStub('addRulerMeasurement', undefined),
      removeRulerMeasurement: createStub('removeRulerMeasurement', undefined),
      clearAllRulers: createStub('clearAllRulers', undefined),
      setDuelRange: createStub('setDuelRange', undefined),
      
      // Brawl management
      initiateBrawl: createStub('initiateBrawl', undefined),
      endBrawl: createStub('endBrawl', undefined),
      addBrawlParticipant: createStub('addBrawlParticipant', undefined),
      updateBrawlParticipant: createStub('updateBrawlParticipant', undefined),
      removeBrawlParticipant: createStub('removeBrawlParticipant', undefined),
      setBrawlParticipantAction: createStub('setBrawlParticipantAction', undefined),
      nextBrawlPhase: createStub('nextBrawlPhase', undefined),
      nextBrawlRound: createStub('nextBrawlRound', undefined),
      addBattlemapObject: createStub('addBattlemapObject', undefined),
      updateBattlemapObject: createStub('updateBattlemapObject', undefined),
      removeBattlemapObject: createStub('removeBattlemapObject', undefined),
      generateBrawlBackground: createStub('generateBrawlBackground', Promise.resolve()),
      
      // AI Oracle
      askOracle: createStub('askOracle', Promise.resolve('')),
      generateScene: createStub('generateScene', Promise.resolve('')),
      
      // Custom Data Management
      addCustomArchetype: createStub('addCustomArchetype', undefined),
      updateCustomArchetype: createStub('updateCustomArchetype', undefined),
      removeCustomArchetype: createStub('removeCustomArchetype', undefined),
      addCustomTalent: createStub('addCustomTalent', undefined),
      updateCustomTalent: createStub('updateCustomTalent', undefined),
      removeCustomTalent: createStub('removeCustomTalent', undefined),
      addCustomItem: createStub('addCustomItem', undefined),
      updateCustomItem: createStub('updateCustomItem', undefined),
      removeCustomItem: createStub('removeCustomItem', undefined),
      
      // Faction Management
      addFaction: createStub('addFaction', undefined),
      updateFaction: createStub('updateFaction', undefined),
      removeFaction: createStub('removeFaction', undefined),
    };
  }, [gameState, isEditMode, createSafeAction, executeAsync]);

  return (
    <EnhancedGameStateContext.Provider value={contextValue}>
      {children}
    </EnhancedGameStateContext.Provider>
  );
};

export const useEnhancedGameState = (): GameStateContextType => {
  const context = useContext(EnhancedGameStateContext);
  if (!context) {
    throw new Error('useEnhancedGameState must be used within an EnhancedGameStateProvider');
  }
  return context;
};

// Legacy compatibility - gradually migrate to enhanced version
export const useGameState = useEnhancedGameState;

export default {
  EnhancedGameStateProvider,
  useEnhancedGameState,
  useGameState,
  gameStateService
};
