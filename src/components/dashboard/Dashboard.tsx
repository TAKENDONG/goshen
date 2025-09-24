import React, { useState } from 'react';
import {
  Egg,
  TrendingUp,
  DollarSign,
  Truck,
  AlertTriangle,
  Calendar,
  Bird,
  Wheat,
  Users,
  Shield
} from 'lucide-react';
import MetricCard from './MetricCard';
import MetricHistory from './MetricHistory';
import { useRoleAccess } from '../../hooks/useRoleAccess';

const Dashboard: React.FC = () => {
  const { userRole, getRoleDisplayName } = useRoleAccess();
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    metricType: 'production' | 'mortality' | 'feeding' | 'sales' | null;
    title: string;
  }>({
    isOpen: false,
    metricType: null,
    title: ''
  });

  // Mock data - will be replaced with real data from Supabase
  const mockData = {
    production: {
      trays: 142,
      individual: 10,
      broken: 12,
      total: 4250 // (142 * 30) + 10 - 12 = 4258
    },
    dailyProduction: 85.2,
    mortality: 12,
    dailyRevenue: 2840,
    feedStock: 2.5,
    pendingVaccinations: 2,
  };

  const openHistory = (metricType: 'production' | 'mortality' | 'feeding' | 'sales', title: string) => {
    setHistoryModal({
      isOpen: true,
      metricType,
      title
    });
  };

  const closeHistory = () => {
    setHistoryModal({
      isOpen: false,
      metricType: null,
      title: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Role-specific welcome */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Tableau de Bord - {getRoleDisplayName()}
            </h1>
            <p className="text-gray-600">
              {userRole === 'superadmin' && 'Vue d\'ensemble complète de l\'exploitation avicole et provenderie'}
              {userRole === 'farm_manager' && 'Gestion de votre exploitation avicole'}
              {userRole === 'feed_manager' && 'Gestion de la provenderie et production d\'aliments'}
              {userRole === 'accountant' && 'Suivi financier et ventes de l\'exploitation'}
              {userRole === 'employee' && 'Vue d\'ensemble de vos tâches quotidiennes'}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            {userRole === 'superadmin' && <Shield className="h-8 w-8 text-blue-600" />}
            {userRole === 'farm_manager' && <Bird className="h-8 w-8 text-blue-600" />}
            {userRole === 'feed_manager' && <Wheat className="h-8 w-8 text-blue-600" />}
            {userRole === 'accountant' && <DollarSign className="h-8 w-8 text-blue-600" />}
            {userRole === 'employee' && <Users className="h-8 w-8 text-blue-600" />}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Production d'œufs aujourd'hui"
          value={`${mockData.production.trays} alvéoles`}
          subtitle={`${mockData.production.individual} individuels • ${mockData.production.broken} cassés • Total: ${mockData.production.total}`}
          icon={Egg}
          color="green"
          trend={{ value: 3.2, isPositive: true }}
          onClick={() => openHistory('production', 'Production d\'œufs')}
          metricType="production"
        />

        <MetricCard
          title="Recettes du jour"
          value={`${mockData.dailyRevenue.toLocaleString()} CFA`}
          subtitle="Ventes d'œufs"
          icon={DollarSign}
          color="blue"
          trend={{ value: 5.8, isPositive: true }}
          onClick={() => openHistory('sales', 'Recettes')}
          metricType="sales"
        />

        <MetricCard
          title="Mortalité"
          value={mockData.mortality}
          subtitle="Dernières 24h"
          icon={AlertTriangle}
          color="red"
          trend={{ value: -1.2, isPositive: true }}
          onClick={() => openHistory('mortality', 'Mortalité')}
          metricType="mortality"
        />

        <MetricCard
          title="Stock d'aliment"
          value={`${mockData.feedStock}T`}
          subtitle="Jours restants: 3"
          icon={Wheat}
          color="amber"
          onClick={() => openHistory('feeding', 'Consommation d\'aliment')}
          metricType="feeding"
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

      {/* Alerts & Reminders */}
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

      {/* Metric History Modal */}
      <MetricHistory
        isOpen={historyModal.isOpen}
        onClose={closeHistory}
        metricType={historyModal.metricType}
        title={historyModal.title}
      />
    </div>
  );
};

export default Dashboard;