

import React from 'react';
import { twdStyles, cn } from '../../utils/twdStyles';

interface DieProps {
  value: number;
  isStress?: boolean;
  isHelp?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Die: React.FC<DieProps> = ({ value, isStress = false, isHelp = false, size = 'md' }) => {
  const isSuccess = value === 6;
  const isWalker = isStress && value === 1;

  let colorClasses = '';

  if (isWalker) {
    // Special walker icon, always white on red
    colorClasses = 'bg-twd-blood hover:bg-twd-red text-white';
  } else if (isSuccess) {
    // Success, always white on green
    colorClasses = 'bg-twd-success hover:bg-green-500 text-white';
  } else if (isHelp) {
    // Help dice, blue background
    colorClasses = 'bg-twd-info hover:bg-blue-500 text-white';
  } else if (isStress) {
    // Normal stress die, black text on white
    colorClasses = 'bg-white text-black hover:bg-gray-200';
  } else {
    // Normal base die, white text on gray
    colorClasses = 'bg-twd-gray hover:bg-gray-500 text-white';
  }

  const sizeClasses = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-lg',
      lg: 'w-12 h-12 text-xl',
  }

  return (
    <div className={cn(
      'flex items-center justify-center font-bold rounded-md transition-colors',
      colorClasses,
      sizeClasses[size]
    )}>
      {isWalker ? '☣' : value}
    </div>
  );
};

export default Die;
