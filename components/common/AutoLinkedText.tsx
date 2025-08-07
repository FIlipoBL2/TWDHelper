import React from 'react';
import { processTextForRuleLinks } from '../../utils/textProcessor';
import Tooltip from './Tooltip';

interface AutoLinkedTextProps {
  text: string;
  className?: string;
}

const AutoLinkedText: React.FC<AutoLinkedTextProps> = ({ text, className = '' }) => {
  const fragments = processTextForRuleLinks(text);
  
  return (
    <span className={className}>
      {fragments.map((fragment, index) => {
        if (fragment.type === 'rule-link' && fragment.rule) {
          return (
            <Tooltip key={index} rule={fragment.rule}>
              <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-help border-b border-dotted border-blue-400/50">
                {fragment.content}
              </span>
            </Tooltip>
          );
        }
        
        return <span key={index}>{fragment.content}</span>;
      })}
    </span>
  );
};

export default AutoLinkedText;
