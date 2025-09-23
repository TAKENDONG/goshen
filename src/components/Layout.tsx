import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  Bird, 
  DollarSign, 
  Wheat, 
  Users, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { appUser, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', name: 'Tableau de Bord', icon: Home },
    { id: 'farm', name: 'Ferme Avicole', icon: Bird },
    { id: 'sales', name: 'Ventes & Trésorerie', icon: DollarSign },
    { id: 'feed', name: 'Provenderie', icon: Wheat },
    { id: 'reports', name: 'Rapports', icon: BarChart3 },
  ];

  if (appUser?.role === 'admin') {
    menuItems.push({ id: 'users', name: 'Utilisateurs', icon: Users });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-green-700">
          <h1 className="text-xl font-bold text-white">Ferme Coopérative</h1>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  currentPage === item.id
                    ? 'bg-green-700 text-white border-r-4 border-green-300'
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-green-700">
          <div className="flex items-center justify-between text-green-100 mb-4">
            <div className="text-sm">
              <p className="font-medium">{appUser?.full_name}</p>
              <p className="text-xs capitalize">{appUser?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-green-100 hover:bg-green-700 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              className="lg:hidden text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {menuItems.find(item => item.id === currentPage)?.name || 'Dashboard'}
            </h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;