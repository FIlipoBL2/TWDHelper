

import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { Faction } from '../types';
import Card from './common/Card';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon } from './common/Icons';
import InlineConfirmation from './common/InlineConfirmation';

const FactionDashboard: React.FC = () => {
    const { gameState, isEditMode, addFaction, updateFaction, removeFaction } = useGameState();
    const { factions } = gameState;
    const [newFaction, setNewFaction] = useState<Omit<Faction, 'id'>>({ name: '', size: 10, type: 'Survivors', leadership: 'Council', assets: '', needs: '', issues: [], endgame_example: '' });
    const [editingFactionId, setEditingFactionId] = useState<string | null>(null);

    const handleAddFaction = () => {
        if (newFaction.name.trim()) {
            addFaction(newFaction);
            setNewFaction({ name: '', size: 10, type: 'Survivors', leadership: 'Council', assets: '', needs: '', issues: [], endgame_example: '' });
        }
    };

    const FactionForm: React.FC<{ faction: Omit<Faction, 'id'> | Faction, setFaction: Function, onSave: () => void, isEditing: boolean }> = ({ faction, setFaction, onSave, isEditing }) => {
        return (
            <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg">
                <input type="text" placeholder="Faction Name" value={faction.name} onChange={e => setFaction({ ...faction, name: e.target.value })} className="w-full bg-gray-700 p-2 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="text" placeholder="Size" value={faction.size} onChange={e => setFaction({ ...faction, size: e.target.value })} className="w-full bg-gray-700 p-2 rounded" />
                    <input type="text" placeholder="Type (e.g., Cult, Raiders)" value={faction.type} onChange={e => setFaction({ ...faction, type: e.target.value })} className="w-full bg-gray-700 p-2 rounded" />
                    <input type="text" placeholder="Leadership (e.g., Tyrant)" value={faction.leadership} onChange={e => setFaction({ ...faction, leadership: e.target.value })} className="w-full bg-gray-700 p-2 rounded" />
                </div>
                <textarea placeholder="Assets (comma-separated)" value={faction.assets} onChange={e => setFaction({ ...faction, assets: e.target.value })} className="w-full bg-gray-700 p-2 rounded" rows={2} />
                <textarea placeholder="Needs (comma-separated)" value={faction.needs} onChange={e => setFaction({ ...faction, needs: e.target.value })} className="w-full bg-gray-700 p-2 rounded" rows={2} />
                <textarea placeholder="Issues (comma-separated)" value={faction.issues.join(', ')} onChange={e => setFaction({ ...faction, issues: e.target.value.split(',').map(s => s.trim()) })} className="w-full bg-gray-700 p-2 rounded" rows={2} />
                <textarea placeholder="Endgame (What happens if they win?)" value={faction.endgame_example || ''} onChange={e => setFaction({ ...faction, endgame_example: e.target.value })} className="w-full bg-gray-700 p-2 rounded" rows={2} />
                <button onClick={onSave} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded mt-2">
                    {isEditing ? 'Save Changes' : 'Add Faction'}
                </button>
            </div>
        );
    };

    const FactionCard: React.FC<{ faction: Faction }> = ({ faction }) => {
        const [editableFaction, setEditableFaction] = useState<Faction>(faction);

        const handleSave = () => {
            updateFaction(faction.id, editableFaction);
            setEditingFactionId(null);
        };

        if (editingFactionId === faction.id) {
            return (
                <Card>
                    <FactionForm faction={editableFaction} setFaction={setEditableFaction} onSave={handleSave} isEditing={true} />
                </Card>
            );
        }

        return (
            <Card>
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-xl font-bold text-white">{faction.name}</h4>
                        <p className="text-sm text-red-400">{faction.type} ({faction.size}) - {faction.leadership}</p>
                    </div>
                    {isEditMode && (
                        <div className="flex gap-2">
                            <button onClick={() => setEditingFactionId(faction.id)} className="text-gray-400 hover:text-white p-2 rounded-full"><PencilIcon/></button>
                            <InlineConfirmation question="Delete?" onConfirm={() => removeFaction(faction.id)}>
                                {start => <button onClick={start} className="text-red-500 hover:text-red-400 p-2 rounded-full"><TrashIcon/></button>}
                            </InlineConfirmation>
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-sm">
                    <p><strong className="text-gray-400">Assets:</strong> {faction.assets}</p>
                    <p><strong className="text-gray-400">Needs:</strong> {faction.needs}</p>
                    <p><strong className="text-gray-400">Issues:</strong> {faction.issues.join(', ')}</p>
                    <p><strong className="text-gray-400">Endgame:</strong> {faction.endgame_example}</p>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {isEditMode && (
                <Card>
                    <h3 className="text-xl font-bold text-red-500 mb-4">Create New Faction</h3>
                    <FactionForm faction={newFaction} setFaction={setNewFaction} onSave={handleAddFaction} isEditing={false} />
                </Card>
            )}
            <div className="space-y-4">
                {factions.map(faction => <FactionCard key={faction.id} faction={faction} />)}
            </div>
             {factions.length === 0 && (
                <p className="text-center text-gray-500 py-6">No factions have been created yet.</p>
            )}
        </div>
    );
};

export default FactionDashboard;
