import React, { useState, useRef, useEffect } from 'react';
import { RuleDefinition } from '../../data/rules';

interface TooltipProps {
  children: React.ReactNode;
  rule: RuleDefinition;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, rule, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Show above if there's more space above and below is limited
    setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom');
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'condition': return 'border-yellow-500 bg-yellow-900/20';
      case 'gear': return 'border-green-500 bg-green-900/20';
      case 'combat': return 'border-red-500 bg-red-900/20';
      case 'game-mechanic': return 'border-blue-500 bg-blue-900/20';
      case 'character': return 'border-purple-500 bg-purple-900/20';
      case 'haven': return 'border-orange-500 bg-orange-900/20';
      case 'story': return 'border-gray-500 bg-gray-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'condition': return '⚠️';
      case 'gear': return '🛡️';
      case 'combat': return '⚔️';
      case 'game-mechanic': return '🎲';
      case 'character': return '👤';
      case 'haven': return '🏠';
      case 'story': return '📖';
      default: return '📋';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        className={`cursor-help border-b border-dotted border-gray-400 ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      
      {isVisible && (
        <>
          {/* Backdrop for mobile touch dismiss */}
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsVisible(false)}
          />
          
          <div
            ref={tooltipRef}
            className={`
              absolute z-50 w-80 max-w-sm p-4 text-sm rounded-lg shadow-xl border-2
              ${getCategoryColor(rule.category)}
              backdrop-blur-sm
              ${position === 'top' 
                ? 'bottom-full mb-2' 
                : 'top-full mt-2'
              }
              left-1/2 transform -translate-x-1/2
              animate-in fade-in duration-200
            `}
          >
            {/* Arrow */}
            <div 
              className={`
                absolute w-3 h-3 border-l-2 border-t-2 border-gray-600 bg-gray-800
                transform rotate-45 left-1/2 -translate-x-1/2
                ${position === 'top' 
                  ? 'top-full -mt-2' 
                  : 'bottom-full -mb-2'
                }
              `}
            />
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getCategoryIcon(rule.category)}</span>
              <div>
                <h3 className="font-bold text-white">{rule.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{rule.category.replace('-', ' ')}</p>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-300 mb-3 leading-relaxed">
              {rule.description}
            </p>
            
            {/* Details */}
            {rule.details && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1 font-semibold">Details:</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {rule.details}
                </p>
              </div>
            )}
            
            {/* Examples */}
            {rule.examples && rule.examples.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1 font-semibold">Examples:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  {rule.examples.slice(0, 3).map((example, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-gray-500 mt-0.5">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Tooltip;
