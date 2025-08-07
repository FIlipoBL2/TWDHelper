
import React, { useState, ReactNode } from 'react';

interface InlineConfirmationProps {
  onConfirm: () => void;
  question: ReactNode;
  children: (startConfirmation: (e: React.MouseEvent) => void) => ReactNode;
}

const InlineConfirmation: React.FC<InlineConfirmationProps> = ({ 
    onConfirm, 
    question, 
    children,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirm();
    setIsConfirming(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  };
  
  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  }

  if (isConfirming) {
    return (
      <div className="flex items-center justify-center gap-2 p-1 bg-gray-900/50 rounded-md animate-fade-in">
        <span className="text-sm text-yellow-400">{question}</span>
        <button onClick={handleConfirm} className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs">Yes</button>
        <button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded text-xs">No</button>
      </div>
    );
  }

  return children(handleStart);
};

export default InlineConfirmation;
