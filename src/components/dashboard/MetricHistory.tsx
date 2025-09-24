import React, { useState, useEffect } from 'react';
import { X, Calendar, Filter, Bird, TrendingUp, Download } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { Flock } from '../../types';
import Modal from '../ui/Modal';

interface MetricHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'production' | 'mortality' | 'feeding' | 'sales' | null;
  title: string;
}

interface HistoryData {
  date: string;
  value: number;
  flock_name?: string;
  flock_id?: string;
  additional_info?: string;
  // Spécifique aux œufs
  trays_count?: number;
  individual_eggs?: number;
  broken_eggs?: number;
}

const MetricHistory: React.FC<MetricHistoryProps> = ({
  isOpen,
  onClose,
  metricType,
  title
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedFlock, setSelectedFlock] = useState<string>('all');
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    data: flocks
  } = useSupabaseData<Flock>('flocks', 'id, name');

  const getMetricIcon = () => {
    const iconMap = {
      production: '🥚',
      mortality: '⚠️',
      feeding: '🌾',
      sales: '💰'
    };
    return iconMap[metricType || 'production'];
  };

  const fetchHistoryData = async () => {
    if (!metricType) return;

    setLoading(true);
    try {
      let query = '';
      let tableName = '';

      switch (metricType) {
        case 'production':
          tableName = 'egg_productions';
          query = `
            date, eggs_produced, flock_id,
            flocks(name)
          `;
          break;
        case 'mortality':
          tableName = 'mortalities';
          query = `
            date, deaths, flock_id,
            flocks(name)
          `;
          break;
        case 'feeding':
          tableName = 'feed_consumptions';
          query = `
            date, quantity_kg, flock_id,
            flocks(name)
          `;
          break;
        case 'sales':
          tableName = 'egg_sales';
          query = `
            date, total_amount, client_name
          `;
          break;
      }

      // Simulation de données pour démonstration
      // En réalité, vous utiliseriez useSupabaseData avec les filtres appropriés
      const mockData: HistoryData[] = [];
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        if (metricType === 'production') {
          const trays = Math.floor(Math.random() * 50) + 100;
          const individual = Math.floor(Math.random() * 30);
          const broken = Math.floor(Math.random() * 20);
          const total = (trays * 30) + individual - broken;

          mockData.push({
            date: dateStr,
            value: total,
            trays_count: trays,
            individual_eggs: individual,
            broken_eggs: broken,
            flock_name: 'Bande A',
            flock_id: '1'
          });
        } else if (metricType === 'mortality') {
          mockData.push({
            date: dateStr,
            value: Math.floor(Math.random() * 20),
            flock_name: 'Bande A',
            flock_id: '1'
          });
        } else if (metricType === 'feeding') {
          mockData.push({
            date: dateStr,
            value: Math.floor(Math.random() * 200) + 800,
            flock_name: 'Bande A',
            flock_id: '1'
          });
        } else if (metricType === 'sales') {
          mockData.push({
            date: dateStr,
            value: Math.floor(Math.random() * 50000) + 100000,
            additional_info: `Client ${Math.floor(Math.random() * 10) + 1}`
          });
        }
      }

      // Filtrer par bande si sélectionnée
      const filteredData = selectedFlock === 'all'
        ? mockData
        : mockData.filter(item => item.flock_id === selectedFlock);

      setHistoryData(filteredData.reverse()); // Plus récent en premier
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && metricType) {
      fetchHistoryData();
    }
  }, [isOpen, metricType, dateRange, selectedFlock]);

  const formatValue = (value: number, type: string, item?: HistoryData) => {
    switch (type) {
      case 'production':
        if (item?.trays_count !== undefined) {
          return `${item.trays_count} alvéoles + ${item.individual_eggs || 0} - ${item.broken_eggs || 0} = ${value} œufs`;
        }
        return `${value.toLocaleString()} œufs`;
      case 'mortality':
        return `${value} morts`;
      case 'feeding':
        return `${value} kg`;
      case 'sales':
        return `${value.toLocaleString()} CFA`;
      default:
        return value.toString();
    }
  };

  const calculateStats = () => {
    if (historyData.length === 0) return { total: 0, average: 0, trend: 0 };

    const total = historyData.reduce((sum, item) => sum + item.value, 0);
    const average = total / historyData.length;

    // Calcul de tendance (derniers 7 jours vs 7 jours précédents)
    const recent = historyData.slice(0, 7);
    const previous = historyData.slice(7, 14);
    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.value, 0) / previous.length;
    const trend = previous.length > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    return { total, average, trend };
  };

  const stats = calculateStats();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historique - ${title}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Filtres */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {metricType !== 'sales' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bande
                </label>
                <select
                  value={selectedFlock}
                  onChange={(e) => setSelectedFlock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les bandes</option>
                  {flocks.map((flock) => (
                    <option key={flock.id} value={flock.id}>
                      {flock.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-blue-600 text-2xl mr-3">📊</div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-lg font-bold text-blue-800">
                  {metricType === 'production' ? `${stats.total.toLocaleString()} œufs` : formatValue(stats.total, metricType || '')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-600 text-2xl mr-3">📈</div>
              <div>
                <p className="text-sm text-green-600 font-medium">Moyenne</p>
                <p className="text-lg font-bold text-green-800">
                  {metricType === 'production' ? `${Math.round(stats.average).toLocaleString()} œufs` : formatValue(Math.round(stats.average), metricType || '')}
                </p>
              </div>
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${
            stats.trend >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              <div className={`text-2xl mr-3 ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.trend >= 0 ? '📈' : '📉'}
              </div>
              <div>
                <p className={`text-sm font-medium ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Tendance (7j)
                </p>
                <p className={`text-lg font-bold ${stats.trend >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Données historiques */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="text-2xl mr-2">{getMetricIcon()}</span>
              Données historiques
            </h3>
            <button className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800">
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Chargement...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune donnée pour cette période</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {historyData.map((item, index) => (
                  <div key={index} className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(item.date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                        {item.flock_name && (
                          <p className="text-xs text-gray-500">{item.flock_name}</p>
                        )}
                        {item.additional_info && (
                          <p className="text-xs text-gray-500">{item.additional_info}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatValue(item.value, metricType || '', item)}
                      </p>
                      {metricType === 'production' && item.trays_count !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                            {item.trays_count} alvéoles
                          </span>
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1">
                            +{item.individual_eggs}
                          </span>
                          <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded">
                            -{item.broken_eggs}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MetricHistory;