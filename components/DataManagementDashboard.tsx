


import React, { useState, useRef, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { Attribute, Skill, InventoryItem, RangeCategory, ArchetypeDefinition, Talent, Archetype } from '../types';
import { PlusIcon, TrashIcon } from './common/Icons';
import { ALL_SKILLS } from '../constants';
import InlineConfirmation from './common/InlineConfirmation';

const ArchetypeManager: React.FC = () => {
    const { gameState, addCustomArchetype, removeCustomArchetype } = useGameState();
    const [newArchetype, setNewArchetype] = useState<ArchetypeDefinition>({ name: '', keyAttribute: Attribute.Strength, keySkill: Skill.CloseCombat, description: '' });

    const handleAdd = () => {
        if (newArchetype.name.trim()) {
            addCustomArchetype(newArchetype);
            setNewArchetype({ name: '', keyAttribute: Attribute.Strength, keySkill: Skill.CloseCombat, description: '' });
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Manage Custom Archetypes</h3>
            <div className="space-y-2 mb-6 p-4 bg-gray-900/50 rounded-lg">
                <input
                    type="text"
                    placeholder="New Archetype Name"
                    value={newArchetype.name}
                    onChange={e => setNewArchetype({ ...newArchetype, name: e.target.value })}
                    className="w-full bg-gray-700 p-2 rounded"
                />
                <textarea
                    placeholder="Description"
                    value={newArchetype.description}
                    onChange={e => setNewArchetype({ ...newArchetype, description: e.target.value })}
                    className="w-full bg-gray-700 p-2 rounded"
                    rows={2}
                />
                <select
                    value={newArchetype.keyAttribute}
                    onChange={e => setNewArchetype({ ...newArchetype, keyAttribute: e.target.value as Attribute })}
                    className="w-full bg-gray-700 p-2 rounded"
                >
                    {Object.values(Attribute).map(attr => <option key={attr} value={attr}>{attr}</option>)}
                </select>
                <select
                    value={newArchetype.keySkill}
                    onChange={e => setNewArchetype({ ...newArchetype, keySkill: e.target.value as Skill })}
                    className="w-full bg-gray-700 p-2 rounded"
                >
                    {ALL_SKILLS.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                </select>
                <button onClick={handleAdd} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded">
                    Add Archetype
                </button>
            </div>

            <div className="space-y-2">
                {gameState.customArchetypes.map((arch, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-bold text-white">{arch.name}</p>
                            <p className="text-sm text-gray-400">Key Attr: {arch.keyAttribute} | Key Skill: {arch.keySkill}</p>
                        </div>
                        <InlineConfirmation question="Delete?" onConfirm={() => removeCustomArchetype(index)}>
                            {start => <button onClick={start} className="text-red-500 hover:text-red-400 p-2 rounded-full"><TrashIcon/></button>}
                        </InlineConfirmation>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const TalentManager: React.FC = () => {
    const { gameState, addCustomTalent, removeCustomTalent } = useGameState();
    const [newTalent, setNewTalent] = useState<Omit<Talent, 'id'>>({ name: '', description: ''});

    const handleAdd = () => {
        if(newTalent.name.trim()){
            addCustomTalent(newTalent);
            setNewTalent({name: '', description: ''});
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Manage Custom Talents</h3>
             <div className="space-y-2 mb-6 p-4 bg-gray-900/50 rounded-lg">
                 <input
                    type="text"
                    placeholder="New Talent Name"
                    value={newTalent.name}
                    onChange={e => setNewTalent({ ...newTalent, name: e.target.value })}
                    className="w-full bg-gray-700 p-2 rounded"
                />
                 <textarea
                    placeholder="Description"
                    value={newTalent.description}
                    onChange={e => setNewTalent({ ...newTalent, description: e.target.value })}
                    className="w-full bg-gray-700 p-2 rounded"
                    rows={3}
                />
                 <input
                    type="text"
                    placeholder="Archetype (optional, e.g. 'Soldier' or a custom name)"
                    value={newTalent.archetype || ''}
                    onChange={e => setNewTalent({ ...newTalent, archetype: e.target.value })}
                    className="w-full bg-gray-700 p-2 rounded"
                />
                 <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Bonus"
                        value={newTalent.bonus || ''}
                        onChange={e => setNewTalent({ ...newTalent, bonus: Number(e.target.value) || undefined })}
                        className="w-1/3 bg-gray-700 p-2 rounded"
                    />
                     <select
                        value={newTalent.skillAffected || ''}
                        onChange={e => setNewTalent({ ...newTalent, skillAffected: e.target.value as Skill })}
                        className="w-2/3 bg-gray-700 p-2 rounded"
                        disabled={!newTalent.bonus}
                    >
                        <option value="">-- No Specific Skill --</option>
                        {ALL_SKILLS.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                    </select>
                 </div>
                 <button onClick={handleAdd} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded">
                    Add Talent
                </button>
            </div>
             <div className="space-y-2">
                {gameState.customTalents.map((talent, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-bold text-white">{talent.name}</p>
                            <p className="text-sm text-gray-400">{talent.description}</p>
                        </div>
                         <InlineConfirmation question="Delete?" onConfirm={() => removeCustomTalent(index)}>
                            {start => <button onClick={start} className="text-red-500 hover:text-red-400 p-2 rounded-full"><TrashIcon/></button>}
                        </InlineConfirmation>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const ItemManager: React.FC = () => {
    const { gameState, addCustomItem, removeCustomItem } = useGameState();
    const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'|'equipped'>>({name: '', slots: 1});

    const handleAdd = () => {
        if(newItem.name.trim()){
            addCustomItem(newItem);
            setNewItem({name: '', slots: 1});
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Manage Custom Items</h3>
            <div className="space-y-2 mb-6 p-4 bg-gray-900/50 rounded-lg">
                <input
                    type="text"
                    placeholder="New Item Name"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-gray-700 p-2 rounded"
                />
                <textarea
                    placeholder="Description"
                    value={newItem.description || ''}
                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full bg-gray-700 p-2 rounded"
                    rows={2}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                     <select value={newItem.type || 'Gear'} onChange={e => setNewItem({...newItem, type: e.target.value as InventoryItem['type']})} className="bg-gray-700 p-2 rounded">
                        <option>Gear</option><option>Close</option><option>Ranged</option><option>Armor</option><option>Explosive</option>
                    </select>
                    <select value={newItem.range || ''} onChange={e => setNewItem({...newItem, range: e.target.value as RangeCategory})} className="bg-gray-700 p-2 rounded">
                        <option value="">-- Range --</option>
                        {Object.values(RangeCategory).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input type="number" placeholder="Slots" value={newItem.slots} onChange={e => setNewItem({...newItem, slots: Number(e.target.value)})} className="bg-gray-700 p-2 rounded" />
                    <input type="number" placeholder="Bonus" value={newItem.bonus || ''} onChange={e => setNewItem({...newItem, bonus: Number(e.target.value) || undefined})} className="bg-gray-700 p-2 rounded" />
                    <input type="number" placeholder="Damage" value={newItem.damage || ''} onChange={e => setNewItem({...newItem, damage: Number(e.target.value) || undefined})} className="bg-gray-700 p-2 rounded" />
                    <input type="number" placeholder="Armor Lvl" value={newItem.armorLevel || ''} onChange={e => setNewItem({...newItem, armorLevel: Number(e.target.value) || undefined})} className="bg-gray-700 p-2 rounded" />
                </div>
                <button onClick={handleAdd} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded">
                    Add Item
                </button>
            </div>
             <div className="space-y-2">
                {gameState.customItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-sm text-gray-400">Type: {item.type || 'Gear'}, Slots: {item.slots}</p>
                        </div>
                        <InlineConfirmation question="Delete?" onConfirm={() => removeCustomItem(index)}>
                            {start => <button onClick={start} className="text-red-500 hover:text-red-400 p-2 rounded-full"><TrashIcon/></button>}
                        </InlineConfirmation>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const SessionManagement: React.FC = () => {
    const { saveSession, loadSession } = useGameState();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
        setFeedback({ message, type });
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            setFeedback(null);
            timeoutRef.current = null;
        }, 4000);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    const success = loadSession(content);
                    if (success) {
                        showFeedback('Session loaded successfully!');
                    } else {
                        showFeedback('Failed to load. File may be invalid.', 'error');
                    }
                }
            };
            reader.readAsText(file);
             // Reset file input to allow loading the same file again
            if(event.target) event.target.value = '';
        }
    };
    
    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSaveClick = () => {
        saveSession();
        showFeedback('Session file download started!');
    };

    const feedbackColor = feedback?.type === 'success' 
        ? 'bg-green-600/80' 
        : 'bg-red-600/80';

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Session Management</h3>
            <p className="text-sm text-gray-400 mb-4">Save your current game state to a file, or load a previous session to continue your story.</p>
            <div className="relative pb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={handleSaveClick}
                        className="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-colors"
                    >
                        Save Session
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".json" 
                    />
                    <button 
                        onClick={handleLoadClick} 
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
                    >
                        Load Session
                    </button>
                </div>
                {feedback && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-max max-w-full px-2">
                         <p className={`${feedbackColor} backdrop-blur-sm text-white text-sm font-semibold py-1 px-4 rounded-full animate-fade-in shadow-lg`}>
                            {feedback.message}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};

const DataManagementDashboard: React.FC = () => {
    const { isEditMode } = useGameState();
    const [activeTab, setActiveTab] = useState<'session' | 'archetypes' | 'talents' | 'items'>('session');

    return (
        <div className="space-y-6">
             <Card>
                <h2 className="text-2xl font-bold text-red-500 mb-2">Data & Session Management</h2>
                <p className="text-gray-400 mb-4">Save/Load your game session. In Edit Mode, you can also create custom archetypes, talents, and items.</p>

                <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6 flex-wrap">
                    <button onClick={() => setActiveTab('session')} className={`flex-1 min-w-max py-2 px-3 text-sm font-bold rounded-md transition-colors ${activeTab === 'session' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        Session
                    </button>
                    <button onClick={() => setActiveTab('archetypes')} disabled={!isEditMode} className={`flex-1 min-w-max py-2 px-3 text-sm font-bold rounded-md transition-colors ${activeTab === 'archetypes' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        Archetypes
                    </button>
                    <button onClick={() => setActiveTab('talents')} disabled={!isEditMode} className={`flex-1 min-w-max py-2 px-3 text-sm font-bold rounded-md transition-colors ${activeTab === 'talents' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        Talents
                    </button>
                    <button onClick={() => setActiveTab('items')} disabled={!isEditMode} className={`flex-1 min-w-max py-2 px-3 text-sm font-bold rounded-md transition-colors ${activeTab === 'items' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        Items
                    </button>
                </div>

                {activeTab === 'session' && <SessionManagement />}
                {activeTab === 'archetypes' && isEditMode && <ArchetypeManager />}
                {activeTab === 'talents' && isEditMode && <TalentManager />}
                {activeTab === 'items' && isEditMode && <ItemManager />}

             </Card>
        </div>
    );
};

export default DataManagementDashboard;