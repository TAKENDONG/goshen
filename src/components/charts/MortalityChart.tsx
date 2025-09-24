import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Calendar, AlertTriangle, Skull, Filter, TrendingDown } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MortalityChartProps {
  flockId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  chartType?: 'line' | 'bar';
}

const MortalityChart: React.FC<MortalityChartProps> = ({
  flockId,
  timeRange = '30d',
  chartType = 'line'
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedFlock, setSelectedFlock] = useState(flockId || '');
  const [selectedChartType, setSelectedChartType] = useState(chartType);

  // Récupérer les données des troupeaux
  const { data: flocks } = useSupabaseData('flocks', 'id, name, status, current_count');

  // Récupérer les données de mortalité
  const { data: mortalityData, loading } = useSupabaseData(
    'mortality',
    'id, flock_id, date, deaths, cause',
    selectedFlock ? `flock_id.eq.${selectedFlock}` : undefined
  );

  // Calculer la période
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (selectedTimeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return { start, end };
  };

  // Traiter les données pour le graphique
  const processChartData = () => {
    if (!mortalityData || mortalityData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Filtrer par période
    const { start, end } = getDateRange();
    const filteredData = mortalityData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });

    // Trier par date
    const sortedData = filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Grouper par bande si on affiche toutes les bandes
    const flockGroups = selectedFlock ?
      { [selectedFlock]: sortedData } :
      sortedData.reduce((groups: any, item) => {
        const flockId = item.flock_id;
        if (!groups[flockId]) groups[flockId] = [];
        groups[flockId].push(item);
        return groups;
      }, {});

    // Créer les labels (dates)
    const allDates = [...new Set(sortedData.map(item => item.date))].sort();
    const labels = allDates.map(date =>
      new Date(date).toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric'
      })
    );

    // Couleurs pour différentes bandes (tons plus sombres pour la mortalité)
    const colors = [
      { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgb(239, 68, 68)' },
      { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgb(245, 158, 11)' },
      { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgb(168, 85, 247)' },
      { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgb(107, 114, 128)' },
      { bg: 'rgba(185, 28, 28, 0.2)', border: 'rgb(185, 28, 28)' },
    ];

    // Créer les datasets
    const datasets = Object.entries(flockGroups).map(([flockId, data]: any, index) => {
      const flock = flocks?.find(f => f.id === flockId);
      const flockName = flock?.name || `Bande ${flockId}`;
      const color = colors[index % colors.length];

      const dataPoints = allDates.map(date => {
        const dayData = data.find((item: any) => item.date === date);
        return dayData ? dayData.deaths : null;
      });

      return {
        label: flockName,
        data: dataPoints,
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        fill: selectedChartType === 'line',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true,
      };
    });

    return { labels, datasets };
  };

  // Calculer le taux de mortalité
  const calculateMortalityRate = () => {
    if (!mortalityData || !flocks) return 0;

    const totalDeaths = mortalityData.reduce((sum, item) => sum + item.deaths, 0);
    const selectedFlockData = flocks.find(f => f.id === selectedFlock);

    if (selectedFlockData) {
      return ((totalDeaths / selectedFlockData.current_count) * 100).toFixed(2);
    }

    // Pour toutes les bandes
    const totalBirds = flocks.reduce((sum, flock) => sum + flock.current_count, 0);
    return ((totalDeaths / totalBirds) * 100).toFixed(2);
  };

  // Analyser les causes principales
  const analyzeCauses = () => {
    if (!mortalityData) return {};

    const { start, end } = getDateRange();
    const filteredData = mortalityData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });

    const causes = filteredData.reduce((acc: any, item) => {
      const cause = item.cause || 'Non spécifiée';
      acc[cause] = (acc[cause] || 0) + item.deaths;
      return acc;
    }, {});

    return Object.entries(causes)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3);
  };

  const chartData = processChartData();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Mortalité par bande',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y || 0} décès`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Nombre de décès',
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const timeRangeOptions = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '3 mois' },
    { value: '1y', label: '1 an' },
  ];

  const ChartComponent = selectedChartType === 'line' ? Line : Bar;
  const topCauses = analyzeCauses();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* En-tête avec filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="p-2 bg-red-100 rounded-lg mr-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Suivi de Mortalité</h3>
            <p className="text-sm text-gray-600">Analyse par bande d'élevage</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Type de graphique */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedChartType}
              onChange={(e) => setSelectedChartType(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="line">Ligne</option>
              <option value="bar">Barres</option>
            </select>
          </div>

          {/* Sélecteur de bande */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedFlock}
              onChange={(e) => setSelectedFlock(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Toutes les bandes</option>
              {flocks?.filter(f => f.status === 'active').map(flock => (
                <option key={flock.id} value={flock.id}>{flock.name}</option>
              ))}
            </select>
          </div>

          {/* Sélecteur de période */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {mortalityData && mortalityData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <Skull className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total décès</p>
                <p className="text-lg font-bold text-red-600">
                  {mortalityData.reduce((sum, item) => sum + item.deaths, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Taux de mortalité</p>
                <p className="text-lg font-bold text-orange-600">
                  {calculateMortalityRate()}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Moyenne/jour</p>
                <p className="text-lg font-bold text-purple-600">
                  {mortalityData.length > 0 ?
                    (mortalityData.reduce((sum, item) => sum + item.deaths, 0) / mortalityData.length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Cause principale</p>
                <p className="text-lg font-bold text-gray-600 truncate">
                  {topCauses.length > 0 ? topCauses[0][0] : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyse des causes principales */}
      {topCauses.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Principales causes de mortalité</h4>
          <div className="space-y-2">
            {topCauses.map(([cause, count]: any, index) => (
              <div key={cause} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{index + 1}. {cause}</span>
                <span className="text-sm font-medium text-gray-800">{count} cas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="h-96">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-gray-600">Chargement des données...</span>
          </div>
        ) : chartData.labels.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune donnée de mortalité disponible</p>
              <p className="text-sm text-gray-400">Les données apparaîtront après enregistrement</p>
            </div>
          </div>
        ) : (
          <ChartComponent data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default MortalityChart;