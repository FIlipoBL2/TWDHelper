import React from 'react';
import { BrawlParticipant } from '../../../types/brawl';

interface ActionButtonProps {
  onClick: () => void;
  icon: string;
  label: string;
  description: string;
  disabled?: boolean;
  colorClass?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon,
  label,
  description,
  disabled = false,
  colorClass = 'bg-blue-600 hover:bg-blue-700'
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 ${colorClass} disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2`}
  >
    <span>{icon}</span>
    <span>{label}</span>
    <div className="text-xs opacity-75">({description})</div>
  </button>
);

interface BrawlActionGridProps {
  participant: BrawlParticipant | null;
  actions: {
    move: (p: BrawlParticipant) => void;
    takeCover: (p: BrawlParticipant) => void;
    closeCombat: (p: BrawlParticipant) => void;
    rangedCombat: (p: BrawlParticipant) => void;
    firstAid: (p: BrawlParticipant) => void;
    leadership: (p: BrawlParticipant) => void;
    overwatch: (p: BrawlParticipant) => void;
    stealth: (p: BrawlParticipant) => void;
    scout: (p: BrawlParticipant) => void;
    survival: (p: BrawlParticipant) => void;
    tech: (p: BrawlParticipant) => void;
    force: (p: BrawlParticipant) => void;
    endure: (p: BrawlParticipant) => void;
    manipulation: (p: BrawlParticipant) => void;
    other: (p: BrawlParticipant) => void;
  };
}

export const BrawlActionGrid: React.FC<BrawlActionGridProps> = ({ participant, actions }) => {
  if (!participant) return null;

  const getCoverStatusIcon = (coverStatus: 'none' | 'partial' | 'full' | undefined) => {
    switch (coverStatus) {
      case 'partial': return '🛡️';
      case 'full': return '🏰';
      default: return '';
    }
  };

  const getCoverStatusText = (coverStatus: 'none' | 'partial' | 'full' | undefined) => {
    switch (coverStatus) {
      case 'partial': return 'Partial Cover';
      case 'full': return 'Full Cover';
      default: return 'No Cover';
    }
  };

  const actionButtons = [
    {
      key: 'move',
      onClick: () => actions.move(participant),
      icon: '🏃',
      label: 'Move',
      description: 'Mobility + Agility',
      colorClass: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      key: 'takeCover',
      onClick: () => actions.takeCover(participant),
      icon: '🛡️',
      label: 'Take Cover',
      description: 'Mobility + Agility',
      colorClass: 'bg-green-600 hover:bg-green-700'
    },
    {
      key: 'closeCombat',
      onClick: () => actions.closeCombat(participant),
      icon: '⚔️',
      label: 'Close Attack',
      description: 'Close Combat + Strength',
      colorClass: 'bg-red-600 hover:bg-red-700'
    },
    {
      key: 'rangedCombat',
      onClick: () => actions.rangedCombat(participant),
      icon: '🏹',
      label: 'Ranged Attack',
      description: 'Ranged Combat + Agility',
      colorClass: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      key: 'stealth',
      onClick: () => actions.stealth(participant),
      icon: '🥷',
      label: 'Stealth',
      description: 'Stealth + Agility',
      colorClass: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      key: 'scout',
      onClick: () => actions.scout(participant),
      icon: '👀',
      label: 'Scout',
      description: 'Scout + Awareness',
      colorClass: 'bg-teal-600 hover:bg-teal-700'
    },
    {
      key: 'survival',
      onClick: () => actions.survival(participant),
      icon: '🌿',
      label: 'Survival',
      description: 'Survival + Awareness',
      colorClass: 'bg-green-700 hover:bg-green-800'
    },
    {
      key: 'tech',
      onClick: () => actions.tech(participant),
      icon: '💻',
      label: 'Tech',
      description: 'Tech + Logic',
      colorClass: 'bg-cyan-600 hover:bg-cyan-700'
    },
    {
      key: 'force',
      onClick: () => actions.force(participant),
      icon: '💪',
      label: 'Force',
      description: 'Force + Strength',
      colorClass: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      key: 'endure',
      onClick: () => actions.endure(participant),
      icon: '🛡️',
      label: 'Endure',
      description: 'Endure + Stamina',
      colorClass: 'bg-stone-600 hover:bg-stone-700'
    },
    {
      key: 'manipulation',
      onClick: () => actions.manipulation(participant),
      icon: '🗣️',
      label: 'Manipulation',
      description: 'Manipulation + Empathy',
      colorClass: 'bg-violet-600 hover:bg-violet-700'
    },
    {
      key: 'firstAid',
      onClick: () => actions.firstAid(participant),
      icon: '🏥',
      label: 'First Aid',
      description: 'Medicine + Empathy',
      colorClass: 'bg-pink-600 hover:bg-pink-700'
    },
    {
      key: 'leadership',
      onClick: () => actions.leadership(participant),
      icon: '👥',
      label: 'Use Leadership',
      description: 'Leadership + Empathy',
      colorClass: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      key: 'overwatch',
      onClick: () => actions.overwatch(participant),
      icon: '👁️',
      label: 'Overwatch',
      description: 'No roll',
      colorClass: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      key: 'other',
      onClick: () => actions.other(participant),
      icon: '🔧',
      label: 'Other Action',
      description: 'No roll',
      colorClass: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Participant Status Display */}
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {participant.tokenImage && (
              <img 
                src={participant.tokenImage} 
                alt={participant.name}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
              />
            )}
            <div>
              <h4 className="font-bold text-white">{participant.name}</h4>
              <div className="text-sm text-gray-400">
                {participant.health}/{participant.maxHealth} HP • {participant.type}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {getCoverStatusIcon(participant.coverStatus)} {getCoverStatusText(participant.coverStatus)}
            </div>
            {participant.hasActed && (
              <div className="text-xs text-yellow-400 mt-1">✅ Already Acted</div>
            )}
          </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {actionButtons.map(({ key, ...buttonProps }) => (
          <ActionButton 
            key={key} 
            {...buttonProps} 
            disabled={participant.hasActed}
          />
        ))}
      </div>
    </div>
  );
};
