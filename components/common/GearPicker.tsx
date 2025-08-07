// GearPicker - Component for selecting gear from TWD RPG tables
import React, { useState, useMemo } from 'react';
import { GearItem, ALL_GEAR, getGearByType, searchGear, CLOSE_COMBAT_WEAPONS, RANGED_WEAPONS, ARMOR_TYPES } from '../../data/gearTables';

interface GearPickerProps {
  onSelectGear: (gear: GearItem) => void;
  onClose: () => void;
}

export const GearPicker: React.FC<GearPickerProps> = ({ onSelectGear, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weapons' | 'armor' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGear = useMemo(() => {
    let gear: GearItem[] = [];
    
    switch (activeTab) {
      case 'weapons':
        gear = [...CLOSE_COMBAT_WEAPONS, ...RANGED_WEAPONS];
        break;
      case 'armor':
        gear = ARMOR_TYPES;
        break;
      case 'general':
        gear = getGearByType('General');
        break;
      default:
        gear = ALL_GEAR;
    }

    if (searchQuery.trim()) {
      gear = gear.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.bonus && String(item.bonus).toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return gear;
  }, [activeTab, searchQuery]);

  const handleSelectGear = (gear: GearItem) => {
    onSelectGear(gear);
    onClose();
  };

  const getGearIcon = (gear: GearItem): string => {
    if (gear.type === 'CloseCombat') return '⚔️';
    if (gear.type === 'Ranged') return '🔫';
    if (gear.type === 'Armor') return '🛡️';
    return '🎒';
  };

  const formatGearDetails = (gear: GearItem): string => {
    const details = [];
    
    if ('damage' in gear && gear.damage > 0) {
      details.push(`${gear.damage} damage`);
    }
    
    if ('bonus' in gear && gear.bonus) {
      if (typeof gear.bonus === 'number') {
        details.push(`+${gear.bonus} bonus`);
      } else {
        details.push(gear.bonus);
      }
    }
    
    if ('armorLevel' in gear && gear.armorLevel) {
      details.push(`Armor ${gear.armorLevel}`);
    }
    
    if ('penalty' in gear && gear.penalty) {
      details.push(`${gear.penalty} penalty`);
    }
    
    if ('range' in gear && gear.range) {
      details.push(`${gear.range} range`);
    }
    
    if (gear.slots) {
      details.push(`${gear.slots} slots`);
    }

    return details.join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Select Equipment</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for weapons, armor, gear..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {([
            { key: 'all', label: 'All Gear' },
            { key: 'weapons', label: 'Weapons' },
            { key: 'armor', label: 'Armor' },
            { key: 'general', label: 'General' }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label} ({
                tab.key === 'all' ? ALL_GEAR.length :
                tab.key === 'weapons' ? CLOSE_COMBAT_WEAPONS.length + RANGED_WEAPONS.length :
                tab.key === 'armor' ? ARMOR_TYPES.length :
                getGearByType('General').length
              })
            </button>
          ))}
        </div>

        {/* Gear List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {filteredGear.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No gear found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredGear.map((gear, index) => (
                <button
                  key={`${gear.name}-${index}`}
                  onClick={() => handleSelectGear(gear)}
                  className="text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 hover:border-gray-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getGearIcon(gear)}</span>
                        <span className="font-medium text-white">{gear.name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-600 rounded-full text-gray-300">
                          {gear.type}
                        </span>
                      </div>
                      
                      {formatGearDetails(gear) && (
                        <p className="text-sm text-blue-300 mb-1">
                          {formatGearDetails(gear)}
                        </p>
                      )}
                      
                      {gear.description && (
                        <p className="text-xs text-gray-400 italic">
                          {gear.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-700 text-sm text-gray-400">
          <div>
            <p>💡 <strong>Tip:</strong> Foot or fist is always available for unarmed combat (1 damage)</p>
          </div>
          <div>
            {filteredGear.length} items
          </div>
        </div>
      </div>
    </div>
  );
};
