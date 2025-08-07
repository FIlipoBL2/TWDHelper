import React from 'react';
import Die from './Die';
import { DiceRollResult, TableRollResult } from '../../types';

interface DiceRollCardProps {
  result: DiceRollResult | TableRollResult | { dice: number[]; total?: number; type: string };
  command: string;
  timestamp: string;
  onPushRoll?: () => void;
  onEndTurn?: () => void;
  canPush?: boolean;
  isDuelActive?: boolean;
  isCurrentTurn?: boolean;
}

const DiceRollCard: React.FC<DiceRollCardProps> = ({ 
  result, 
  command, 
  timestamp, 
  onPushRoll, 
  onEndTurn, 
  canPush = false, 
  isDuelActive = false, 
  isCurrentTurn = false 
}) => {
  // Handle different types of roll results
  const isDiceRoll = 'baseDice' in result;
  const isTableRoll = 'tableName' in result;
  const isSimpleRoll = 'dice' in result && !isDiceRoll && !isTableRoll;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 my-2 max-w-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-yellow-400 font-semibold text-sm">🎲 {command}</div>
        <div className="text-gray-400 text-xs">{timestamp}</div>
      </div>

      {/* Dice Roll Result */}
      {isDiceRoll && (
        <div className="space-y-3">
          {/* Base Dice */}
          {result.baseDice.length > 0 && (
            <div>
              <div className="text-gray-300 text-sm mb-1">Base Dice:</div>
              <div className="flex gap-1 flex-wrap">
                {result.baseDice.map((die, index) => (
                  <Die key={`base-${index}`} value={die} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* Stress Dice */}
          {result.stressDice.length > 0 && (
            <div>
              <div className="text-gray-300 text-sm mb-1">Stress Dice:</div>
              <div className="flex gap-1 flex-wrap">
                {result.stressDice.map((die, index) => (
                  <Die key={`stress-${index}`} value={die} isStress={true} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* Help/Hurt Dice */}
          {result.helpDice && result.helpDice.length > 0 && (
            <div>
              <div className={`text-sm mb-1 ${result.helpDiceCount && result.helpDiceCount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {result.helpDiceCount && result.helpDiceCount < 0 ? 'Hurt Dice:' : 'Help Dice:'}
              </div>
              <div className="flex gap-1 flex-wrap">
                {result.helpDice.map((die, index) => (
                  <div key={`help-${index}`} className={result.helpDiceCount && result.helpDiceCount < 0 ? 'opacity-75' : ''}>
                    <Die value={die} size="sm" isHelp={result.helpDiceCount ? result.helpDiceCount > 0 : true} />
                  </div>
                ))}
              </div>
              {result.helpDiceCount && result.helpDiceCount < 0 && (
                <div className="text-red-400 text-xs mt-1">
                  ⚠️ Difficulty penalty applied ({Math.abs(result.helpDiceCount)} hurt dice)
                </div>
              )}
            </div>
          )}

          {/* Result Summary */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Successes:</span>
              <span className={`font-bold text-lg ${result.successes > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.successes}
              </span>
            </div>
            {result.messedUp && (
              <div className="text-red-400 text-sm mt-1 font-semibold">⚠️ Messed Up!</div>
            )}
            {result.pushed && (
              <div className="text-yellow-400 text-sm mt-1">🔥 Pushed Roll</div>
            )}
          </div>

          {/* Duel Action Buttons */}
          {isDuelActive && isCurrentTurn && (
            <div className="border-t border-gray-600 pt-3 space-y-2">
              {/* Push Roll Button */}
              {canPush && onPushRoll && result.successes === 0 && !result.pushed && (
                <button
                  onClick={onPushRoll}
                  className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold text-sm transition-colors"
                >
                  🎲 PUSH ROLL (Add Stress Dice)
                </button>
              )}
              
              {/* End Turn Button */}
              {onEndTurn && (
                <button
                  onClick={onEndTurn}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition-colors"
                >
                  ➡️ END TURN
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table Roll Result */}
      {isTableRoll && (
        <div className="space-y-2">
          <div className="text-gray-300 text-sm">Table: {result.tableName}</div>
          {result.dice && result.dice.length > 0 && (
            <div className="flex gap-1">
              {result.dice.map((die, index) => (
                <Die key={`table-${index}`} value={die} size="sm" />
              ))}
            </div>
          )}
          <div className="text-yellow-400 font-semibold">Roll: {result.roll}</div>
          <div className="text-white bg-gray-700 p-2 rounded text-sm">
            {result.resultText}
          </div>
        </div>
      )}

      {/* Simple Roll Result */}
      {isSimpleRoll && (
        <div className="space-y-2">
          <div className="flex gap-1 flex-wrap">
            {result.dice.map((die, index) => (
              <Die key={`simple-${index}`} value={die} size="sm" />
            ))}
          </div>
          {result.total !== undefined && (
            <div className="text-center">
              <span className="text-gray-300 text-sm">Total: </span>
              <span className="text-yellow-400 font-bold text-lg">{result.total}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiceRollCard;
