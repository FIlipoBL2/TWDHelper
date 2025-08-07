

import React, { useState, useMemo } from 'react';
import { Character, InventoryItem, RangeCategory, Skill, Vehicle } from '../types';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { TrashIcon, PlusIcon } from './common/Icons';
import { 
    ARMOR_DEFINITIONS,
    GENERAL_GEAR_DEFINITIONS,
    CLOSE_COMBAT_WEAPONS_DEFINITIONS,
    RANGED_WEAPONS_DEFINITIONS,
    EXPLOSIVE_WEAPONS_DEFINITIONS,
    VEHICLE_DEFINITIONS
} from '../constants';
import InlineConfirmation from './common/InlineConfirmation';

interface InventoryProps {
  character: Character;
}

type AddableTemplate = {
  name: string;
  category: string;
  templateType: 'Item' | 'Vehicle';
  template: any;
}

const CATEGORIES = ['All', 'Close Combat', 'Ranged', 'Explosive', 'Armor', 'Gear', 'Vehicle'];
const ITEMS_PER_PAGE = 10;

const Inventory: React.FC<InventoryProps> = ({ character }) => {
  const { gameState, isEditMode, toggleItemEquipped, addInventoryItem, updateInventoryItem, removeInventoryItem, addVehicle, updateVehicle, removeVehicle } = useGameState();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [showAllItems, setShowAllItems] = useState(false);

  const totalSlots = character.attributes.Strength + 2;
  const usedSlots = character.inventory.reduce((acc, item) => acc + item.slots, 0);

  const allAddableTemplates = useMemo((): AddableTemplate[] => {
    return [
      ...GENERAL_GEAR_DEFINITIONS.map(i => ({ name: i.name, category: 'Gear', templateType: 'Item' as const, template: i })),
      ...CLOSE_COMBAT_WEAPONS_DEFINITIONS.map(i => ({ name: i.name, category: 'Close Combat', templateType: 'Item' as const, template: i })),
      ...RANGED_WEAPONS_DEFINITIONS.map(i => ({ name: i.name, category: 'Ranged', templateType: 'Item' as const, template: i })),
      ...EXPLOSIVE_WEAPONS_DEFINITIONS.map(i => ({ name: i.name, category: 'Explosive', templateType: 'Item' as const, template: i })),
      ...ARMOR_DEFINITIONS.map(i => ({ name: i.name, category: 'Armor', templateType: 'Item' as const, template: i })),
      ...VEHICLE_DEFINITIONS.map(v => ({ name: v.name, category: 'Vehicle', templateType: 'Vehicle' as const, template: v })),
      ...gameState.customItems.map(i => ({ name: i.name, category: i.type || 'Gear', templateType: 'Item' as const, template: i })),
    ];
  }, [gameState.customItems]);

  const filteredItems = useMemo(() => {
    let items = allAddableTemplates;

    if (activeCategory !== 'All') {
      items = items.filter(item => {
        if(item.template.type === 'Close') return activeCategory === 'Close Combat';
        return item.category === activeCategory
      });
    }

    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, allAddableTemplates, activeCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const displayedItems = useMemo(() => {
    if (showAllItems) return filteredItems;
    
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage, showAllItems]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(0);
    setShowAllItems(false);
  }, [searchQuery, activeCategory]);

  const handleAddTemplate = (item: AddableTemplate) => {
    if (item.templateType === 'Item') {
      addInventoryItem(character.id, item.template);
    } else if (item.templateType === 'Vehicle') {
      addVehicle(character.id, item.template);
    }
    setSearchQuery('');
    setCurrentPage(0);
    setShowAllItems(false);
  };

  const renderItemDetails = (item: InventoryItem) => {
    const parts: string[] = [];
    if (item.damage) parts.push(`${item.damage} Dmg`);
    if (item.blastPower) parts.push(`BP ${item.blastPower}`);
    if (item.bonus) parts.push(`+${item.bonus} ${item.skillAffected || ''}`.trim());
    if (item.armorLevel) parts.push(`${item.armorLevel} Armor`);
    if (item.range) parts.push(item.range);
    if (item.poisonLevel) parts.push(`🧪Poison ${item.poisonLevel}`);
    if (item.isIncendiary) parts.push('🔥Incendiary');
    
    const details = parts.join(', ');
    return details || '—';
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-red-500">Inventory & Gear</h3>
        <div className="text-sm text-gray-400 font-medium">
          Slots: <span className={`font-bold ${usedSlots > totalSlots ? 'text-red-500' : 'text-white'}`}>{usedSlots}</span> / {totalSlots}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th className="p-2">Equip</th>
              <th className="p-2 w-1/3">Item</th>
              <th className="p-2 w-2/3">Details</th>
              <th className="p-2">Slots</th>
              {isEditMode && <th className="p-2"></th>}
            </tr>
          </thead>
          <tbody>
            {character.inventory.map((item) => (
              <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/30 align-top">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={item.equipped}
                    onChange={() => toggleItemEquipped(character.id, item.id)}
                    className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-red-600 focus:ring-red-500"
                  />
                </td>
                <td className="p-2 font-medium">
                  {isEditMode ? (
                    <input type="text" value={item.name} onChange={(e) => updateInventoryItem(character.id, item.id, { name: e.target.value })} className="bg-gray-900 w-full rounded p-1" />
                  ) : (
                    <span className="text-white">{item.name}</span>
                  )}
                </td>
                <td className="p-2">
                   {isEditMode ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                           <select value={item.type || 'Gear'} onChange={e => updateInventoryItem(character.id, item.id, {type: e.target.value as InventoryItem['type']})} className="bg-gray-900 rounded p-1">
                                <option>Gear</option><option>Close</option><option>Ranged</option><option>Armor</option><option>Explosive</option>
                           </select>
                           <select value={item.range || ''} onChange={e => updateInventoryItem(character.id, item.id, {range: e.target.value as RangeCategory})} className="bg-gray-900 rounded p-1">
                               <option value="">-- Range --</option>
                               {Object.values(RangeCategory).map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                           <input placeholder="Dmg" type="number" value={item.damage || ''} onChange={e => updateInventoryItem(character.id, item.id, {damage: Number(e.target.value) || undefined})} className="bg-gray-900 rounded p-1 w-full" />
                           <input placeholder="Bonus" type="number" value={item.bonus || ''} onChange={e => updateInventoryItem(character.id, item.id, {bonus: Number(e.target.value) || undefined})} className="bg-gray-900 rounded p-1 w-full" />
                           <input placeholder="Armor" type="number" value={item.armorLevel || ''} onChange={e => updateInventoryItem(character.id, item.id, {armorLevel: Number(e.target.value) || undefined})} className="bg-gray-900 rounded p-1 w-full" />
                           <input placeholder="BP" type="number" value={item.blastPower || ''} onChange={e => updateInventoryItem(character.id, item.id, {blastPower: Number(e.target.value) || undefined})} className="bg-gray-900 rounded p-1 w-full" />
                           <input placeholder="Poison" type="number" value={item.poisonLevel || ''} onChange={e => updateInventoryItem(character.id, item.id, {poisonLevel: Number(e.target.value) || undefined})} className="bg-gray-900 rounded p-1 w-full" />
                           <label className="flex items-center text-xs">
                               <input type="checkbox" checked={item.isIncendiary || false} onChange={e => updateInventoryItem(character.id, item.id, {isIncendiary: e.target.checked})} className="mr-1" />
                               Incendiary
                           </label>
                        </div>
                   ) : (
                    <span className="text-gray-300 text-sm">{renderItemDetails(item)}</span>
                   )}
                </td>
                <td className="p-2 text-center">
                   {isEditMode ? (
                    <input type="number" step="0.5" value={item.slots} onChange={(e) => updateInventoryItem(character.id, item.id, { slots: Number(e.target.value) })} className="bg-gray-900 w-16 rounded p-1 text-center" />
                  ) : (
                    <span className="text-gray-300">{item.slots}</span>
                  )}
                </td>
                {isEditMode && (
                  <td className="p-2 text-center">
                    <InlineConfirmation question="Delete?" onConfirm={() => removeInventoryItem(character.id, item.id)}>
                        {start => (
                            <button onClick={start} className="text-red-500 hover:text-red-400">
                                <TrashIcon />
                            </button>
                        )}
                    </InlineConfirmation>
                  </td>
                )}
              </tr>
            ))}
             {character.inventory.length === 0 && !isEditMode && (
              <tr><td colSpan={isEditMode ? 5 : 4} className="text-center p-4 text-gray-500">No items in inventory.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vehicles Section */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-lg font-bold text-red-400 mb-2">Vehicles</h4>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                <tr>
                  <th className="p-2 w-1/4">Vehicle</th>
                  <th className="p-2 text-center">Maneuver</th>
                  <th className="p-2 text-center">Damage</th>
                  <th className="p-2 text-center">Hull</th>
                  <th className="p-2 text-center">Armor</th>
                  <th className="p-2 w-1/3">Issue</th>
                  {isEditMode && <th className="p-2"></th>}
                </tr>
              </thead>
              <tbody>
                {character.vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="p-2 font-medium">
                      {isEditMode ? <input value={vehicle.name} onChange={e => updateVehicle(character.id, vehicle.id, { name: e.target.value })} className="bg-gray-900 w-full rounded p-1" /> : <span className="text-white">{vehicle.name}</span>}
                    </td>
                    <td className="p-2 text-center">
                      {isEditMode ? <input type="number" value={vehicle.maneuverability} onChange={e => updateVehicle(character.id, vehicle.id, { maneuverability: Number(e.target.value)})} className="bg-gray-900 w-12 rounded p-1 text-center" /> : <span>{vehicle.maneuverability}</span>}
                    </td>
                    <td className="p-2 text-center">
                      {isEditMode ? <input type="number" value={vehicle.damage} onChange={e => updateVehicle(character.id, vehicle.id, { damage: Number(e.target.value)})} className="bg-gray-900 w-12 rounded p-1 text-center" /> : <span>{vehicle.damage}</span>}
                    </td>
                    <td className="p-2 text-center">
                      {isEditMode ? <input type="number" value={vehicle.hull} onChange={e => updateVehicle(character.id, vehicle.id, { hull: Number(e.target.value)})} className="bg-gray-900 w-12 rounded p-1 text-center" /> : <span>{vehicle.hull}</span>}
                    </td>
                    <td className="p-2 text-center">
                      {isEditMode ? <input type="number" value={vehicle.armor} onChange={e => updateVehicle(character.id, vehicle.id, { armor: Number(e.target.value)})} className="bg-gray-900 w-12 rounded p-1 text-center" /> : <span>{vehicle.armor}</span>}
                    </td>
                    <td className="p-2">
                       {isEditMode ? <input value={vehicle.issue} onChange={e => updateVehicle(character.id, vehicle.id, { issue: e.target.value })} className="bg-gray-900 w-full rounded p-1" /> : <span className="text-sm text-gray-300 italic">{vehicle.issue}</span>}
                    </td>
                    {isEditMode && (
                        <td className="p-2 text-center">
                             <InlineConfirmation question="Delete?" onConfirm={() => removeVehicle(character.id, vehicle.id)}>
                                {start => (
                                    <button onClick={start} className="text-red-500 hover:text-red-400">
                                        <TrashIcon />
                                    </button>
                                )}
                            </InlineConfirmation>
                        </td>
                    )}
                  </tr>
                ))}
                 {character.vehicles.length === 0 && !isEditMode && (
                  <tr><td colSpan={isEditMode ? 7 : 6} className="text-center p-4 text-gray-500">No vehicles owned.</td></tr>
                )}
              </tbody>
           </table>
        </div>
      </div>


       {isEditMode && (
        <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
          <h4 className="text-lg font-semibold text-gray-300 mb-2">Add to Inventory</h4>
          
          <div className="flex flex-wrap gap-2 mb-3">
              {CATEGORIES.map(category => (
                  <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                          activeCategory === category
                              ? 'bg-red-700 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                  >
                      {category}
                  </button>
              ))}
          </div>

          <input
              type="text"
              placeholder={`Search within ${activeCategory}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 p-3 rounded-md text-white placeholder-gray-400"
          />
          
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">
                {showAllItems ? `Showing all ${filteredItems.length} items` : `Showing ${displayedItems.length} of ${filteredItems.length} items`}
              </span>
              {filteredItems.length > ITEMS_PER_PAGE && (
                <button
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                >
                  {showAllItems ? 'Show Pages' : 'Show All'}
                </button>
              )}
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {displayedItems.length > 0 ? (
                  <ul className="space-y-1">
                      {displayedItems.map(item => (
                          <li
                              key={item.name + item.category}
                              onClick={() => handleAddTemplate(item)}
                              className="p-2 hover:bg-red-700 cursor-pointer flex justify-between items-center rounded-md transition-colors"
                          >
                              <div>
                                  <span className="font-medium text-white">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{item.category}</span>
                                <PlusIcon />
                              </div>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-center text-gray-500 p-4">No items found.</p>
              )}
            </div>

            {/* Pagination Controls */}
            {!showAllItems && totalPages > 1 && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Previous
                </button>
                
                <span className="text-xs text-gray-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => addInventoryItem(character.id)} className="flex-1 bg-gray-800/50 hover:bg-gray-800/80 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
              Add Custom Item
            </button>
             <button onClick={() => addVehicle(character.id)} className="flex-1 bg-gray-800/50 hover:bg-gray-800/80 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
              Add Custom Vehicle
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Inventory;