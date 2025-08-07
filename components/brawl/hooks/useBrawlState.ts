import { useState, useCallback, useMemo } from 'react';
import { BrawlState, BrawlParticipant } from '../../../types/brawl';
import { Character, NPC } from '../../../types';

interface UseBrawlStateProps {
  characters: Character[];
  npcs: NPC[];
}

export const useBrawlState = ({ characters, npcs }: UseBrawlStateProps) => {
  const [brawlState, setBrawlState] = useState<BrawlState>({
    isActive: false,
    currentRound: 1,
    currentPhase: 1,
    participants: [],
    battlemap: {
      objects: [],
      width: 1000,
      height: 700
    }
  });

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [participantHelpDice, setParticipantHelpDice] = useState<Record<string, number>>({});

  // Memoized available characters to prevent re-computation
  const availableCharacters = useMemo(() => [
    ...characters.map(char => ({
      id: char.id,
      name: char.name,
      type: 'PC' as const,
      health: char.health,
      maxHealth: char.maxHealth,
      tokenImage: char.tokenImage
    })),
    ...npcs.filter(npc => !npc.isAnimal).map(npc => ({
      id: npc.id,
      name: npc.name,
      type: 'NPC' as const,
      health: npc.health,
      maxHealth: npc.maxHealth,
      tokenImage: npc.tokenImage
    })),
    ...npcs.filter(npc => npc.isAnimal).map(npc => ({
      id: npc.id,
      name: npc.name,
      type: 'Animal' as const,
      health: npc.health,
      maxHealth: npc.maxHealth,
      tokenImage: npc.tokenImage
    }))
  ], [characters, npcs]);

  const startBrawl = useCallback(() => {
    const initialParticipants: BrawlParticipant[] = selectedParticipants
      .map((id, index) => {
        const char = availableCharacters.find(c => c.id === id);
        if (!char) return null;

        return {
          id: char.id,
          name: char.name,
          type: char.type,
          health: char.health,
          maxHealth: char.maxHealth,
          position: { 
            x: 100 + (index * 60), 
            y: 100 + (index % 2) * 60 
          },
          tokenImage: char.tokenImage,
          isActive: true,
          hasActed: false,
          coverStatus: 'none'
        };
      })
      .filter(Boolean) as BrawlParticipant[];

    setBrawlState(prev => ({
      ...prev,
      isActive: true,
      currentRound: 1,
      currentPhase: 1,
      participants: initialParticipants
    }));
  }, [selectedParticipants, availableCharacters]);

  const endBrawl = useCallback(() => {
    setBrawlState(prev => ({
      ...prev,
      isActive: false,
      currentRound: 1,
      currentPhase: 1,
      participants: []
    }));
  }, []);

  const nextPhase = useCallback(() => {
    setBrawlState(prev => {
      const nextPhaseNum = prev.currentPhase + 1;
      
      if (nextPhaseNum > 6) {
        return {
          ...prev,
          currentRound: prev.currentRound + 1,
          currentPhase: 1,
          participants: prev.participants.map(p => ({ ...p, hasActed: false }))
        };
      }
      
      return {
        ...prev,
        currentPhase: nextPhaseNum
      };
    });
  }, []);

  const previousPhase = useCallback(() => {
    setBrawlState(prev => {
      const prevPhaseNum = prev.currentPhase - 1;
      
      if (prevPhaseNum < 1) {
        return {
          ...prev,
          currentRound: Math.max(1, prev.currentRound - 1),
          currentPhase: 6
        };
      }
      
      return {
        ...prev,
        currentPhase: prevPhaseNum
      };
    });
  }, []);

  const toggleParticipantSelection = useCallback((characterId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  }, []);

  const setParticipantHelp = useCallback((participantId: string, dice: number) => {
    setParticipantHelpDice(prev => ({
      ...prev,
      [participantId]: Math.max(-3, Math.min(3, dice))
    }));
  }, []);

  const getParticipantHelpDice = useCallback((participantId: string) => {
    return participantHelpDice[participantId] || 0;
  }, [participantHelpDice]);

  const markParticipantActed = useCallback((participantId: string) => {
    setBrawlState(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === participantId ? { ...p, hasActed: true } : p
      )
    }));
  }, []);

  const setParticipantCoverStatus = useCallback((participantId: string, coverStatus: 'none' | 'partial' | 'full') => {
    setBrawlState(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === participantId ? { ...p, coverStatus } : p
      )
    }));
  }, []);

  const toggleParticipantCover = useCallback((participantId: string) => {
    setBrawlState(prev => ({
      ...prev,
      participants: prev.participants.map(p => {
        if (p.id === participantId) {
          // Cycle through cover states: none -> partial -> full -> none
          let newCoverStatus: 'none' | 'partial' | 'full';
          switch (p.coverStatus) {
            case 'none':
              newCoverStatus = 'partial';
              break;
            case 'partial':
              newCoverStatus = 'full';
              break;
            case 'full':
            default:
              newCoverStatus = 'none';
              break;
          }
          return { ...p, coverStatus: newCoverStatus };
        }
        return p;
      })
    }));
  }, []);

  return {
    brawlState,
    setBrawlState,
    selectedParticipants,
    participantHelpDice,
    availableCharacters,
    startBrawl,
    endBrawl,
    nextPhase,
    previousPhase,
    toggleParticipantSelection,
    setParticipantHelp,
    getParticipantHelpDice,
    markParticipantActed,
    setParticipantCoverStatus,
    toggleParticipantCover
  };
};
