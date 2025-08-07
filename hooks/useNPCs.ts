// NPC-specific hooks following Dependency Inversion Principle

import { useState, useMemo, useCallback } from 'react';
import { NPC } from '../types';
import { NPCSearchService, NPCManagementService } from '../utils/npcUtils';
import { useGameState } from '../context/GameStateContext';

export interface UseNPCsResult {
  npcs: NPC[];
  filteredNPCs: NPC[];
  companions: NPC[];
  havenNPCs: NPC[];
  wildNPCs: NPC[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalNPCs: number;
  canMoveToHaven: (npcId: string) => boolean;
  canRemoveFromHaven: (npcId: string) => boolean;
  moveToHaven: (npcId: string) => void;
  removeFromHaven: (npcId: string) => void;
}

export const useNPCs = (): UseNPCsResult => {
  const { gameState, addNpcToHaven, removeNpcFromHaven } = useGameState();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter NPCs (exclude animals)
  const npcs = useMemo(() => {
    return gameState.npcs.filter(npc => npc.isAnimal !== true);
  }, [gameState.npcs]);

  // Apply search filter
  const filteredNPCs = useMemo(() => {
    if (!searchQuery) return npcs;
    
    return npcs.filter(npc => 
      NPCSearchService.matchesQuery(npc, searchQuery)
    );
  }, [npcs, searchQuery]);

  // Categorized NPCs
  const companions = useMemo(() => {
    return NPCManagementService.getCompanions(npcs);
  }, [npcs]);

  const havenNPCs = useMemo(() => {
    return NPCManagementService.getHavenNPCs(npcs);
  }, [npcs]);

  const wildNPCs = useMemo(() => {
    return NPCManagementService.getWildNPCs(npcs);
  }, [npcs]);

  // Management functions
  const canMoveToHaven = useCallback((npcId: string) => {
    const npc = npcs.find(n => n.id === npcId);
    return npc ? NPCManagementService.canBeMovedToHaven(npc) : false;
  }, [npcs]);

  const canRemoveFromHaven = useCallback((npcId: string) => {
    const npc = npcs.find(n => n.id === npcId);
    return npc ? NPCManagementService.canBeRemovedFromHaven(npc) : false;
  }, [npcs]);

  const moveToHaven = useCallback((npcId: string) => {
    addNpcToHaven(npcId);
  }, [addNpcToHaven]);

  const removeFromHaven = useCallback((npcId: string) => {
    removeNpcFromHaven(npcId);
  }, [removeNpcFromHaven]);

  return {
    npcs,
    filteredNPCs,
    companions,
    havenNPCs,
    wildNPCs,
    searchQuery,
    setSearchQuery,
    totalNPCs: npcs.length,
    canMoveToHaven,
    canRemoveFromHaven,
    moveToHaven,
    removeFromHaven
  };
};
