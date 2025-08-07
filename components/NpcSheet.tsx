import React, { useState, useCallback, useRef } from 'react';
import { NPC, Skill, SkillExpertise } from '../types';
import { useGameState } from '../context/GameStateContext';
import EditableField from './common/EditableField';
import { ALL_SKILLS } from '../constants';
import { UploadIcon } from './common/Icons';

interface NpcSheetProps {
  npc: NPC;
}

const NpcSheet: React.FC<NpcSheetProps> = ({ npc }) => {
  const { updateNpc } = useGameState();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingIssues, setEditingIssues] = useState(false);
  const [editingInventory, setEditingInventory] = useState(false);
  const [issuesText, setIssuesText] = useState(npc.issues.join(', '));
  const [inventoryText, setInventoryText] = useState(npc.inventory.join(', '));
  
  const handleUpdate = (updates: Partial<NPC>) => {
    updateNpc(npc.id, updates);
  };
  
  const handleIssuesSave = () => {
    const issuesArray = issuesText.split(',').map(item => item.trim()).filter(item => item.length > 0);
    handleUpdate({ issues: issuesArray });
    setEditingIssues(false);
  };
  
  const handleInventorySave = () => {
    const inventoryArray = inventoryText.split(',').map(item => item.trim()).filter(item => item.length > 0);
    handleUpdate({ inventory: inventoryArray });
    setEditingInventory(false);
  };
  
  const handleExpertiseChange = (skill: Skill, expertise: SkillExpertise) => {
    handleUpdate({
        skillExpertise: {
            ...npc.skillExpertise,
            [skill]: expertise
        }
    })
  };

  const handleTokenImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        updateNpc(npc.id, { tokenImage: base64Image });
      };
      reader.readAsDataURL(file);
    }
  };

  const tokenImageSrc = npc.tokenImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234A5568'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='%23E2E8F0' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
            <EditableField isEditing={true} value={npc.name} onChange={v => handleUpdate({name: v})} label="Name" inputClassName="font-bold"/>
            <EditableField isEditing={true} value={npc.archetype} onChange={v => handleUpdate({archetype: v})} label="Background" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!npc.isAnimal}
                    onChange={() => handleUpdate({ isAnimal: false })}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Human NPC</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={npc.isAnimal === true}
                    onChange={() => handleUpdate({ isAnimal: true, attackDice: npc.attackDice || 4, damage: npc.damage || '1' })}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-300">Animal</span>
                </label>
              </div>
            </div>
        </div>
        <div className="flex flex-col items-center gap-2">
            <img src={tokenImageSrc} alt="NPC Token" className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"/>
            <input type="file" ref={fileInputRef} onChange={handleTokenImageUpload} className="hidden" accept="image/*"/>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-md text-xs">
                <UploadIcon /> Change
            </button>
        </div>
      </div>
      
       <EditableField isEditing={true} value={npc.health} onChange={v => handleUpdate({health: Number(v)})} label="Health" type="number" />
      
      <div>
        <h4 className="text-md font-bold text-red-400 mb-2 flex items-center gap-2">
          Issues
          <button 
            onClick={() => {
              if (editingIssues) {
                handleIssuesSave();
              } else {
                setIssuesText(npc.issues.join(', '));
                setEditingIssues(true);
              }
            }}
            className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded"
          >
            {editingIssues ? 'Save' : 'Edit'}
          </button>
          {editingIssues && (
            <button 
              onClick={() => {
                setEditingIssues(false);
                setIssuesText(npc.issues.join(', '));
              }}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
            >
              Cancel
            </button>
          )}
        </h4>
        {editingIssues ? (
          <textarea
            value={issuesText}
            onChange={e => setIssuesText(e.target.value)}
            placeholder="Enter issues separated by commas..."
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            rows={3}
          />
        ) : (
          <div className="text-sm italic text-gray-300">{npc.issues.join(', ') || 'No issues listed'}</div>
        )}
      </div>
      
      <div>
        <h4 className="text-md font-bold text-red-400 mb-2 flex items-center gap-2">
          Inventory
          <button 
            onClick={() => {
              if (editingInventory) {
                handleInventorySave();
              } else {
                setInventoryText(npc.inventory.join(', '));
                setEditingInventory(true);
              }
            }}
            className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded"
          >
            {editingInventory ? 'Save' : 'Edit'}
          </button>
          {editingInventory && (
            <button 
              onClick={() => {
                setEditingInventory(false);
                setInventoryText(npc.inventory.join(', '));
              }}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
            >
              Cancel
            </button>
          )}
        </h4>
        {editingInventory ? (
          <textarea
            value={inventoryText}
            onChange={e => setInventoryText(e.target.value)}
            placeholder="Enter inventory items separated by commas..."
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            rows={3}
          />
        ) : (
          <div className="text-sm text-gray-300">{npc.inventory.join(', ') || 'No items'}</div>
        )}
      </div>

       {/* Animal Combat Stats or NPC Skills */}
       {npc.isAnimal ? (
         <div>
           <h4 className="text-md font-bold text-red-400 mb-2 mt-4">Animal Combat Stats</h4>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <EditableField 
               isEditing={true} 
               value={npc.attackDice || 0} 
               onChange={v => handleUpdate({attackDice: Number(v)})} 
               label="Attack Dice" 
               type="number" 
             />
             <EditableField 
               isEditing={true} 
               value={npc.damage || '1'} 
               onChange={v => handleUpdate({damage: v})} 
               label="Damage" 
               placeholder="e.g., 1, 2, 1 (+poison)"
             />
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Health</label>
               <div className="text-sm text-gray-400">{npc.health} (set above)</div>
             </div>
           </div>
           <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
             <p className="text-yellow-400 text-sm">
               <strong>Note:</strong> Animals don't use skill expertise. They fight using Attack Dice and deal the specified Damage.
               Use Scout rolls to track animals, but only roll dice for animals during combat.
             </p>
           </div>
         </div>
       ) : (
         <div>
           <h4 className="text-md font-bold text-red-400 mb-2 mt-4">Skill Expertise</h4>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
               {ALL_SKILLS.map(skill => (
                   <div key={skill} className="flex items-center justify-between">
                       <label className="text-sm text-gray-300">{skill}</label>
                       <select 
                           value={npc.skillExpertise[skill] || SkillExpertise.None} 
                           onChange={e => handleExpertiseChange(skill, e.target.value as SkillExpertise)}
                           className="bg-gray-800 text-sm rounded p-1"
                       >
                           <option value={SkillExpertise.None}>None (4)</option>
                           <option value={SkillExpertise.Trained}>Trained (5)</option>
                           <option value={SkillExpertise.Expert}>Expert (8)</option>
                           <option value={SkillExpertise.Master}>Master (10)</option>
                       </select>
                   </div>
               ))}
           </div>
         </div>
       )}
    </div>
  );
};

export default NpcSheet;