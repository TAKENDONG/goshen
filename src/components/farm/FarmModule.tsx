import React, { useState } from 'react';
import {
  Bird,
  Egg,
  AlertTriangle,
  Wheat,
  Syringe,
  Plus,
  TrendingUp
} from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import EggProductionForm from '../forms/EggProductionForm';
import MortalityForm from '../forms/MortalityForm';
import FeedConsumptionForm from '../forms/FeedConsumptionForm';
import VaccinationForm from '../forms/VaccinationForm';

const FarmModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('production');
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [showMortalityForm, setShowMortalityForm] = useState(false);
  const [showFeedForm, setShowFeedForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);

  // Define the type for a flock
  type Flock = {
    id: string;
    name: string;
    capacity: number;
    current_count: number;
  };

  // Real data from Supabase
  const {
    data: flocks,
    loading: flocksLoading,
    refetch: refetchFlocks
  } = useSupabaseData<Flock>('flocks', 'id, name, capacity, current_count');

  const {
    data: todayProductions,
    refetch: refetchProductions
  } = useSupabaseData<EggProduction>('egg_productions', `
    id, eggs_produced, flock_id,
    flocks(name)
  `, [new Date().toISOString().split('T')[0]]);

  const {
    data: todayMortalities,
    refetch: refetchMortalities
  } = useSupabaseData<Mortality>('mortalities', `
    id, deaths, cause, flock_id,
    flocks(name)
  `, [new Date().toISOString().split('T')[0]]);

  const {
    data: todayFeedings,
    refetch: refetchFeedings
  } = useSupabaseData<FeedConsumption>('feed_consumptions', `
    id, quantity_kg, feed_type, flock_id,
    flocks(name)
  `, [new Date().toISOString().split('T')[0]]);

  type Vaccination = {
    id: string;
    vaccine_name: string;
    scheduled_date: string;
    completed_date?: string | null;
    cost: number | null;
    status: 'completed' | 'overdue' | 'scheduled' | string;
    flock_id: string;
    flocks?: { name: string };
  };

  const {
    data: vaccinations,
    loading: vaccinationsLoading,
    refetch: refetchVaccinations
  } = useSupabaseData<Vaccination>('vaccinations', `
    id, vaccine_name, scheduled_date, completed_date, cost, status, flock_id,
    flocks(name)
  `);

  const tabs = [
    { id: 'production', label: 'Production d\'œufs', icon: Egg },
    { id: 'mortality', label: 'Mortalité', icon: AlertTriangle },
    { id: 'feeding', label: 'Alimentation', icon: Wheat },
    { id: 'health', label: 'Prophylaxie', icon: Syringe },
  ];

  // Define the type for egg production
  type EggProduction = {
    id: string;
    eggs_produced: number;
    flock_id: string;
    flocks?: { name: string };
  };

  // Calculate today's production for each flock
  const getFlockProduction = (flockId: string) => {
    const production = todayProductions?.find((p) => p.flock_id === flockId);
    return production ? production.eggs_produced : 0;
  };

  const handleProductionSuccess = () => {
    refetchProductions();
    refetchFlocks();
  };

  const handleMortalitySuccess = () => {
    refetchMortalities();
    refetchFlocks();
  };

  // Calculate today's mortality for each flock
  type Mortality = {
    id: string;
    deaths: number;
    cause: string;
    flock_id: string;
    flocks?: { name: string };
  };

  const getFlockMortality = (flockId: string) => {
    const mortality = todayMortalities?.find((m) => m.flock_id === flockId);
    return mortality ? mortality.deaths : 0;
  };

  const handleFeedSuccess = () => {
    refetchFeedings();
    refetchFlocks();
  };

  // Define the type for feed consumption
  type FeedConsumption = {
    id: string;
    quantity_kg: number;
    feed_type: string;
    flock_id: string;
    flocks?: { name: string };
  };

  // Calculate today's feed consumption for each flock
  const getFlockFeedConsumption = (flockId: string) => {
    const feeding = todayFeedings?.find(f => f.flock_id === flockId);
    return feeding ? feeding.quantity_kg : 0;
  };

  const getFlockFeedType = (flockId: string) => {
    const feeding = todayFeedings?.find(f => f.flock_id === flockId);
    return feeding ? feeding.feed_type : 'Non distribué';
  };

  const handleVaccinationSuccess = () => {
    refetchVaccinations();
    refetchFlocks();
  };

  const renderProductionTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Production par Bande</h3>
          <button
            onClick={() => setShowProductionForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Saisie
          </button>
        </div>
        
        {flocksLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des troupeaux...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(flocks ?? []).map((flock) => {
              const production = getFlockProduction(flock.id);
              const layingRate = flock.current_count > 0 ? (production / flock.current_count * 100).toFixed(1) : '0.0';

              return (
                <div key={flock.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{flock.name}</h4>
                    <Bird className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effectif:</span>
                      <span className="font-medium">{flock.current_count}/{flock.capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Œufs aujourd'hui:</span>
                      <span className="font-medium text-green-600">{production}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux de ponte:</span>
                      <span className="font-medium">{layingRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Évolution de la Production</h3>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Graphique de production - À implémenter</p>
        </div>
      </div>
    </div>
  );

  const renderMortalityTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Suivi de Mortalité</h3>
          <button
            onClick={() => setShowMortalityForm(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Déclarer Mortalité
          </button>
        </div>
        
        {flocksLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des troupeaux...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(flocks ?? []).map((flock) => {
              const mortality = getFlockMortality(flock.id);
              const mortalityRate = flock.current_count > 0 ? (mortality / flock.current_count * 100).toFixed(2) : '0.00';

              return (
                <div key={flock.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{flock.name}</h4>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Morts aujourd'hui:</span>
                      <span className="font-medium text-red-600">{mortality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effectif actuel:</span>
                      <span className="font-medium">{flock.current_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux mortalité:</span>
                      <span className="font-medium">{mortalityRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderFeedingTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Consommation Alimentaire</h3>
          <button
            onClick={() => setShowFeedForm(true)}
            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Saisir Distribution
          </button>
        </div>
        
        {flocksLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des troupeaux...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(flocks ?? []).map((flock) => {
              const feedQuantity = getFlockFeedConsumption(flock.id);
              const feedType = getFlockFeedType(flock.id);
              const consumptionPerBird = flock.current_count > 0 ? ((feedQuantity * 1000) / flock.current_count).toFixed(0) : '0';

              return (
                <div key={flock.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{flock.name}</h4>
                    <Wheat className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distribué aujourd'hui:</span>
                      <span className="font-medium text-amber-600">{feedQuantity} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consommation/poule:</span>
                      <span className="font-medium">{consumptionPerBird}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type d'aliment:</span>
                      <span className="font-medium text-xs">{feedType}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Programme de Prophylaxie</h3>
          <button
            onClick={() => setShowVaccinationForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Programmer Vaccin
          </button>
        </div>
        
        {vaccinationsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des vaccinations...</p>
          </div>
        ) : (vaccinations?.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune vaccination programmée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(vaccinations ?? []).map((vaccination) => {
              const scheduledDate = new Date(vaccination.scheduled_date);
              const today = new Date();
              const diffTime = scheduledDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              let statusColor = 'gray';
              let bgColor = 'gray-50';
              let statusText = 'Programmé';

              if (vaccination.status === 'completed') {
                statusColor = 'green';
                bgColor = 'green-50';
                statusText = 'Complété';
              } else if (vaccination.status === 'overdue' || diffDays < 0) {
                statusColor = 'red';
                bgColor = 'red-50';
                statusText = 'En retard';
              } else if (diffDays <= 7) {
                statusColor = 'amber';
                bgColor = 'amber-50';
                statusText = `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
              }

              return (
                <div key={vaccination.id} className={`border border-${statusColor}-200 bg-${bgColor} rounded-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Syringe className={`h-5 w-5 text-${statusColor}-600 mr-3`} />
                      <div>
                        <h4 className={`font-medium text-${statusColor}-800`}>
                          {vaccination.vaccine_name} - {vaccination.flocks?.name}
                        </h4>
                        <p className={`text-sm text-${statusColor}-600`}>
                          {vaccination.status === 'completed' ?
                            `Effectué le ${new Date(vaccination.completed_date || vaccination.scheduled_date).toLocaleDateString()}` :
                            `Programmé pour le ${scheduledDate.toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium text-${statusColor}-800`}>{statusText}</p>
                      <p className={`text-xs text-${statusColor}-600`}>
                        Coût: {(vaccination.cost ?? 0).toLocaleString()} CFA
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'production':
        return renderProductionTab();
      case 'mortality':
        return renderMortalityTab();
      case 'feeding':
        return renderFeedingTab();
      case 'health':
        return renderHealthTab();
      default:
        return renderProductionTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Production Form Modal */}
      <EggProductionForm
        isOpen={showProductionForm}
        onClose={() => setShowProductionForm(false)}
        onSuccess={handleProductionSuccess}
      />

      {/* Mortality Form Modal */}
      <MortalityForm
        isOpen={showMortalityForm}
        onClose={() => setShowMortalityForm(false)}
        onSuccess={handleMortalitySuccess}
      />

      {/* Feed Consumption Form Modal */}
      <FeedConsumptionForm
        isOpen={showFeedForm}
        onClose={() => setShowFeedForm(false)}
        onSuccess={handleFeedSuccess}
      />

      {/* Vaccination Form Modal */}
      <VaccinationForm
        isOpen={showVaccinationForm}
        onClose={() => setShowVaccinationForm(false)}
        onSuccess={handleVaccinationSuccess}
      />
    </div>
  );
};

export default FarmModule;