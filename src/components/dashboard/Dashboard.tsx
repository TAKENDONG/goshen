import React from 'react';
import { 
  Egg, 
  TrendingUp, 
  DollarSign, 
  Truck,
  AlertTriangle,
  Calendar,
  Bird,
  Wheat
} from 'lucide-react';
import MetricCard from './MetricCard';

const Dashboard: React.FC = () => {
  // Mock data - will be replaced with real data from Supabase
  const mockData = {
    totalEggs: 4250,
    dailyProduction: 85.2,
    mortality: 12,
    dailyRevenue: 2840,
    feedStock: 2.5,
    pendingVaccinations: 2,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Tableau de Bord
        </h1>
        <p className="text-gray-600">
          Vue d'ensemble de votre exploitation avicole et provenderie
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Œufs produits aujourd'hui"
          value={mockData.totalEggs}
          subtitle={`Taux: ${mockData.dailyProduction}%`}
          icon={Egg}
          color="green"
          trend={{ value: 3.2, isPositive: true }}
        />
        
        <MetricCard
          title="Recettes du jour"
          value={`${mockData.dailyRevenue.toLocaleString()} CFA`}
          subtitle="Ventes d'œufs"
          icon={DollarSign}
          color="blue"
          trend={{ value: 5.8, isPositive: true }}
        />

        <MetricCard
          title="Mortalité"
          value={mockData.mortality}
          subtitle="Dernières 24h"
          icon={AlertTriangle}
          color="red"
          trend={{ value: -1.2, isPositive: true }}
        />

        <MetricCard
          title="Stock d'aliment"
          value={`${mockData.feedStock}T`}
          subtitle="Jours restants: 3"
          icon={Wheat}
          color="amber"
        />

        <MetricCard
          title="Vaccinations en attente"
          value={mockData.pendingVaccinations}
          subtitle="Cette semaine"
          icon={Calendar}
          color="purple"
        />

        <MetricCard
          title="Effectif total"
          value="4,988"
          subtitle="Sur 5,000 capacity"
          icon={Bird}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Saisies Rapides
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <Egg className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <span className="text-sm font-medium">Ponte</span>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-red-600" />
              <span className="text-sm font-medium">Mortalité</span>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <span className="text-sm font-medium">Vente</span>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <Truck className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <span className="text-sm font-medium">Livraison</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Alertes & Rappels
          </h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Calendar className="h-4 w-4 text-amber-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Vaccination Newcastle
                </p>
                <p className="text-xs text-amber-600">Bande A - Dans 2 jours</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Stock d'aliment faible
                </p>
                <p className="text-xs text-red-600">Réapprovisionner sous 3 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;