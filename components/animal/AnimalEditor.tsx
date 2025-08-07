// AnimalEditor - Comprehensive animal editing component with token upload
import React, { useState, useCallback, useRef } from 'react';
import { NPC } from '../../types';
import { useGameState } from '../../context/GameStateContext';
import { TrashIcon, UploadIcon } from '../common/Icons';
import InlineConfirmation from '../common/InlineConfirmation';

interface AnimalEditorProps {
  animal: NPC;
  onClose: () => void;
}

export const AnimalEditor: React.FC<AnimalEditorProps> = ({ animal, onClose }) => {
  const { updateNpc } = useGameState();
  const [editedAnimal, setEditedAnimal] = useState<NPC>({ ...animal });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    updateNpc(editedAnimal.id, editedAnimal);
    onClose();
  }, [editedAnimal, updateNpc, onClose]);

  const handleFieldChange = useCallback((field: keyof NPC, value: any) => {
    setEditedAnimal(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleTokenImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        setEditedAnimal(prev => ({
          ...prev,
          tokenImage: base64Image
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Edit {editedAnimal.name}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={editedAnimal.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type/Species</label>
            <input
              type="text"
              value={editedAnimal.archetype}
              onChange={(e) => handleFieldChange('archetype', e.target.value)}
              placeholder="e.g., Wolf, Bear, Dog"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          {/* Health */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Health</label>
              <input
                type="number"
                value={editedAnimal.health}
                onChange={(e) => handleFieldChange('health', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Health</label>
              <input
                type="number"
                value={editedAnimal.maxHealth}
                onChange={(e) => handleFieldChange('maxHealth', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Combat Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Attack Dice</label>
              <input
                type="number"
                value={editedAnimal.attackDice || 2}
                onChange={(e) => handleFieldChange('attackDice', parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Damage</label>
              <input
                type="text"
                value={editedAnimal.damage || '1'}
                onChange={(e) => handleFieldChange('damage', e.target.value)}
                placeholder="e.g., 1, 2, 1 (+poison)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Token Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Token Image</label>
            <div className="flex items-center space-x-4">
              {editedAnimal.tokenImage && (
                <div className="relative">
                  <img 
                    src={editedAnimal.tokenImage} 
                    alt={`${editedAnimal.name} token`}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                  />
                  <button
                    onClick={() => setEditedAnimal(prev => ({ ...prev, tokenImage: undefined }))}
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
                  <span>{editedAnimal.tokenImage ? 'Change Token' : 'Upload Token'}</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Upload an image to use as this animal's token on the battlemap
            </p>
          </div>

          {/* Haven Status */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editedAnimal.isInHaven || false}
                onChange={(e) => handleFieldChange('isInHaven', e.target.checked)}
                className="form-checkbox text-blue-600"
              />
              <span className="text-gray-300">In Haven</span>
            </label>
          </div>
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
