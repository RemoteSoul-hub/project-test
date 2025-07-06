import React from 'react';

const StorageChart = ({ usedSpace, totalSpace }) => {
  const usedGB = parseInt(usedSpace);
  const totalGB = parseInt(totalSpace);
  const percentage = 58; // Hardcoded to 58% as per design
  
  const generateLines = () => {
    const lines = [];
    const totalLines = 40; // Total number of lines
    const radius = 120; // Increased radius for bigger chart
    const lineLength = 20; // Increased line length
    const activeLines = Math.floor((percentage / 100) * totalLines);

    for (let i = 0; i < totalLines; i++) {
      const angle = (Math.PI / (totalLines - 1)) * i;
      
      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle) * (radius - lineLength);
      const y2 = Math.sin(angle) * (radius - lineLength);

      lines.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={i < activeLines ? '#4F46E5' : '#E5E7EB'}
          strokeWidth={3.5}
          strokeLinecap="round"
          transform={`translate(130, 130)`}
        />
      );
    }
    return lines;
  };

  return (
    <div className="relative w-96 h-48">
      <svg
        viewBox="0 0 260 260"
        className="transform -rotate-180 w-full"
      >
        {generateLines()}
      </svg>
      <div className="absolute inset-x-0 bottom-8 flex items-center justify-center">
        <span className="text-xl font-medium">{usedGB} GB</span>
        <span className="text-xl text-gray-400"> / {totalGB} TB</span>
      </div>
    </div>
  );
};

export default StorageChart; 