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
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { appUser, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', name: 'Accueil', icon: Home },
    { id: 'farm', name: 'Ferme', icon: Bird },
    { id: 'sales', name: 'Ventes', icon: DollarSign },
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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-green-800">
        <div className="flex items-center justify-center p-4 border-b border-green-700">
          <h1 className="text-xl font-bold text-white">Ferme Coopérative</h1>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
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

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  currentPage === item.id
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}

          {/* Profile/More button */}
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-green-600 transition-colors relative"
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profil</span>
          </button>
        </div>
      </div>

      {/* Mobile Profile Menu Overlay */}
      {showProfile && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowProfile(false)}
          />
          <div className="lg:hidden fixed bottom-16 right-4 z-50 bg-white rounded-lg shadow-xl border p-4 min-w-[200px]">
            <div className="mb-4">
              <p className="font-medium text-gray-900">{appUser?.full_name}</p>
              <p className="text-sm text-gray-500 capitalize">{appUser?.role?.replace('_', ' ')}</p>
            </div>

            {menuItems.slice(4).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setShowProfile(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md transition-colors mb-1 ${
                    currentPage === item.id
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.name}
                </button>
              );
            })}

            <hr className="my-2" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Déconnexion
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar - Desktop only */}
        <div className="hidden lg:block bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
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

        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-center px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(item => item.id === currentPage)?.name || 'Dashboard'}
            </h2>
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