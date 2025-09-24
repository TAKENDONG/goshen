import React, { useState } from 'react';
import { BarChart3, Filter, Download, RefreshCw } from 'lucide-react';
import ProductionChart from './ProductionChart';
import MortalityChart from './MortalityChart';
import { useSupabaseData } from '../../hooks/useSupabaseData';

const FlockAnalytics: React.FC = () => {
  const [selectedFlock, setSelectedFlock] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeView, setActiveView] = useState<'both' | 'production' | 'mortality'>('both');

  // Récupérer les troupeaux
  const { data: flocks, loading: flocksLoading, refetch: refetchFlocks } = useSupabaseData(
    'flocks',
    'id, name, status, capacity, current_count, start_date'
  );

  const timeRangeOptions = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '3 mois' },
    { value: '1y', label: '1 an' },
  ];

  const viewOptions = [
    { value: 'both', label: 'Production & Mortalité' },
    { value: 'production', label: 'Production seulement' },
    { value: 'mortality', label: 'Mortalité seulement' },
  ];

  const activeFlocks = flocks?.filter(flock => flock.status === 'active') || [];

  const handleExportData = () => {
    // Placeholder pour export de données
    alert('Fonctionnalité d\'export en cours de développement');
  };

  const handleRefresh = () => {
    refetchFlocks();
    // Déclencher le refresh des graphiques
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* En-tête et contrôles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center mb-4 lg:mb-0">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Analyse des Bandes</h2>
              <p className="text-gray-600">Suivi de production et mortalité par bande d'élevage</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>

        {/* Filtres globaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bande d'élevage
            </label>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedFlock}
                onChange={(e) => setSelectedFlock(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={flocksLoading}
              >
                <option value="">Toutes les bandes ({activeFlocks.length})</option>
                {activeFlocks.map(flock => (
                  <option key={flock.id} value={flock.id}>
                    {flock.name} ({flock.current_count}/{flock.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période d'analyse
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vue d'analyse
            </label>
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {viewOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Résumé des bandes actives */}
        {activeFlocks.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Bandes actives ({activeFlocks.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeFlocks.map(flock => (
                <div
                  key={flock.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedFlock === flock.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFlock(selectedFlock === flock.id ? '' : flock.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{flock.name}</p>
                      <p className="text-sm text-gray-600">
                        {flock.current_count}/{flock.capacity} poules
                      </p>
                      <p className="text-xs text-gray-500">
                        Démarré le {new Date(flock.start_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded ${
                        (flock.current_count / flock.capacity) > 0.9
                          ? 'bg-green-100 text-green-800'
                          : (flock.current_count / flock.capacity) > 0.7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round((flock.current_count / flock.capacity) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Graphiques */}
      <div className="space-y-6">
        {(activeView === 'both' || activeView === 'production') && (
          <ProductionChart
            flockId={selectedFlock || undefined}
            timeRange={timeRange}
          />
        )}

        {(activeView === 'both' || activeView === 'mortality') && (
          <MortalityChart
            flockId={selectedFlock || undefined}
            timeRange={timeRange}
          />
        )}
      </div>

      {/* Message si pas de bandes */}
      {!flocksLoading && activeFlocks.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Aucune bande active
          </h3>
          <p className="text-gray-600 mb-4">
            Créez votre première bande d'élevage pour commencer l'analyse
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ajouter une bande
          </button>
        </div>
      )}
    </div>
  );
};

export default FlockAnalytics;