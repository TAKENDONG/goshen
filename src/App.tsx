import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/Layout';
import Dashboard from './components/dashboard/Dashboard';
import FarmModule from './components/farm/FarmModule';
import SalesModule from './components/sales/SalesModule';
import FeedModule from './components/feed/FeedModule';
import { useRoleAccess } from './hooks/useRoleAccess';

const AppContent: React.FC = () => {
  const { user, appUser, loading } = useAuth();
  const { getDefaultPage, canAccess, isLoaded } = useRoleAccess();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Set default page based on user role when user data is loaded
  useEffect(() => {
    if (appUser && isLoaded) {
      const defaultPage = getDefaultPage();
      setCurrentPage(defaultPage);
    }
  }, [appUser, isLoaded, getDefaultPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderPage = () => {
    // Check if user can access the current page
    if (!canAccess(currentPage as any)) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-800 mb-4">Accès non autorisé</h2>
          <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'farm':
        return <FarmModule />;
      case 'sales':
        return <SalesModule />;
      case 'feed':
        return <FeedModule />;
      case 'reports':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Module Rapports</h2>
            <p className="text-gray-600">Fonctionnalité en cours de développement...</p>
          </div>
        );
      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gestion des Utilisateurs</h2>
            <p className="text-gray-600">Fonctionnalité en cours de développement...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;