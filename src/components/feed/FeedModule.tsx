import React, { useState } from 'react';
import { 
  Wheat, 
  Package, 
  Factory, 
  Truck,
  Plus,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';

const FeedModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stock');

  const tabs = [
    { id: 'stock', label: 'Stock Mat. Premières', icon: Package },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'sales', label: 'Ventes Externes', icon: Truck },
  ];

  // Mock data
  const rawMaterials = [
    { id: 1, name: 'Maïs grain', stock: 2500, unit: 'kg', price: 450, status: 'good', supplier: 'Coop Agricole' },
    { id: 2, name: 'Tourteau de soja', stock: 800, unit: 'kg', price: 680, status: 'low', supplier: 'Import SA' },
    { id: 3, name: 'Son de blé', stock: 1200, unit: 'kg', price: 320, status: 'good', supplier: 'Minoterie Nord' },
    { id: 4, name: 'Prémix ponte', stock: 45, unit: 'kg', price: 2500, status: 'critical', supplier: 'Nutri-Tech' },
    { id: 5, name: 'Carbonate de calcium', stock: 500, unit: 'kg', price: 180, status: 'good', supplier: 'Minéraux Plus' },
  ];

  const productions = [
    { id: 1, date: '2025-01-13', type: 'Aliment Ponte Standard', quantity: 500, cost: 185000 },
    { id: 2, date: '2025-01-12', type: 'Aliment Poussin', quantity: 200, cost: 85000 },
    { id: 3, date: '2025-01-11', type: 'Aliment Ponte Enrichi', quantity: 300, cost: 145000 },
  ];

  const feedSales = [
    { id: 1, date: '2025-01-13', client: 'Ferme Diallo', type: 'Ponte Standard', quantity: 250, price: 400, total: 100000 },
    { id: 2, date: '2025-01-12', client: 'Élevage Moderne', type: 'Poussin', quantity: 150, price: 450, total: 67500 },
  ];

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
              <p className="text-2xl font-bold text-gray-900">{rawMaterials.length}</p>
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
                {rawMaterials.filter(item => item.status === 'low').length}
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
                {rawMaterials.filter(item => item.status === 'critical').length}
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
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Article
          </button>
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
              {rawMaterials.map((material) => (
                <tr key={material.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-800 font-medium">{material.name}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {material.stock.toLocaleString()} {material.unit}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{material.price} CFA/{material.unit}</td>
                  <td className="py-3 px-4 text-gray-600">{material.supplier}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                      {getStatusText(material.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Vente
          </button>
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
              {feedSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-600">{sale.date}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{sale.client}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.type}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.quantity} kg</td>
                  <td className="py-3 px-4 text-gray-600">{sale.price} CFA/kg</td>
                  <td className="py-3 px-4 text-green-600 font-medium">{sale.total.toLocaleString()} CFA</td>
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
        <nav className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-100 text-amber-700'
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
    </div>
  );
};

export default FeedModule;