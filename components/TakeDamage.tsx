import React, { useState } from 'react';
import { Character } from '../types';
import { useGameState } from '../context/GameStateContext';
import Card from './common/Card';
import Die from './common/Die';
import * as diceService from '../services/diceService';

interface TakeDamageProps {
    character: Character;
}

const TakeDamage: React.FC<TakeDamageProps> = ({ character }) => {
    const { updateCharacter, addChatMessage } = useGameState();
    const [incomingDamage, setIncomingDamage] = useState<number>(1);
    const [lastArmorRoll, setLastArmorRoll] = useState<{dice: number[], soaked: number} | null>(null);

    const equippedArmor = character.inventory.find(i => i.equipped && i.type === 'Armor');

    const handleTakeDamage = () => {
        let damageSoaked = 0;
        let armorDice: number[] = [];

        if (equippedArmor && equippedArmor.armorLevel) {
            // Use the diceService for rolling armor dice
            armorDice = diceService.rollDice(equippedArmor.armorLevel);
            damageSoaked = armorDice.filter(d => d === 6).length;
            setLastArmorRoll({ dice: armorDice, soaked: damageSoaked });
        } else {
            setLastArmorRoll(null);
        }

        const finalDamage = Math.max(0, incomingDamage - damageSoaked);
        const newHealth = Math.max(0, character.health - finalDamage);

        updateCharacter(character.id, { health: newHealth });

        let chatContent = `${character.name} takes ${incomingDamage} damage.`;
        if (equippedArmor) {
            chatContent += ` ${equippedArmor.name} soaks ${damageSoaked} damage.`
        }
        chatContent += ` Final damage is ${finalDamage}, reducing health to ${newHealth}.`

        addChatMessage({
            characterId: 'SYSTEM',
            characterName: 'System',
            type: 'SYSTEM',
            content: chatContent
        });
    };

    return (
        <Card className="bg-gray-800/80">
            <h4 className="font-bold text-red-400 mb-2">Take Damage</h4>
            <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-grow">
                    <label htmlFor="damage-input" className="block text-sm font-medium text-gray-400 mb-1">Incoming Damage</label>
                    <input
                        id="damage-input"
                        type="number"
                        min="0"
                        value={incomingDamage}
                        onChange={(e) => setIncomingDamage(Number(e.target.value))}
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                    />
                </div>
                <button
                    onClick={handleTakeDamage}
                    className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md"
                >
                    Apply Damage
                </button>
            </div>
            {equippedArmor && <p className="text-xs text-center text-gray-400 mt-2">Armor: {equippedArmor.name} ({equippedArmor.armorLevel} dice)</p>}
            {lastArmorRoll && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-sm font-semibold text-gray-300 mb-2">Armor Roll Results (Soaked {lastArmorRoll.soaked}):</p>
                    <div className="flex flex-wrap gap-1">
                        {lastArmorRoll.dice.map((d, i) => <Die key={`armor-${i}`} value={d} size="sm" />)}
                    </div>
                </div>
            )}
        </Card>
    )
}

export default TakeDamage;