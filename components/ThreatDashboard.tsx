
import React from 'react';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import { THREAT_LEVELS, SWARM_SIZES } from '../constants';

const ThreatDashboard: React.FC = () => {
    const { gameState, updateThreat } = useGameState();
    const { threat } = gameState;

    const currentThreatInfo = THREAT_LEVELS.find(t => t.level === threat.level) || THREAT_LEVELS[0];

    const handleLevelChange = (increment: number) => {
        const newLevel = Math.max(0, Math.min(6, threat.level + increment));
        updateThreat({ level: newLevel });
    };

    const handleSizeChange = (increment: number) => {
        const newSize = Math.max(1, Math.min(6, threat.swarmSize + increment));
        updateThreat({ swarmSize: newSize });
    };


    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">Threat Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Threat Level */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                         <h4 className="text-lg font-bold text-red-400">Threat Level</h4>
                         <div className="flex items-center gap-2">
                             <button onClick={() => handleLevelChange(-1)} className="bg-gray-700 hover:bg-gray-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xl">-</button>
                             <span className="font-bold text-xl text-white w-6 text-center">{threat.level}</span>
                             <button onClick={() => handleLevelChange(1)} className="bg-gray-700 hover:bg-gray-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xl">+</button>
                         </div>
                    </div>
                     <div className="w-full bg-gray-700 rounded-full h-4">
                        <div
                          className="bg-red-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${(threat.level / 6) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-300 mt-2 p-2 bg-gray-900/50 rounded-md h-16">
                        {currentThreatInfo.situation}
                    </p>
                </div>
                {/* Swarm Size */}
                <div>
                     <div className="flex justify-between items-center mb-2">
                         <h4 className="text-lg font-bold text-red-400">Swarm Size</h4>
                         <div className="flex items-center gap-2">
                             <button onClick={() => handleSizeChange(-1)} className="bg-gray-700 hover:bg-gray-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xl">-</button>
                             <span className="font-bold text-xl text-white w-6 text-center">{threat.swarmSize}</span>
                             <button onClick={() => handleSizeChange(1)} className="bg-gray-700 hover:bg-gray-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xl">+</button>
                         </div>
                    </div>
                     <div className="w-full bg-gray-700 rounded-full h-4">
                         <div
                          className="bg-yellow-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${(threat.swarmSize / 6) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-300 mt-2 p-2 bg-gray-900/50 rounded-md h-16">
                        Size {threat.swarmSize} represents roughly <span className="font-bold text-white">{SWARM_SIZES.find(s=>s.size === threat.swarmSize)?.count || 'N/A'}</span> walkers.
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default ThreatDashboard;
