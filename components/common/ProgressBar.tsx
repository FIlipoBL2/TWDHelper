
import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, label }) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      {label && <div className="text-sm font-medium text-gray-300 mb-1">{label}</div>}
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div
          className="bg-red-600 h-4 rounded-full transition-all duration-500"
          style={{ width: `${clampedValue}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
