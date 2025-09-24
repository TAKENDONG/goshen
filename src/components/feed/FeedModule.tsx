import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import {
  Wheat,
  Package,
  Factory,
  Truck,
  Plus,
  AlertTriangle,
  TrendingDown,
  ArrowDown,
  Settings,
  Zap
} from 'lucide-react';
import FeedEntryForm from '../forms/FeedEntryForm';
import NewMaterialForm from '../forms/NewMaterialForm';
import FeedSalesForm from '../forms/FeedSalesForm';
import MillRevenueForm from '../forms/MillRevenueForm';
import MachineRevenueForm from '../forms/MachineRevenueForm';
import RoleBasedAccess, { FeedManagerOnly, NotEmployee } from '../common/RoleBasedAccess';
import { usePermissions } from '../../hooks/usePermissions';

const FeedModule: React.FC = () => {
  const { canManageFeed, canViewFinancials, isEmployee, userRole } = usePermissions();
  const [activeTab, setActiveTab] = useState('stock');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false);
  const [showFeedSalesForm, setShowFeedSalesForm] = useState(false);
  const [showMillHistory, setShowMillHistory] = useState(false);
  const [showMachineHistory, setShowMachineHistory] = useState(false);
  const [showMillRevenueForm, setShowMillRevenueForm] = useState(false);
  const [showMachineRevenueForm, setShowMachineRevenueForm] = useState(false);

  // All available tabs with permission requirements
  const allTabs = [
    { id: 'stock', label: 'Stock Mat. Premières', icon: Package, roles: ['superadmin', 'feed_manager'] },
    { id: 'entries', label: 'Entrées', icon: ArrowDown, roles: ['superadmin', 'feed_manager'] },
    { id: 'production', label: 'Production', icon: Factory, roles: ['superadmin', 'feed_manager'] },
    { id: 'sales', label: 'Ventes Externes', icon: Truck, roles: ['superadmin', 'feed_manager'] },
  ];

  // Filter tabs based on user permissions
  const tabs = allTabs.filter(tab =>
    tab.roles.includes(userRole) || canManageFeed()
  );

  // Real data from Supabase
  const {
    data: rawMaterials,
    loading: rawMaterialsLoading,
    refetch: refetchRawMaterials
  } = useSupabaseData<any>('raw_materials', 'id, name, category, unit, current_stock, unit_price, supplier');

  const {
    data: feedEntries,
    loading: feedEntriesLoading,
    refetch: refetchFeedEntries
  } = useSupabaseData<any>('feed_entries', 'id, material_name, quantity, unit_price, supplier, delivery_date, batch_number, total_amount');

  const {
    data: millRevenues,
    loading: millRevenuesLoading,
    refetch: refetchMillRevenues
  } = useSupabaseData<any>('mill_revenues', 'id, date, amount');

  const {
    data: machineRevenues,
    loading: machineRevenuesLoading,
    refetch: refetchMachineRevenues
  } = useSupabaseData<any>('machine_revenues', 'id, date, quantity, amount');

  const {
    data: feedSales,
    loading: feedSalesLoading,
    refetch: refetchFeedSales
  } = useSupabaseData<any>('feed_sales', 'id, date, client_name, feed_type, quantity_kg, unit_price, total_amount');

  // Mock data for sections not yet implemented in database
  const productions = [
    { id: 1, date: '2025-01-13', type: 'Aliment Ponte Standard', quantity: 500, cost: 185000 },
    { id: 2, date: '2025-01-12', type: 'Aliment Poussin', quantity: 200, cost: 85000 },
    { id: 3, date: '2025-01-11', type: 'Aliment Ponte Enrichi', quantity: 300, cost: 145000 },
  ];

  const handleEntrySuccess = () => {
    refetchFeedEntries();
    refetchRawMaterials();
  };

  const handleMaterialSuccess = () => {
    refetchRawMaterials();
  };

  const handleFeedSaleSuccess = () => {
    refetchFeedSales();
  };

  const handleMillRevenueSuccess = () => {
    refetchMillRevenues();
  };

  const handleMachineRevenueSuccess = () => {
    refetchMachineRevenues();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'low': return 'text-amber-600 bg-amber-100';
      case 'good': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Critique';
      case 'low': return 'Faible';
      case 'good': return 'Bon';
      default: return 'Normal';
    }
  };

  const renderStockTab = () => (
    <div className="space-y-6">
      {/* Stock Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Articles en stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {rawMaterialsLoading ? '...' : (rawMaterials?.length || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Stock faible</p>
              <p className="text-2xl font-bold text-amber-600">
                {rawMaterialsLoading ? '...' : (rawMaterials?.filter(item => item.current_stock <= 100).length || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Stock critique</p>
              <p className="text-2xl font-bold text-red-600">
                {rawMaterialsLoading ? '...' : (rawMaterials?.filter(item => item.current_stock <= 50).length || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wheat className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Valeur stock</p>
              <p className="text-2xl font-bold text-blue-600">2.8M CFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Materials Stock */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Stock Matières Premières</h3>
          <div className="flex space-x-2">
            <FeedManagerOnly>
              <button
                onClick={() => setShowEntryForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Entrée Stock
              </button>
              <button
                onClick={() => setShowNewMaterialForm(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Article
              </button>
            </FeedManagerOnly>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Matière</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Prix Unit.</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fournisseur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterialsLoading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : (rawMaterials?.length === 0) ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">Aucune matière première</td>
                </tr>
              ) : (rawMaterials || []).map((material) => {
                const status = material.current_stock <= 50 ? 'critical' :
                               material.current_stock <= 100 ? 'low' : 'good';
                return (
                  <tr key={material.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800 font-medium">{material.name}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {material.current_stock.toLocaleString()} {material.unit}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{material.unit_price} CFA/{material.unit}</td>
                    <td className="py-3 px-4 text-gray-600">{material.supplier}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEntriesTab = () => (
    <div className="space-y-6">
      {/* Entries Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowDown className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Entrées cette semaine</p>
              <p className="text-2xl font-bold text-gray-900">2,300 kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Valeur entrées</p>
              <p className="text-2xl font-bold text-green-600">1.05M CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Fournisseurs actifs</p>
              <p className="text-2xl font-bold text-purple-600">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Wheat className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Prix moyen</p>
              <p className="text-2xl font-bold text-amber-600">456 CFA/kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Entries History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Historique des Entrées</h3>
          <FeedManagerOnly>
            <button
              onClick={() => setShowEntryForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Entrée
            </button>
          </FeedManagerOnly>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Matière première</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Quantité</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Prix unit.</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fournisseur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Lot</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {feedEntriesLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : (feedEntries?.length === 0) ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">Aucune entrée enregistrée</td>
                </tr>
              ) : (feedEntries || []).map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(entry.delivery_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{entry.material_name}</td>
                  <td className="py-3 px-4 text-gray-600">{entry.quantity.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-gray-600">{entry.unit_price.toLocaleString()} CFA/kg</td>
                  <td className="py-3 px-4 text-gray-600">{entry.supplier}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      {entry.batch_number || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-green-600 font-medium">
                    {entry.total_amount.toLocaleString()} CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {feedEntries?.length === 0 && (
          <div className="text-center py-8">
            <ArrowDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune entrée enregistrée</p>
            <button
              onClick={() => setShowEntryForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Enregistrer la première entrée
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProductionTab = () => (
    <div className="space-y-6">
      {/* Production Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Factory className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Production cette semaine</p>
              <p className="text-2xl font-bold text-gray-900">1,000 kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Stock produit fini</p>
              <p className="text-2xl font-bold text-green-600">750 kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Wheat className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Coût moyen/kg</p>
              <p className="text-2xl font-bold text-amber-600">415 CFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Historique de Production</h3>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Production
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type d'aliment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Quantité</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Coût total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Coût/kg</th>
              </tr>
            </thead>
            <tbody>
              {productions.map((production) => (
                <tr key={production.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">{production.date}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{production.type}</td>
                  <td className="py-3 px-4 text-gray-600">{production.quantity} kg</td>
                  <td className="py-3 px-4 text-gray-800">{production.cost.toLocaleString()} CFA</td>
                  <td className="py-3 px-4 text-gray-600">{Math.round(production.cost / production.quantity)} CFA/kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


  const renderSalesTab = () => (
    <div className="space-y-6">
      {/* Feed Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ventes cette semaine</p>
              <p className="text-2xl font-bold text-gray-900">400 kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">CA semaine</p>
              <p className="text-2xl font-bold text-green-600">167,500 CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Factory className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Prix moyen</p>
              <p className="text-2xl font-bold text-blue-600">419 CFA/kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* External Sales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Ventes Externes d'Aliment</h3>
          <FeedManagerOnly>
            <button
              onClick={() => setShowFeedSalesForm(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Vente
            </button>
          </FeedManagerOnly>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Quantité</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Prix Unit.</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {feedSalesLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : (feedSales?.length === 0) ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Aucune vente enregistrée</td>
                </tr>
              ) : (feedSales || []).map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(sale.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{sale.client_name}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.feed_type}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.quantity_kg} kg</td>
                  <td className="py-3 px-4 text-gray-600">{sale.unit_price.toLocaleString()} CFA/kg</td>
                  <td className="py-3 px-4 text-green-600 font-medium">{sale.total_amount.toLocaleString()} CFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stock':
        return renderStockTab();
      case 'entries':
        return renderEntriesTab();
      case 'production':
        return renderProductionTab();
      case 'sales':
        return renderSalesTab();
      default:
        return renderStockTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <nav className="flex overflow-x-auto space-x-2 pb-2 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg font-medium text-xs min-w-fit whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mb-1" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mill and Machine Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mill Card */}
        <div
          onClick={() => setShowMillHistory(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Moulin</h3>
                <p className="text-sm text-gray-600">Recettes aujourd'hui</p>
                <p className="text-2xl font-bold text-orange-600">36,500 CFA</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Cliquer pour l'historique</p>
            </div>
          </div>
        </div>

        {/* Machine Card */}
        <div
          onClick={() => setShowMachineHistory(true)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Machine à Provende</h3>
                <p className="text-sm text-gray-600">Recettes aujourd'hui</p>
                <p className="text-2xl font-bold text-indigo-600">32,000 CFA</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">600 kg produits</p>
              <p className="text-xs text-gray-400">Cliquer pour l'historique</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Feed Entry Form Modal */}
      <FeedEntryForm
        isOpen={showEntryForm}
        onClose={() => setShowEntryForm(false)}
        onSuccess={handleEntrySuccess}
      />

      {/* New Material Form Modal */}
      <NewMaterialForm
        isOpen={showNewMaterialForm}
        onClose={() => setShowNewMaterialForm(false)}
        onSuccess={handleMaterialSuccess}
      />

      {/* Feed Sales Form Modal */}
      <FeedSalesForm
        isOpen={showFeedSalesForm}
        onClose={() => setShowFeedSalesForm(false)}
        onSuccess={handleFeedSaleSuccess}
      />

      {/* Mill History Modal */}
      {showMillHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="h-6 w-6 text-orange-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Historique du Moulin</h2>
                </div>
                <button
                  onClick={() => setShowMillHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">Recettes du moulin</h3>
                <FeedManagerOnly>
                  <button
                    onClick={() => setShowMillRevenueForm(true)}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Recette
                  </button>
                </FeedManagerOnly>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Montant (CFA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {millRevenues.map((revenue) => (
                      <tr key={revenue.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(revenue.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-orange-600 font-medium">
                          {revenue.amount.toLocaleString()} CFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Machine History Modal */}
      {showMachineHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-6 w-6 text-indigo-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Historique Machine à Provende</h2>
                </div>
                <button
                  onClick={() => setShowMachineHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">Recettes machine à provende</h3>
                <FeedManagerOnly>
                  <button
                    onClick={() => setShowMachineRevenueForm(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Recette
                  </button>
                </FeedManagerOnly>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Quantité (kg)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Montant (CFA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machineRevenues.map((revenue) => (
                      <tr key={revenue.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(revenue.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {revenue.quantity} kg
                        </td>
                        <td className="py-3 px-4 text-indigo-600 font-medium">
                          {revenue.amount.toLocaleString()} CFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mill Revenue Form Modal */}
      <MillRevenueForm
        isOpen={showMillRevenueForm}
        onClose={() => setShowMillRevenueForm(false)}
        onSuccess={handleMillRevenueSuccess}
      />

      {/* Machine Revenue Form Modal */}
      <MachineRevenueForm
        isOpen={showMachineRevenueForm}
        onClose={() => setShowMachineRevenueForm(false)}
        onSuccess={handleMachineRevenueSuccess}
      />
    </div>
  );
};

export default FeedModule;