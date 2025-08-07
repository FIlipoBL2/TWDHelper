
import React from 'react';
import Card from './Card';

interface ScorecardProps {
  label: string;
  value: string | number;
  className?: string;
}

const Scorecard: React.FC<ScorecardProps> = ({ label, value, className }) => {
  return (
    <Card className={`text-center ${className}`}>
      <div className="text-4xl font-bold text-white">{value}</div>
      <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</div>
    </Card>
  );
};

export default Scorecard;
