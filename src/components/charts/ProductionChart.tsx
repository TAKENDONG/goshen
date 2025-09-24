import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Calendar, TrendingUp, Egg, Filter } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProductionChartProps {
  flockId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  showComparison?: boolean;
}

const ProductionChart: React.FC<ProductionChartProps> = ({
  flockId,
  timeRange = '30d',
  showComparison = false
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedFlock, setSelectedFlock] = useState(flockId || '');

  // Récupérer les données des troupeaux
  const { data: flocks } = useSupabaseData('flocks', 'id, name, status');

  // Récupérer les données de production d'œufs
  const { data: productionData, loading } = useSupabaseData(
    'egg_production',
    'id, flock_id, date, eggs_produced, trays_count, individual_eggs, broken_eggs',
    selectedFlock ? `flock_id.eq.${selectedFlock}` : undefined
  );

  // Calculer la période en fonction du timeRange
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
    if (!productionData || productionData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Filtrer par période
    const { start, end } = getDateRange();
    const filteredData = productionData.filter(item => {
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

    // Couleurs pour différentes bandes
    const colors = [
      { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgb(59, 130, 246)' },
      { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgb(16, 185, 129)' },
      { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgb(245, 158, 11)' },
      { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)' },
      { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgb(139, 92, 246)' },
    ];

    // Créer les datasets
    const datasets = Object.entries(flockGroups).map(([flockId, data]: any, index) => {
      const flockName = flocks?.find(f => f.id === flockId)?.name || `Bande ${flockId}`;
      const color = colors[index % colors.length];

      const dataPoints = allDates.map(date => {
        const dayData = data.find((item: any) => item.date === date);
        return dayData ? dayData.eggs_produced : null;
      });

      return {
        label: flockName,
        data: dataPoints,
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true,
      };
    });

    return { labels, datasets };
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
        text: 'Production d\'œufs par bande',
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
            return `${context.dataset.label}: ${context.parsed.y || 0} œufs`;
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
          text: 'Nombre d\'œufs',
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* En-tête avec filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Production d'Œufs</h3>
            <p className="text-sm text-gray-600">Suivi par bande d'élevage</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sélecteur de bande */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedFlock}
              onChange={(e) => setSelectedFlock(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {productionData && productionData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Egg className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Production totale</p>
                <p className="text-lg font-bold text-blue-600">
                  {productionData.reduce((sum, item) => sum + (item.eggs_produced || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Moyenne journalière</p>
                <p className="text-lg font-bold text-green-600">
                  {Math.round(productionData.reduce((sum, item) => sum + (item.eggs_produced || 0), 0) / productionData.length)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Jours enregistrés</p>
                <p className="text-lg font-bold text-orange-600">{productionData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Egg className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Meilleur jour</p>
                <p className="text-lg font-bold text-purple-600">
                  {Math.max(...productionData.map(item => item.eggs_produced || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="h-96">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement des données...</span>
          </div>
        ) : chartData.labels.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Egg className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune donnée de production disponible</p>
              <p className="text-sm text-gray-400">Commencez par enregistrer la production d'œufs</p>
            </div>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default ProductionChart;