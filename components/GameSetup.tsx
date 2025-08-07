
import React, { useState, useRef, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';
import { SURVIVAL_SCENARIOS } from '../constants';
import Card from './common/Card';

const GameSetup: React.FC = () => {
    const { setGameMode, loadSession, loadSurvivalScenario } = useGameState();
    const [selectedScenario, setSelectedScenario] = useState<keyof typeof SURVIVAL_SCENARIOS | ''>('');
    const scenarioKeys = Object.keys(SURVIVAL_SCENARIOS) as (keyof typeof SURVIVAL_SCENARIOS)[];
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
    
    const handleStartSurvival = () => {
        if (selectedScenario) {
            loadSurvivalScenario(selectedScenario);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    const success = loadSession(content);
                    if (!success) {
                        showFeedback("Failed to load. File may be invalid.", 'error');
                    }
                }
            };
            reader.readAsText(file);
            if(event.target) event.target.value = '';
        }
    };
    
    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };
    
    const feedbackColor = feedback?.type === 'success' 
        ? 'bg-twd-success/80' 
        : 'bg-twd-danger/80';

    return (
        <div className="min-h-screen bg-twd-darker text-gray-300 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full relative pb-8 bg-twd-dark border-twd-gray shadow-twd-lg">
                <div className="text-center mb-8">
                    <img 
                        src="/TWD Helper Logo.png" 
                        alt="TWD Helper Logo" 
                        className="h-20 md:h-24 w-auto mx-auto mb-4"
                    />
                    <p className="text-gray-400 mt-2 mb-8">Select your game mode to begin.</p>
                </div>
                
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".json" 
                />

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Campaign Mode */}
                    <div className="flex flex-col items-center justify-between p-6 bg-twd-gray/50 rounded-lg border border-twd-gray/60 hover:border-twd-red/50 transition-colors">
                        <div>
                            <h2 className="text-2xl font-bold text-twd-red text-center">Campaign</h2>
                            <p className="text-sm text-gray-400 mt-2 text-center">
                                Play with a Gamemaster. Create characters and embark on an ongoing story. Manage your haven, build relationships, and face the horrors of the new world.
                            </p>
                        </div>
                        <div className="w-full mt-6 space-y-2">
                            <button 
                                onClick={() => setGameMode('Campaign')}
                                className="btn-primary w-full py-3"
                            >
                                Start New Campaign
                            </button>
                            <button
                                onClick={handleLoadClick}
                                className="btn-secondary w-full py-2 text-sm"
                            >
                                Load Session File
                            </button>
                        </div>
                    </div>
                    
                    {/* Solo Play Mode */}
                    <div className="flex flex-col items-center justify-between p-6 bg-twd-gray/50 rounded-lg border border-twd-red/50 ring-2 ring-twd-red/50 shadow-twd hover:ring-twd-red/70 transition-all">
                        <div>
                            <h2 className="text-2xl font-bold text-twd-red text-center">Solo Play</h2>
                            <p className="text-sm text-gray-400 mt-2 text-center">
                                Play without a GM. A generative AI acts as your oracle, helping you build the story, create characters, and navigate the world. Perfect for a single-player experience.
                            </p>
                        </div>
                        <div className="w-full mt-6 space-y-2">
                            <button 
                                onClick={() => setGameMode('Solo')}
                                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors"
                            >
                                Start Solo Game
                            </button>
                            <button
                                onClick={handleLoadClick}
                                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                            >
                                Load Session File
                            </button>
                        </div>
                    </div>

                    {/* Survival Mode */}
                     <div className="flex flex-col items-center justify-between p-6 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div>
                            <h2 className="text-2xl font-bold text-red-400 text-center">Survival</h2>
                             <p className="text-sm text-gray-400 mt-2 text-center">
                                Jump into a one-shot scenario with pre-generated characters for a focused, high-stakes experience.
                            </p>
                            <div className="mt-4">
                                <label htmlFor="scenario-select" className="block text-sm font-medium text-gray-300 mb-1">Select Scenario:</label>
                                <select 
                                    id="scenario-select"
                                    value={selectedScenario}
                                    onChange={e => setSelectedScenario(e.target.value as keyof typeof SURVIVAL_SCENARIOS)}
                                    className="w-full bg-gray-800 border-gray-700 p-2 rounded-md"
                                >
                                    <option value="" disabled>Choose a scenario...</option>
                                    {scenarioKeys.map(key => (
                                        <option key={key} value={key}>{SURVIVAL_SCENARIOS[key].name}</option>
                                    ))}
                                </select>
                                {selectedScenario && (
                                    <p className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded-md border border-gray-700 h-[70px] overflow-y-auto">
                                        {SURVIVAL_SCENARIOS[selectedScenario].description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={handleStartSurvival}
                            disabled={!selectedScenario}
                            className="mt-6 w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Start Survival Scenario
                        </button>
                    </div>
                </div>

                {feedback && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-max max-w-full px-2">
                        <p className={`${feedbackColor} backdrop-blur-sm text-white text-sm font-semibold py-1 px-4 rounded-full animate-fade-in shadow-lg`}>
                            {feedback.message}
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default GameSetup;