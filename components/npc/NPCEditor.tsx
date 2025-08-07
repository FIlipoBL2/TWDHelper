// NPCEditor - Comprehensive NPC editing component with inventory, skills, and issues management
import React, { useState, useCallback, useRef } from 'react';
import { NPC, Skill, SkillExpertise, InventoryItem } from '../../types';
import { useGameState } from '../../context/GameStateContext';
import { TrashIcon, PlusIcon, UploadIcon } from '../common/Icons';
import InlineConfirmation from '../common/InlineConfirmation';
import { GearPicker } from '../common/GearPicker';
import { GearItem, ensureUnarmedCombat } from '../../data/gearTables';

// Eye icons for secret issues toggle
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

interface NPCEditorProps {
  npc: NPC;
  onClose: () => void;
}

export const NPCEditor: React.FC<NPCEditorProps> = ({ npc, onClose }) => {
  const { updateNpc } = useGameState();
  const [editedNPC, setEditedNPC] = useState<NPC>({ ...npc });
  const [activeTab, setActiveTab] = useState<'basic' | 'skills' | 'inventory' | 'issues'>('basic');
  const [showSecretIssues, setShowSecretIssues] = useState(false);
  const [newIssue, setNewIssue] = useState('');
  const [newInventoryItem, setNewInventoryItem] = useState('');
  const [showGearPicker, setShowGearPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure unarmed combat is always available
  const getInventoryWithUnarmed = useCallback((inventory: string[]): string[] => {
    const hasUnarmed = inventory.some(item => 
      item.toLowerCase().includes('unarmed') || 
      item.toLowerCase().includes('foot or fist') ||
      item.toLowerCase().includes('fist') || 
      item.toLowerCase().includes('bare hands')
    );
    
    if (!hasUnarmed) {
      return ['Foot or fist (1 damage, Close Combat)', ...inventory];
    }
    return inventory;
  }, []);

  const handleSave = useCallback(() => {
    // Ensure unarmed combat is included
    const finalNPC = {
      ...editedNPC,
      inventory: getInventoryWithUnarmed(editedNPC.inventory)
    };
    
    updateNpc(finalNPC.id, finalNPC);
    onClose();
  }, [editedNPC, updateNpc, onClose, getInventoryWithUnarmed]);

  const handleBasicFieldChange = useCallback((field: keyof NPC, value: any) => {
    setEditedNPC(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSkillChange = useCallback((skill: Skill, expertise: SkillExpertise) => {
    setEditedNPC(prev => ({
      ...prev,
      skillExpertise: {
        ...prev.skillExpertise,
        [skill]: expertise
      }
    }));
  }, []);

  const handleAddIssue = useCallback(() => {
    if (newIssue.trim()) {
      setEditedNPC(prev => ({
        ...prev,
        issues: [...prev.issues, newIssue.trim()]
      }));
      setNewIssue('');
    }
  }, [newIssue]);

  const handleRemoveIssue = useCallback((index: number) => {
    setEditedNPC(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  }, []);

  const handleAddInventoryItem = useCallback(() => {
    if (newInventoryItem.trim()) {
      setEditedNPC(prev => ({
        ...prev,
        inventory: [...prev.inventory, newInventoryItem.trim()]
      }));
      setNewInventoryItem('');
    }
  }, [newInventoryItem]);

  const handleGearSelection = useCallback((gear: GearItem) => {
    const gearDescription = `${gear.name} (${gear.damage ? `${gear.damage} damage` : ''}${gear.bonus ? `+${gear.bonus} bonus` : ''}${gear.armorLevel ? `AR ${gear.armorLevel}` : ''}${gear.type ? `, ${gear.type}` : ''})`.replace(/\(\s*\)/g, '');
    
    setEditedNPC(prev => ({
      ...prev,
      inventory: [...prev.inventory, gearDescription]
    }));
    setShowGearPicker(false);
  }, []);

  const handleTokenImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setEditedNPC(prev => ({
          ...prev,
          tokenImage: base64Image
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveInventoryItem = useCallback((index: number) => {
    setEditedNPC(prev => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index)
    }));
  }, []);

  const skills = Object.values(Skill).filter(skill => skill !== Skill.ManualRoll);
  const expertiseLevels = Object.values(SkillExpertise);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Edit {editedNPC.name}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {(['basic', 'skills', 'inventory', 'issues'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={editedNPC.name}
                  onChange={(e) => handleBasicFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Archetype</label>
                <input
                  type="text"
                  value={editedNPC.archetype}
                  onChange={(e) => handleBasicFieldChange('archetype', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Health</label>
                  <input
                    type="number"
                    value={editedNPC.health}
                    onChange={(e) => handleBasicFieldChange('health', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Health</label>
                  <input
                    type="number"
                    value={editedNPC.maxHealth}
                    onChange={(e) => handleBasicFieldChange('maxHealth', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editedNPC.isCompanion || false}
                    onChange={(e) => handleBasicFieldChange('isCompanion', e.target.checked)}
                    className="form-checkbox text-blue-600"
                  />
                  <span className="text-gray-300">Is Companion</span>
                </label>
              </div>

              {/* Token Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Token Image</label>
                <div className="flex items-center space-x-4">
                  {editedNPC.tokenImage && (
                    <div className="relative">
                      <img 
                        src={editedNPC.tokenImage} 
                        alt={`${editedNPC.name} token`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={() => setEditedNPC(prev => ({ ...prev, tokenImage: undefined }))}
                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTokenImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <UploadIcon />
                      <span>{editedNPC.tokenImage ? 'Change Token' : 'Upload Token'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Upload an image to use as this character's token on the battlemap
                </p>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white mb-4">Skills & Expertise</h4>
              <div className="grid grid-cols-1 gap-3">
                {skills.map(skill => (
                  <div key={skill} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-white font-medium">{skill}</span>
                    <select
                      value={editedNPC.skillExpertise[skill] || SkillExpertise.None}
                      onChange={(e) => handleSkillChange(skill, e.target.value as SkillExpertise)}
                      className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white"
                    >
                      {expertiseLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white mb-4">Inventory & Equipment</h4>
              
              {/* Add new item buttons */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInventoryItem}
                  onChange={(e) => setNewInventoryItem(e.target.value)}
                  placeholder="Add custom item..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddInventoryItem()}
                />
                <button
                  onClick={handleAddInventoryItem}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"
                  title="Add custom item"
                >
                  <PlusIcon />
                  Custom
                </button>
                <button
                  onClick={() => setShowGearPicker(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"
                  title="Choose from gear tables"
                >
                  <PlusIcon />
                  Gear
                </button>
              </div>

              {/* Gear Picker Modal */}
              {showGearPicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onClick={() => setShowGearPicker(false)}>
                  <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-gray-700">
                      <h3 className="text-xl font-bold text-white">Choose Equipment</h3>
                      <button 
                        onClick={() => setShowGearPicker(false)}
                        className="text-gray-400 hover:text-white text-2xl"
                      >
                        ×
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-[70vh]">
                      <GearPicker onGearSelect={handleGearSelection} />
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory items */}
              <div className="space-y-2">
                {getInventoryWithUnarmed(editedNPC.inventory).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-white">{item}</span>
                      {(item.toLowerCase().includes('unarmed') || item.toLowerCase().includes('foot or fist')) && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {!(item.toLowerCase().includes('unarmed') || item.toLowerCase().includes('foot or fist')) && (
                      <InlineConfirmation
                        question="Remove?"
                        onConfirm={() => handleRemoveInventoryItem(index)}
                      >
                        {(startConfirmation) => (
                          <button
                            onClick={startConfirmation}
                            className="text-gray-400 hover:text-red-400 p-2"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </InlineConfirmation>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Equipment Notes:</strong> NPCs automatically have unarmed combat available (1 damage, Close Combat skill). 
                  Add specific weapons, armor, and gear as needed. Weapons should specify damage and skill required.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Issues & Complications</h4>
                <button
                  onClick={() => setShowSecretIssues(!showSecretIssues)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                    showSecretIssues 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                  }`}
                >
                  {showSecretIssues ? <EyeSlashIcon /> : <EyeIcon />}
                  {showSecretIssues ? 'Hide Secret Issues' : 'Show Secret Issues'}
                </button>
              </div>
              
              {/* Add new issue */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  placeholder="Add character issue or complication..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIssue()}
                />
                <button
                  onClick={handleAddIssue}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  <PlusIcon />
                </button>
              </div>

              {/* Issues list */}
              <div className="space-y-2">
                {editedNPC.issues.map((issue, index) => {
                  const isSecret = issue.toLowerCase().includes('secret') || issue.startsWith('*');
                  
                  if (isSecret && !showSecretIssues) {
                    return (
                      <div key={index} className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-red-400 italic">*** Secret Issue Hidden ***</span>
                          <InlineConfirmation
                            question="Remove?"
                            onConfirm={() => handleRemoveIssue(index)}
                          >
                            {(startConfirmation) => (
                              <button
                                onClick={startConfirmation}
                                className="text-gray-400 hover:text-red-400 p-2"
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </InlineConfirmation>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                      isSecret ? 'bg-red-900/30 border border-red-500/50' : 'bg-gray-700/50'
                    }`}>
                      <span className={isSecret ? 'text-red-300' : 'text-white'}>{issue}</span>
                      <InlineConfirmation
                        question="Remove?"
                        onConfirm={() => handleRemoveIssue(index)}
                      >
                        {(startConfirmation) => (
                          <button
                            onClick={startConfirmation}
                            className="text-gray-400 hover:text-red-400 p-2"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </InlineConfirmation>
                    </div>
                  );
                })}
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Secret Issues:</strong> Mark issues as secret by starting with "*" or including "secret" in the text. 
                  These are only visible when "Show Secret Issues" is enabled, useful for GM-only information.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
