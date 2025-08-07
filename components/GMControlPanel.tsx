

import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { PlusIcon, TrashIcon } from './common/Icons';
import ThreatDashboard from './ThreatDashboard';
import RollableTables from './RollableTables';
import InlineConfirmation from './common/InlineConfirmation';
import Clock from './common/Clock';
import FactionDashboard from './FactionDashboard';

const GMControlPanel: React.FC = () => {
  const { gameState, addChatMessage, isEditMode, addClock, updateClock, removeClock } = useGameState();
  const { session } = gameState;
  const [activeTab, setActiveTab] = useState<'tools' | 'factions'>('tools');

  const [newClockName, setNewClockName] = useState('');
  const [newClockMax, setNewClockMax] = useState(4);

  const handleAddClock = () => {
    addClock(newClockName, newClockMax);
    setNewClockName('');
    setNewClockMax(4);
    addChatMessage({
      characterId: 'SYSTEM',
      characterName: 'System',
      content: `New clock added: "${newClockName}" [${newClockMax} segments].`,
      type: 'SYSTEM',
    });
  };

  const handleClockIncrement = (clock: typeof session.clocks[0]) => {
    const newCurrent = Math.min(clock.max, clock.current + 1);
    updateClock(clock.id, { current: newCurrent });
  };
  
  const handleClockDecrement = (clock: typeof session.clocks[0]) => {
    const newCurrent = Math.max(0, clock.current - 1);
    updateClock(clock.id, { current: newCurrent });
  };

  const renderToolsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ThreatDashboard />
        <RollableTables />
        <Card>
          <h3 className="text-xl font-bold text-red-500 mb-4">Clocks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {session.clocks.map(clock => (
              <div key={clock.id} className="flex flex-col p-3 bg-gray-700/50 rounded-lg items-center">
                 <div className="flex justify-between items-center w-full mb-2">
                    <p className="font-bold text-white text-center flex-grow">{clock.name}</p>
                    {isEditMode && (
                      <InlineConfirmation question="Delete?" onConfirm={() => removeClock(clock.id)}>
                        {start => <button onClick={start} className="text-red-500 hover:text-red-400 flex-shrink-0"><TrashIcon /></button>}
                      </InlineConfirmation>
                    )}
                </div>
                <Clock current={clock.current} max={clock.max} size={120} />
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => handleClockDecrement(clock)} className="bg-gray-600 hover:bg-gray-500 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">-</button>
                  <p className="text-sm text-gray-400 w-16 text-center font-mono">{clock.current} / {clock.max}</p>
                  <button onClick={() => handleClockIncrement(clock)} className="bg-gray-600 hover:bg-gray-500 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold">+</button>
                </div>
              </div>
            ))}
             {session.clocks.length === 0 && <p className="text-gray-500 text-center col-span-full">No active clocks.</p>}
          </div>
          {isEditMode && (
            <div className="border-t border-gray-700 pt-4">
                <h4 className="font-bold text-lg text-red-400 mb-2">Create New Clock</h4>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input 
                    type="text" 
                    value={newClockName} 
                    onChange={e => setNewClockName(e.target.value)} 
                    placeholder="Clock Name"
                    className="bg-gray-700 p-2 rounded-md w-full sm:flex-grow"
                />
                <div className="flex gap-2 items-center w-full sm:w-auto">
                    <input 
                    type="number" 
                    value={newClockMax}
                    min="1"
                    onChange={e => setNewClockMax(Number(e.target.value))}
                    className="bg-gray-700 p-2 rounded-md w-20"
                    />
                    <span className="text-gray-400">Segments</span>
                </div>
                <button onClick={handleAddClock} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-1 w-full sm:w-auto">
                    <PlusIcon /> Add
                </button>
                </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  return (
    <div>
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6">
            <button onClick={() => setActiveTab('tools')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'tools' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                GM Tools
            </button>
            <button onClick={() => setActiveTab('factions')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'factions' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                Factions
            </button>
        </div>
        {activeTab === 'tools' && renderToolsTab()}
        {activeTab === 'factions' && <FactionDashboard />}
    </div>
  );
};

export default GMControlPanel;