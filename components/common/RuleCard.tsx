import React from 'react';
import { RuleDefinition } from '../../data/rules';

interface RuleCardProps {
  rule: RuleDefinition;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule }) => {
  console.log('🎯 RuleCard component rendering with rule:', rule);
  
  if (!rule) {
    console.error('❌ RuleCard: No rule provided!');
    return (
      <div className="bg-red-800 border border-red-600 rounded-lg p-4 my-2 max-w-md">
        <div className="text-red-400 font-semibold text-sm">❌ Error</div>
        <div className="text-red-300 mt-2">No rule data provided!</div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 my-2 max-w-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-yellow-400 font-semibold text-sm">📖 Rule Reference</div>
        <div className="text-gray-400 text-xs">{new Date().toLocaleTimeString()}</div>
      </div>

      {/* Rule Name */}
      <div className="mb-3">
        <h3 className="text-white font-bold text-lg">{rule.name}</h3>
      </div>
      
      {/* Description */}
      <div className="mb-3">
        <div className="text-gray-300 text-sm leading-relaxed">
          {rule.description}
        </div>
      </div>
      
      {/* Keywords Section */}
      {rule.keywords && rule.keywords.length > 0 && (
        <div className="mb-3">
          <div className="text-gray-400 text-xs mb-1">Keywords:</div>
          <div className="flex gap-1 flex-wrap">
            {rule.keywords.map((keyword, index) => (
              <span 
                key={index}
                className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Citation */}
      {rule.citations && (
        <div className="border-t border-gray-600 pt-2">
          <div className="text-gray-400 text-xs">
            📚 {rule.citations}
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleCard;
