
import React, { ReactNode } from 'react';
import { twdStyles, cn } from '../../utils/twdStyles';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  titleBold?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, titleBold = false }) => {
  return (
    <div className={cn(twdStyles.cardLarge, className)}>
      {title && (
        <div className="mb-4 pb-2 border-b border-gray-600">
          <h2 className={cn(
            titleBold ? twdStyles.headingMedium : 'text-xl text-white font-medium'
          )}>
            {title}
          </h2>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
