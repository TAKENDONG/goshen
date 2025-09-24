import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { Flock, Farm } from '../../types';
import Modal from '../ui/Modal';

interface FlockFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FlockData {
  farm_id: string;
  name: string;
  capacity: number;
  current_count: number;
  start_date: string;
  status: 'active' | 'inactive';
}

const FlockForm: React.FC<FlockFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FlockData>({
    farm_id: '',
    name: '',
    capacity: 0,
    current_count: 0,
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: farms,
    loading: farmsLoading
  } = useSupabaseData<Farm>('farms', 'id, name, total_capacity');

  const {
    insert: insertFlock
  } = useSupabaseData<Flock>('flocks');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour enregistrer des données');
      return;
    }

    if (!formData.farm_id || !formData.name || formData.capacity <= 0) {
      alert('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    if (formData.current_count > formData.capacity) {
      alert('L\'effectif actuel ne peut pas dépasser la capacité');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertFlock({
        farm_id: formData.farm_id,
        name: formData.name,
        capacity: formData.capacity,
        current_count: formData.current_count,
        start_date: formData.start_date,
        status: formData.status
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        farm_id: '',
        name: '',
        capacity: 0,
        current_count: 0,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving flock:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['capacity', 'current_count'].includes(name) ? parseInt(value) || 0 : value
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Bande"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="farm_id" className="block text-sm font-medium text-gray-700 mb-2">
            Ferme *
          </label>
          <select
            id="farm_id"
            name="farm_id"
            value={formData.farm_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={farmsLoading}
          >
            <option value="">Sélectionner une ferme</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nom de la bande *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Ex: Bande A1, Poules pondeuses 2024..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
              Capacité maximale *
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              min="1"
              required
              placeholder="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="current_count" className="block text-sm font-medium text-gray-700 mb-2">
              Effectif actuel *
            </label>
            <input
              type="number"
              id="current_count"
              name="current_count"
              value={formData.current_count}
              onChange={handleInputChange}
              min="0"
              max={formData.capacity}
              required
              placeholder="950"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
            Date de début *
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Taux d'occupation:</span>
            <span className={`text-lg font-bold ${
              formData.capacity > 0 ?
                ((formData.current_count / formData.capacity) * 100) > 90 ? 'text-red-600' :
                ((formData.current_count / formData.capacity) * 100) > 70 ? 'text-amber-600' : 'text-green-600'
              : 'text-gray-600'
            }`}>
              {formData.capacity > 0 ? ((formData.current_count / formData.capacity) * 100).toFixed(1) : '0'}%
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Créer la Bande'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FlockForm;