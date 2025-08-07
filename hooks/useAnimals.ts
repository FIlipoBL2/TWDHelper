// Custom hooks following Dependency Inversion Principle

import { useState, useMemo, useCallback } from 'react';
import { NPC } from '../types';
import { AnimalSearchService, AnimalManagementService } from '../utils/animalUtils';
import { useGameState } from '../context/GameStateContext';

export interface UseAnimalsResult {
  animals: NPC[];
  filteredAnimals: NPC[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalAnimals: number;
  canMoveToHaven: (animalId: string) => boolean;
  canRemoveFromHaven: (animalId: string) => boolean;
  moveToHaven: (animalId: string) => void;
  removeFromHaven: (animalId: string) => void;
}

export const useAnimals = (): UseAnimalsResult => {
  const { gameState, addNpcToHaven, removeNpcFromHaven } = useGameState();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter NPCs to get only animals
  const animals = useMemo(() => {
    return gameState.npcs.filter(npc => npc.isAnimal === true);
  }, [gameState.npcs]);

  // Apply search filter
  const filteredAnimals = useMemo(() => {
    if (!searchQuery) return animals;
    
    return animals.filter(animal => 
      AnimalSearchService.matchesQuery(animal, searchQuery)
    );
  }, [animals, searchQuery]);

  // Management functions
  const canMoveToHaven = useCallback((animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    return animal ? AnimalManagementService.canBeMovedToHaven(animal) : false;
  }, [animals]);

  const canRemoveFromHaven = useCallback((animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    return animal ? AnimalManagementService.canBeRemovedFromHaven(animal) : false;
  }, [animals]);

  const moveToHaven = useCallback((animalId: string) => {
    addNpcToHaven(animalId);
  }, [addNpcToHaven]);

  const removeFromHaven = useCallback((animalId: string) => {
    removeNpcFromHaven(animalId);
  }, [removeNpcFromHaven]);

  return {
    animals,
    filteredAnimals,
    searchQuery,
    setSearchQuery,
    totalAnimals: animals.length,
    canMoveToHaven,
    canRemoveFromHaven,
    moveToHaven,
    removeFromHaven
  };
};

export interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  displayedItems: T[];
  showAll: boolean;
  setCurrentPage: (page: number) => void;
  setShowAll: (show: boolean) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export const usePagination = <T>(
  items: T[], 
  itemsPerPage: number
): UsePaginationResult<T> => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const displayedItems = useMemo(() => {
    if (showAll) return items;
    
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage, showAll]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const canGoNext = currentPage < totalPages - 1;
  const canGoPrevious = currentPage > 0;

  return {
    currentPage,
    totalPages,
    displayedItems,
    showAll,
    setCurrentPage,
    setShowAll,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious
  };
};
