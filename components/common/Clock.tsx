import React from 'react';

interface ClockProps {
  current: number;
  max: number;
  size: number;
}

const Clock: React.FC<ClockProps> = ({ current, max, size }) => {
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(1, current / max));
  const offset = circumference - progress * circumference;

  const segments = Array.from({ length: max }, (_, i) => i);
  const angleStep = 360 / max;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle
        stroke="#4a5568" // gray-700
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Segments */}
      {max > 1 && segments.map(i => {
         if (i === 0) return null;
         const angle = (angleStep * i) - 90;
         const x1 = (size / 2) + radius * Math.cos(angle * Math.PI / 180);
         const y1 = (size / 2) + radius * Math.sin(angle * Math.PI / 180);
         const x2 = (size / 2);
         const y2 = (size / 2);

         return (
             <line 
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#4a5568" // gray-700
                strokeWidth={1}
             />
         )
      })}
      {/* Progress arc */}
      <circle
        stroke="#dc2626" // red-600
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
      />
      {/* Center text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fill="#e5e7eb" // gray-200
        fontSize={size / 4}
        fontWeight="bold"
      >
        {`${current}/${max}`}
      </text>
    </svg>
  );
};

export default Clock;
