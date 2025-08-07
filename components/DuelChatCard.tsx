import React, { memo } from 'react';
import { Combatant, RangeCategory } from '../types';
import { getMeleeIcon, getRangedIcon, getSniperIcon, getLocationIcon, getHealthIcon, getArmorIcon } from './common/GameIcons';

interface DuelChatCardProps {
  combatants: Combatant[];
  round: number;
  currentTurn: number;
  currentRange?: RangeCategory;
}

const DuelChatCard: React.FC<DuelChatCardProps> = ({ combatants, round, currentTurn, currentRange = RangeCategory.Short }) => {
  if (combatants.length !== 2) {
    return null;
  }

  const [combatant1, combatant2] = combatants;
  const activeCombatant = combatants[currentTurn];

  const getHealthColor = (health: number) => {
    if (health <= 1) return 'text-red-400';
    if (health <= 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRangeColor = (range: RangeCategory) => {
    switch (range) {
      case RangeCategory.Short: return 'text-yellow-400';
      case RangeCategory.Long: return 'text-blue-400';
      case RangeCategory.Extreme: return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRangeIcon = (range: RangeCategory) => {
    switch (range) {
      case RangeCategory.Short: return getMeleeIcon("", 14);
      case RangeCategory.Long: return getRangedIcon("", 14);
      case RangeCategory.Extreme: return getSniperIcon("", 14);
      default: return getLocationIcon("", 14);
    }
  };

  return (
    <div className="bg-gray-800 border border-red-500 rounded-lg p-4 max-w-lg mx-auto my-4">
      {/* VS Header */}
      <div className="flex items-center justify-center mb-4">
        <img 
          src="/VS logo.png" 
          alt="VS" 
          className="w-12 h-12"
        />
      </div>

      {/* Duel Info */}
      <div className="text-center mb-4">
        <h4 className="text-lg font-bold text-red-500">DUEL - Round {round}</h4>
        <p className="text-sm text-gray-400">{activeCombatant.name}'s Turn</p>
        <div className={`text-xs ${getRangeColor(currentRange)} mt-1`}>
          {getRangeIcon(currentRange)} {currentRange} Range
        </div>
      </div>

      {/* Combatants */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Combatant */}
        <div className={`text-center p-3 rounded border ${
          currentTurn === 0 ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600'
        }`}>
          <img 
            src={combatant1.tokenImage || "/default-token.svg"} 
            alt={combatant1.name}
            className="w-10 h-10 mx-auto mb-2 rounded-full border border-blue-500"
          />
          <h5 className="font-medium text-blue-400 text-sm truncate">{combatant1.name}</h5>
          <div className={`text-xs ${getHealthColor(combatant1.health)} flex items-center gap-1`}>
            {getHealthIcon("", 12)} {combatant1.health}/3
          </div>
          {combatant1.armorLevel > 0 && (
            <div className="text-xs text-green-400 flex items-center gap-1">
              {getArmorIcon("", 12)} {combatant1.armorLevel}
            </div>
          )}
        </div>

        {/* Right Combatant */}
        <div className={`text-center p-3 rounded border ${
          currentTurn === 1 ? 'border-red-500 bg-red-900/20' : 'border-gray-600'
        }`}>
          <img 
            src={combatant2.tokenImage || "/default-token.svg"} 
            alt={combatant2.name}
            className="w-10 h-10 mx-auto mb-2 rounded-full border border-red-500"
          />
          <h5 className="font-medium text-red-400 text-sm truncate">{combatant2.name}</h5>
          <div className={`text-xs ${getHealthColor(combatant2.health)} flex items-center gap-1`}>
            {getHealthIcon("", 12)} {combatant2.health}/3
          </div>
          {combatant2.armorLevel > 0 && (
            <div className="text-xs text-green-400 flex items-center gap-1">
              {getArmorIcon("", 12)} {combatant2.armorLevel}
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-3 text-xs text-gray-400">
        Switch to Combat tab to take actions • {getRangeIcon(currentRange)} {currentRange} range combat
      </div>
    </div>
  );
};

export default memo(DuelChatCard);
