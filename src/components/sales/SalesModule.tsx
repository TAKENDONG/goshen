import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Receipt,
  PieChart
} from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { EggSale, Transaction } from '../../types';
import EggSalesForm from '../forms/EggSalesForm';
import TransactionForm from '../forms/TransactionForm';

const SalesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Real data from Supabase
  const {
    data: eggSales,
    loading: salesLoading,
    refetch: refetchSales
  } = useSupabaseData<EggSale>('egg_sales', 'id, date, client_name, trays_count, unit_price, total_amount, created_at');

  const {
    data: transactions,
    loading: transactionsLoading,
    refetch: refetchTransactions
  } = useSupabaseData<Transaction>('transactions', 'id, date, type, category, description, amount, created_at');

  // Calculate today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = eggSales.filter(sale => sale.date === today);
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const todayTrays = todaySales.reduce((sum, sale) => sum + sale.trays_count, 0);
  const averagePrice = todayTrays > 0 ? todayTotal / todayTrays : 0;

  // Calculate weekly totals (Monday to Sunday)
  const getStartOfWeek = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const startOfWeek = getStartOfWeek(new Date(date));
    return new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
  };

  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = getEndOfWeek(new Date());

  const weeklyIncome = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'income' &&
             transactionDate >= startOfWeek &&
             transactionDate <= endOfWeek;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const weeklyExpenses = Math.abs(transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'expense' &&
             transactionDate >= startOfWeek &&
             transactionDate <= endOfWeek;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0));

  const weeklyBalance = weeklyIncome - weeklyExpenses;

  const handleSalesSuccess = () => {
    refetchSales();
    refetchTransactions();
  };

  const handleTransactionSuccess = () => {
    refetchTransactions();
  };

  const tabs = [
    { id: 'sales', label: 'Ventes d\'œufs', icon: DollarSign },
    { id: 'treasury', label: 'Trésorerie', icon: TrendingUp },
    { id: 'reports', label: 'Rapports', icon: PieChart },
  ];

  // Get recent transactions (last 10)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const renderSalesTab = () => (
    <div className="space-y-6">
      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ventes aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{todayTotal.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Plateaux vendus</p>
              <p className="text-2xl font-bold text-gray-900">{todayTrays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Prix moyen</p>
              <p className="text-2xl font-bold text-gray-900">{averagePrice.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Ventes d'Aujourd'hui</h3>
          <button
            onClick={() => setShowSalesForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Vente
          </button>
        </div>

        {salesLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des ventes...</p>
          </div>
        ) : todaySales.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune vente aujourd'hui</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Plateaux</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Prix Unit.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Heure</th>
                </tr>
              </thead>
              <tbody>
                {todaySales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{sale.client_name}</td>
                    <td className="py-3 px-4 text-gray-600">{sale.trays_count}</td>
                    <td className="py-3 px-4 text-gray-600">{sale.unit_price.toLocaleString()} CFA</td>
                    <td className="py-3 px-4 font-medium text-green-600">{sale.total_amount.toLocaleString()} CFA</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(sale.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderTreasuryTab = () => (
    <div className="space-y-6">
      {/* Treasury Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Entrées de la semaine</p>
              <p className="text-2xl font-bold text-green-600">{weeklyIncome.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowDownCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Sorties de la semaine</p>
              <p className="text-2xl font-bold text-red-600">{weeklyExpenses.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Balance</p>
              <p className={`text-2xl font-bold ${weeklyBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{weeklyBalance.toLocaleString()} CFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Transactions Récentes</h3>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Transaction
          </button>
        </div>
        
        {transactionsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement des transactions...</p>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune transaction récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center">
                  {transaction.type === 'income' ? (
                    <ArrowUpCircle className="h-8 w-8 text-green-500 mr-3" />
                  ) : (
                    <ArrowDownCircle className="h-8 w-8 text-red-500 mr-3" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString()} CFA
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Rapports Financiers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Receipt className="h-6 w-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-800">Rapport Hebdomadaire</h4>
            <p className="text-sm text-gray-600">Du lundi au dimanche</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <PieChart className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-800">Rapport Mensuel</h4>
            <p className="text-sm text-gray-600">Bilan complet du mois</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <TrendingUp className="h-6 w-6 text-amber-600 mb-2" />
            <h4 className="font-medium text-gray-800">Évolution des Ventes</h4>
            <p className="text-sm text-gray-600">Graphique des tendances</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales':
        return renderSalesTab();
      case 'treasury':
        return renderTreasuryTab();
      case 'reports':
        return renderReportsTab();
      default:
        return renderSalesTab();
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
                    ? 'bg-blue-100 text-blue-700'
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

      {/* Tab Content */}
      {renderTabContent()}

      {/* Egg Sales Form Modal */}
      <EggSalesForm
        isOpen={showSalesForm}
        onClose={() => setShowSalesForm(false)}
        onSuccess={handleSalesSuccess}
      />

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};

export default SalesModule;