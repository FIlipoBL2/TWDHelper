import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Character } from '../types';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import Die from './common/Die';
import * as diceService from '../services/diceService';

const XP_QUESTIONS = [
    "Did you participate in the session?",
    "Did you achieve something important?",
    "Did you learn something?",
    "Did you explore at least one new sector on the travel map?",
    "Did your Drive, your Issue, or any of your relationships make an impact on the session?",
    "Did you hold a Dearly Departed Monologue?",
];

interface XpAwardProps {
    character: Character;
}

const XpAward: React.FC<XpAwardProps> = ({ character }) => {
    const { gameState, updateCharacter, addChatMessage } = useGameState();
    const isSoloMode = gameState.gameMode === 'Solo';
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [checkedState, setCheckedState] = useState(
        new Array(XP_QUESTIONS.length).fill(false).map((_, i) => i === 0 && !isSoloMode)
    );
    const [monologueRoll, setMonologueRoll] = useState<{ dice: number[], result: number } | null>(null);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);


    useEffect(() => {
        // Reset component state if the character being viewed changes.
        setCheckedState(new Array(XP_QUESTIONS.length).fill(false).map((_, i) => i === 0 && !isSoloMode));
        setMonologueRoll(null);
        setConfirmationMessage(null);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [character.id, isSoloMode]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleCheckboxChange = (position: number) => {
        if (position === 0 && !isSoloMode) return; // Can't uncheck the first question in non-solo
        const updatedCheckedState = checkedState.map((item, index) =>
            index === position ? !item : item
        );
        setCheckedState(updatedCheckedState);

        // If monologue is unchecked, clear its roll result
        if (position === 5 && !updatedCheckedState[5]) {
            setMonologueRoll(null);
        }
    };

    const handleMonologueRoll = useCallback(() => {
        // Double low is 2d6, take the lowest value.
        const dice = diceService.rollDice(2);
        const result = Math.min(...dice);
        setMonologueRoll({ dice, result });
    }, []);

    const totalXpToAward = useMemo(() => {
        let total = 0;
        checkedState.forEach((isChecked, index) => {
            if (isChecked) {
                if (index < 5) { // Questions 0-4 are worth 1 XP
                    if(isSoloMode && index === 0) return;
                    total += 1;
                } else if (index === 5 && monologueRoll) { // Question 5 (monologue)
                    total += monologueRoll.result;
                }
            }
        });
        return total;
    }, [checkedState, monologueRoll, isSoloMode]);

    const handleAwardXp = () => {
        if (totalXpToAward <= 0 || confirmationMessage) return;

        const newXpTotal = character.xp + totalXpToAward;
        updateCharacter(character.id, { xp: newXpTotal });

        const logMessage = `${character.name} was awarded ${totalXpToAward} XP.`;
        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            content: logMessage,
            type: 'SYSTEM',
        });
        
        setConfirmationMessage(`+${totalXpToAward} XP Awarded! New total: ${newXpTotal}`);
        
        // Reset the form after awarding
        setCheckedState(new Array(XP_QUESTIONS.length).fill(false).map((_, i) => i === 0 && !isSoloMode));
        setMonologueRoll(null);
        
        // Clear the confirmation message after a few seconds
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setConfirmationMessage(null);
            timeoutRef.current = null;
        }, 4000);
    };

    return (
        <Card>
            <h3 className="text-xl font-bold text-red-500 mb-4">End of Session: Award XP</h3>
            <div className="space-y-2">
                {XP_QUESTIONS.map((question, index) => {
                    const isParticipationQuestion = index === 0;
                    if (isSoloMode && isParticipationQuestion) return null;

                    return (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/50 min-h-[48px]">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={checkedState[index]}
                                    onChange={() => handleCheckboxChange(index)}
                                    disabled={isParticipationQuestion && !isSoloMode}
                                    className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-red-600 focus:ring-red-500 disabled:opacity-50"
                                />
                                <span className="text-gray-300">{question}</span>
                            </label>

                            {index === 5 && checkedState[5] && (
                                <div className="flex items-center gap-3">
                                    {monologueRoll ? (
                                        <>
                                            <div className="flex items-center gap-1">
                                                {monologueRoll.dice.map((d, i) => <Die key={i} value={d} size="sm" />)}
                                            </div>
                                            <span className="text-sm font-bold text-green-400">→ +{monologueRoll.result} XP</span>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleMonologueRoll}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors"
                                        >
                                            Roll (Double Low)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
                {confirmationMessage ? (
                    <span className="text-lg font-bold text-green-400 transition-opacity duration-300">
                        {confirmationMessage}
                    </span>
                ) : (
                    <span className="text-lg font-bold text-white">
                        Total XP to Award: <span className="text-green-400">{totalXpToAward}</span>
                    </span>
                )}
                <button 
                    onClick={handleAwardXp}
                    disabled={totalXpToAward <= 0 || confirmationMessage !== null}
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-md transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {confirmationMessage ? 'Awarded!' : 'Award XP'}
                </button>
            </div>
        </Card>
    );
};

export default XpAward;