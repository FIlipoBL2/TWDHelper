// Brawl System Types - TWD RPG Combat Management
export interface BrawlPhase {
  id: number;
  name: string;
  description: string;
  actions: string[];
}

export interface BrawlParticipant {
  id: string;
  name: string;
  type: 'PC' | 'NPC' | 'Animal';
  health: number;
  maxHealth: number;
  position: { x: number; y: number };
  tokenImage?: string;
  isActive: boolean;
  hasActed: boolean;
  coverStatus?: 'none' | 'partial' | 'full';
  range?: 'close' | 'short' | 'medium' | 'long' | 'extreme';
}

export interface BrawlState {
  isActive: boolean;
  currentRound: number;
  currentPhase: number;
  participants: BrawlParticipant[];
  battlemap: {
    background?: string;
    objects: BattlemapObject[];
    width: number;
    height: number;
  };
}

export interface BattlemapObject {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  type: 'cover' | 'obstacle' | 'interactive' | 'decoration';
  provideseCover?: boolean;
  isPassable?: boolean;
  image?: string;
}

export interface AIBackgroundPrompt {
  prompt: string;
  style: 'realistic' | 'apocalyptic' | 'urban' | 'rural' | 'indoor';
  mood: 'tense' | 'desperate' | 'dark' | 'hopeful' | 'neutral';
}
