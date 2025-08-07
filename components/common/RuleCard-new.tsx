import React from 'react';
import { RuleDefinition } from '../../data/rules';

interface RuleCardProps {
  rule: RuleDefinition;
  compact?: boolean;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, compact = false }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'border-blue-500 bg-blue-900/20';
      case 'rules': return 'border-purple-500 bg-purple-900/20';
      case 'combat': return 'border-red-500 bg-red-900/20';
      case 'characters': return 'border-green-500 bg-green-900/20';
      case 'gear': return 'border-yellow-500 bg-yellow-900/20';
      case 'locations': return 'border-orange-500 bg-orange-900/20';
      case 'factions': return 'border-pink-500 bg-pink-900/20';
      case 'npcs': return 'border-cyan-500 bg-cyan-900/20';
      case 'management': return 'border-indigo-500 bg-indigo-900/20';
      case 'solo': return 'border-gray-500 bg-gray-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return '📚';
      case 'rules': return '🎲';
      case 'combat': return '⚔️';
      case 'characters': return '👤';
      case 'gear': return '🛡️';
      case 'locations': return '🗺️';
      case 'factions': return '🏛️';
      case 'npcs': return '👥';
      case 'management': return '⚙️';
      case 'solo': return '🎯';
      default: return '📋';
    }
  };

  return (
    <div className={`bg-gray-800 border rounded-lg p-4 my-2 max-w-2xl ${getCategoryColor(rule.category)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getCategoryIcon(rule.category)}</span>
          <div>
            <div className="text-white font-bold text-lg">{rule.name}</div>
            <div className="text-gray-400 text-xs uppercase tracking-wide">{rule.category}</div>
          </div>
        </div>
        {rule.citations && rule.citations.trim() && (
          <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
            📖 {rule.citations}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="text-gray-300 leading-relaxed text-sm">
          {rule.description}
        </div>
      </div>

      {/* Details */}
      {rule.details && (
        <div className="mb-4 p-3 bg-gray-700/30 rounded border-l-4 border-gray-500">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">📝 Additional Details</h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            {rule.details}
          </p>
        </div>
      )}

      {/* Examples */}
      {rule.examples && rule.examples.length > 0 && (
        <div className="mb-4 p-3 bg-gray-700/30 rounded border-l-4 border-yellow-500">
          <h4 className="text-sm font-semibold text-yellow-300 mb-2">💡 Examples</h4>
          <ul className="space-y-1">
            {rule.examples.map((example, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>
                <span className="leading-relaxed">{example}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keywords */}
      {rule.keywords && rule.keywords.length > 0 && (
        <div className="pt-3 border-t border-gray-600">
          <div className="text-xs text-gray-400 mb-2">🔍 Keywords:</div>
          <div className="flex flex-wrap gap-1">
            {rule.keywords.map((keyword, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-md border border-gray-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleCard;
