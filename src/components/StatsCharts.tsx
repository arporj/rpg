import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
);

interface StatsChartsProps {
  radarData: number[];
  encounterData: { name: string; value: number }[];
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ radarData, encounterData }) => {
  const radarChartData = {
    labels: ['MAGIA', 'FORÇA', 'AGILIDADE', 'ASTÚCIA', 'CARISMA'],
    datasets: [
      {
        label: 'Nível Médio',
        data: radarData,
        backgroundColor: 'rgba(217, 119, 6, 0.2)',
        borderColor: '#d97706',
        borderWidth: 2,
        pointBackgroundColor: '#d97706',
      },
    ],
  };

  const doughnutChartData = {
    labels: encounterData.map(e => e.name),
    datasets: [
      {
        data: encounterData.map(e => e.value),
        backgroundColor: ['#b71c1c', '#0d47a1', '#1b5e20', '#f57f17'],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: { display: false },
        grid: { color: 'rgba(217, 119, 6, 0.1)' },
        pointLabels: { 
          color: 'rgba(244, 228, 188, 0.6)',
          font: { family: 'Cinzel', size: 10 } 
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(244, 228, 188, 0.6)',
          font: { family: 'Inter', size: 10 },
          padding: 20,
        },
      },
    },
    cutout: '75%',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
      <div className="h-64 flex items-center justify-center">
        <Radar data={radarChartData} options={radarOptions} />
      </div>
      <div className="h-64 flex items-center justify-center">
        <Doughnut data={doughnutChartData} options={doughnutOptions} />
      </div>
    </div>
  );
};
