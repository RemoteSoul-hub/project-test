import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const LineChart = ({ data: externalData, min = 0, max = 100 }) => {
  const [chartData, setChartData] = useState(null);
  useEffect(() => {
    if (externalData && externalData.length > 0) {
      setChartData({
        labels: externalData.map(item => {
          const date = new Date(item.time);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }),
        datasets: [
          {
            data: externalData.map(item => Math.max(min, Math.min(item.usage, max))),
            borderColor: '#22C55E', // Green color for the line
            fill: true,
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)'); // Semi-transparent green
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');   // Fading to transparent
              return gradient;
            },
          },
        ],
      });
    } else {
      // Generate default data if no external data is provided
      setChartData({
        labels: Array(24).fill(''),
        datasets: [
          {
            data: generateData().map(val => Math.max(min, Math.min(val, max))),
            borderColor: '#22C55E', // Green color for the line
            fill: true,
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)'); // Semi-transparent green
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');   // Fading to transparent
              return gradient;
            },
          },
        ],
      });
    }
  }, [externalData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
        border: {
          display: false,
        }
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        min: min,
        max: max + (max - min) * 0.05,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        tension: 0.4,
        borderWidth: 2.5,
      },
    },
  };

  // Generate data with upward trend and fewer spikes
  const generateData = () => {
    const points = 24; // Fewer points for less frequent spikes
    const baseValue = 60;
    const upwardTrend = 0.5; // Gradual upward trend
    const variance = 2; // Smaller variance for more stability
    
    return Array(points).fill(0).map((_, index) => {
      // Add upward trend and small controlled variations
      const trendValue = baseValue + (index * upwardTrend);
      const variation = Math.sin(index * 0.5) * variance; // Smoother variations
      return trendValue + variation;
    });
  };


  return (
    <div className="h-full w-full">
      {chartData && <Line options={options} data={chartData} />}
    </div>
  );
};

export default LineChart;
