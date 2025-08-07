import React, { useState, useRef, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import RollableTables from './RollableTables';
import ThreatDashboard from './ThreatDashboard';
import { Clock as ClockType, ClockType as IClockType, TableRollResult } from '../types';
import Clock from './common/Clock';
import { PlusIcon, TrashIcon } from './common/Icons';
import * as diceService from '../services/diceService';
import InlineConfirmation from './common/InlineConfirmation';

// Luck Oracle Component
const LuckOracle: React.FC = () => {
    const { rollOnTable, addChatMessage } = useGameState();
    const [likelihood, setLikelihood] = useState<'Likely' | '50/50' | 'Unlikely'>('50/50');
    const [lastResult, setLastResult] = useState<{ roll: number, result: string, explanation: string } | null>(null);

    const LUCK_ORACLE_RESULTS: Record<number, { result: string; explanation: string; }> = {
        1: { result: 'No, and...', explanation: 'Not only does it not happen, but something worse occurs.' },
        2: { result: 'No, and...', explanation: 'Not only does it not happen, but something worse occurs.' },
        3: { result: 'No.', explanation: 'It simply does not happen.' },
        4: { result: 'No, but...', explanation: 'It doesn\'t happen, but there\'s a silver lining.' },
        5: { result: 'Yes, but...', explanation: 'It happens, but with a complication.' },
        6: { result: 'Yes.', explanation: 'It happens as expected.' },
        7: { result: 'Yes, and...', explanation: 'Not only does it happen, but something even better occurs.' },
        8: { result: 'Yes, and...', explanation: 'Not only does it happen, but something even better occurs.' },
    };

    const LIKELY_ORACLE_RESULTS: Record<number, { result: string; explanation: string; }> = {
        1: { result: 'No, and...', explanation: 'Not only does it not happen, but something worse occurs.' },
        2: { result: 'No.', explanation: 'It simply does not happen.' },
        3: { result: 'No, but...', explanation: 'It doesn\'t happen, but there\'s a silver lining.' },
        4: { result: 'Yes, but...', explanation: 'It happens, but with a complication.' },
        5: { result: 'Yes.', explanation: 'It happens as expected.' },
        6: { result: 'Yes.', explanation: 'It happens as expected.' },
        7: { result: 'Yes, and...', explanation: 'Not only does it happen, but something even better occurs.' },
        8: { result: 'Yes, and...', explanation: 'Not only does it happen, but something even better occurs.' },
    };

    const UNLIKELY_ORACLE_RESULTS: Record<number, { result: string; explanation: string; }> = {
        1: { result: 'No, and...', explanation: 'Not only does it not happen, but something worse occurs.' },
        2: { result: 'No, and...', explanation: 'Not only does it not happen, but something worse occurs.' },
        3: { result: 'No.', explanation: 'It simply does not happen.' },
        4: { result: 'No.', explanation: 'It simply does not happen.' },
        5: { result: 'No, but...', explanation: 'It doesn\'t happen, but there\'s a silver lining.' },
        6: { result: 'Yes, but...', explanation: 'It happens, but with a complication.' },
        7: { result: 'Yes.', explanation: 'It happens as expected.' },
        8: { result: 'Yes, and...', explanation: 'Not only does it happen, but something even better occurs.' },
    };

    const handleRoll = () => {
        const dice = Array.from({ length: 8 }, () => Math.floor(Math.random() * 6) + 1);
        const numOnes = dice.filter(d => d === 1).length;
        let results;

        switch (likelihood) {
            case 'Likely':
                results = LIKELY_ORACLE_RESULTS;
                break;
            case 'Unlikely':
                results = UNLIKELY_ORACLE_RESULTS;
                break;
            default:
                results = LUCK_ORACLE_RESULTS;
        }

        const result = results[numOnes] || results[1];
        setLastResult({ roll: numOnes, result: result.result, explanation: result.explanation });

        addChatMessage({
            characterId: 'ORACLE',
            characterName: 'Luck Oracle',
            content: `Likelihood: ${likelihood} | Rolled ${numOnes} ones | ${result.result}: ${result.explanation}`,
            type: 'SYSTEM',
        });
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Luck Oracle</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Likelihood</label>
                    <select
                        value={likelihood}
                        onChange={(e) => setLikelihood(e.target.value as 'Likely' | '50/50' | 'Unlikely')}
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                    >
                        <option value="Likely">Likely</option>
                        <option value="50/50">50/50</option>
                        <option value="Unlikely">Unlikely</option>
                    </select>
                </div>
                <button onClick={handleRoll} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md">Roll Luck</button>
                {lastResult && (
                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Rolled <span className="font-bold text-white">{lastResult.roll}</span> ones</p>
                        <p className="text-lg font-bold text-red-400">{lastResult.result}</p>
                        <p className="text-sm text-gray-300 italic">{lastResult.explanation}</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

const TableRoller: React.FC = () => {
    const { rollOnTable } = useGameState();
    const [selectedTable, setSelectedTable] = useState('Random Events');
    const [lastResult, setLastResult] = useState<TableRollResult | null>(null);

    const tables = ['Random Events', 'Weather', 'Settlement Names', 'NPC Names', 'Scavenging Results', 'Random Encounters'];

    const handleRoll = () => {
        const result = rollOnTable(selectedTable);
        setLastResult(result);
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Table Roller</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Select Table</label>
                    <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                    >
                        {tables.map(table => (
                            <option key={table} value={table}>{table}</option>
                        ))}
                    </select>
                </div>
            </div>
            <button onClick={handleRoll} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md">Roll on Table</button>
            {lastResult && (
                 <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                     <p className="text-sm text-gray-400">Rolled a <span className="font-bold text-white">{lastResult.roll}</span></p>
                     <p className="text-md font-semibold text-white italic">"{lastResult.resultText}"</p>
                 </div>
            )}
        </Card>
    );
}

const ChallengeSheet: React.FC = () => {
    const { gameState, addClock, updateClock, removeClock, isEditMode, advanceSessionClocks } = useGameState();
    const [newClockName, setNewClockName] = useState('');
    const [newClockMax, setNewClockMax] = useState(6);
    const [newClockType, setNewClockType] = useState<IClockType>('Rumor');

    const clockTypes: IClockType[] = ['Rumor', 'Faction', 'Endgame'];

    const handleAddClock = () => {
        if (!newClockName.trim()) return;
        addClock(newClockName, newClockMax, newClockType);
        setNewClockName('');
        setNewClockMax(6);
    };
    
    const handleClockIncrement = (clock: ClockType) => updateClock(clock.id, { current: Math.min(clock.max, clock.current + 1) });
    const handleClockDecrement = (clock: ClockType) => updateClock(clock.id, { current: Math.max(0, clock.current - 1) });
    
    const clocks = gameState.session.clocks.filter(c => c.type && clockTypes.includes(c.type));

    return (
         <Card>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-red-500">Challenge Sheet</h3>
                 <button onClick={advanceSessionClocks} className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm">Advance Session Clocks</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {clocks.map(clock => (
                <div key={clock.id} className="flex flex-col p-3 bg-gray-700/50 rounded-lg items-center">
                    <div className="flex justify-between items-center w-full mb-2">
                        <div>
                           <p className="font-bold text-white text-center">{clock.name}</p>
                           <p className="text-xs text-red-400 text-center font-semibold">{clock.type}</p>
                        </div>
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
                {clocks.length === 0 && <p className="text-gray-500 text-center col-span-full">No active clocks on the Challenge Sheet.</p>}
            </div>
             {isEditMode && (
                <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-bold text-lg text-red-400 mb-2">Create New Clock</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
                        <input type="text" value={newClockName} onChange={e => setNewClockName(e.target.value)} placeholder="Clock Name" className="bg-gray-700 p-2 rounded-md w-full lg:col-span-2" />
                        <select value={newClockType} onChange={e => setNewClockType(e.target.value as IClockType)} className="bg-gray-700 p-2 rounded-md w-full">
                            {clockTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                         <div className="flex gap-2 items-center">
                            <input type="number" value={newClockMax} min="1" onChange={e => setNewClockMax(Number(e.target.value))} className="bg-gray-700 p-2 rounded-md w-full" />
                            <span className="text-gray-400 text-sm">Segs</span>
                        </div>
                    </div>
                     <button onClick={handleAddClock} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-1 mt-2">
                        <PlusIcon /> Add Clock
                    </button>
                </div>
             )}
        </Card>
    )
}

// Oracle Panel with race condition fixes
const SoloOraclePanel: React.FC = () => {
    const { askOracle, generateScene, addChatMessage } = useGameState();
    const [question, setQuestion] = useState('');
    const [lastAnswer, setLastAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleAsk = async () => {
        if (!question.trim() || isLoading) return;
        
        // Abort any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        setIsLoading(true);
        setLastAnswer('');

        try {
            addChatMessage({
                characterId: 'PLAYER_Q',
                characterName: 'Player Question',
                content: question,
                type: 'OOC',
            });

            const answer = await askOracle(question);

            // Check if request was aborted
            if (!signal.aborted) {
                addChatMessage({
                    characterId: 'ORACLE',
                    characterName: 'Oracle',
                    content: answer,
                    type: 'SYSTEM',
                });
                
                setLastAnswer(answer);
                setQuestion('');
            }
        } catch (error) {
            if (!signal.aborted) {
                console.error('Error asking oracle:', error);
                addChatMessage({
                    characterId: 'ORACLE',
                    characterName: 'Oracle',
                    content: 'The oracle is silent... Try again later.',
                    type: 'SYSTEM',
                });
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    };

    const handleGenerateScene = async () => {
        if (isLoading) return;
        
        // Abort any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        setIsLoading(true);
        setLastAnswer('');
        
        try {
            const scene = await generateScene();

            // Check if request was aborted
            if (!signal.aborted) {
                addChatMessage({
                    characterId: 'ORACLE',
                    characterName: 'Oracle',
                    content: `A new scene unfolds...\n\n${scene}`,
                    type: 'SYSTEM',
                });

                setLastAnswer(scene);
            }
        } catch (error) {
            if (!signal.aborted) {
                console.error('Error generating scene:', error);
                addChatMessage({
                    characterId: 'ORACLE',
                    characterName: 'Oracle',
                    content: 'The vision fades... Unable to see what lies ahead.',
                    type: 'SYSTEM',
                });
            }
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Oracle</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Ask a Question</label>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="What happens next? Is there danger nearby?"
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white h-20"
                        disabled={isLoading}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleAsk} disabled={isLoading || !question.trim()} className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">
                        {isLoading ? 'Consulting...' : 'Ask Oracle'}
                    </button>
                    <button onClick={handleGenerateScene} disabled={isLoading} className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">
                        {isLoading ? 'Generating...' : 'Generate Scene'}
                    </button>
                </div>
                {lastAnswer && (
                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Oracle Response:</p>
                        <p className="text-white whitespace-pre-wrap">{lastAnswer}</p>
                    </div>
                )}
            </div>
        </Card>
    );
}

// Main Dashboard Component
const SoloDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'oracles' | 'challenge' | 'gm_tools'>('oracles');

    return (
        <div className="space-y-6">
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                <button onClick={() => setActiveTab('oracles')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'oracles' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    Oracles
                </button>
                 <button onClick={() => setActiveTab('challenge')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'challenge' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    Challenge Sheet
                </button>
                <button onClick={() => setActiveTab('gm_tools')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'gm_tools' ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    GM Tools
                </button>
            </div>
            
            {activeTab === 'oracles' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <SoloOraclePanel />
                        <LuckOracle />
                    </div>
                    <div className="space-y-6">
                        <TableRoller />
                    </div>
                </div>
            )}
            
            {activeTab === 'challenge' && <ChallengeSheet />}
            
            {activeTab === 'gm_tools' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ThreatDashboard />
                        <RollableTables />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SoloDashboard;
