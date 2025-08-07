


import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { TableRollResult } from '../types';
import { ALL_TABLES } from '../constants';

const RollableTables: React.FC = () => {
    const { rollOnTable, addChatMessage } = useGameState();
    const [lastRollResult, setLastRollResult] = useState<TableRollResult | null>(null);
    const [showInChat, setShowInChat] = useState(true);

    const tables = Object.keys(ALL_TABLES);

    const handleRoll = (tableName: string) => {
        const result = rollOnTable(tableName);
        if (result) {
            setLastRollResult(result);
            if (showInChat) {
                addChatMessage({
                    characterId: 'SYSTEM',
                    characterName: 'GM Roll',
                    content: `rolled on the ${result.tableName} table.`,
                    type: 'ROLL',
                    tableRollResult: result,
                });
            }
        }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-red-500">Rollable Tables</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="show-roll-chat" className="text-sm text-gray-400">Show in Chat:</label>
                    <input 
                        type="checkbox" 
                        id="show-roll-chat"
                        checked={showInChat}
                        onChange={() => setShowInChat(!showInChat)}
                        className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-red-600 focus:ring-red-500 cursor-pointer"
                        aria-label="Toggle roll visibility in chat"
                    />
                </div>
            </div>

            {lastRollResult && (
                <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="font-bold text-gray-400 mb-2 text-sm">Last Result:</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-md flex flex-col items-center justify-center border border-gray-600">
                            {lastRollResult.dice && lastRollResult.dice.length > 0 &&
                                <div className="flex gap-0.5">
                                    {lastRollResult.dice.map((d, i) => (
                                        <span key={i} className="text-xs text-gray-400">{d}</span>
                                    ))}
                                </div>
                            }
                            <span className="text-xl font-bold text-white">{lastRollResult.roll}</span>
                        </div>
                        <div className="flex-grow text-sm">
                            <p className="font-semibold text-red-400">{lastRollResult.tableName}</p>
                            <p className="text-gray-300 italic">{lastRollResult.resultText}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tables.map(tableName => (
                    <button
                        key={tableName}
                        onClick={() => handleRoll(tableName)}
                        className="bg-gray-700/80 hover:bg-gray-700 text-white font-semibold py-2 px-3 text-sm rounded-md transition-colors text-center"
                    >
                        Roll {tableName}
                    </button>
                ))}
            </div>
        </Card>
    );
};

export default RollableTables;
