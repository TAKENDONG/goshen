import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { Flock, EggProduction } from '../../types';
import Modal from '../ui/Modal';

interface EggProductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EggProductionData {
  flock_id: string;
  date: string;
  trays_count: number;
  individual_eggs: number;
  broken_eggs: number;
  recorded_by: string;
}

const EggProductionForm: React.FC<EggProductionFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EggProductionData>({
    flock_id: '',
    date: new Date().toISOString().split('T')[0],
    trays_count: 0,
    individual_eggs: 0,
    broken_eggs: 0,
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: flocks,
    loading: flocksLoading
  } = useSupabaseData<Flock>('flocks', 'id, name, farm_id, current_count');

  const {
    insert: insertProduction
  } = useSupabaseData<EggProduction>('egg_productions');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        recorded_by: user.id
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour enregistrer des données');
      return;
    }

    if (!formData.flock_id || formData.trays_count < 0 || formData.individual_eggs < 0 || formData.broken_eggs < 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertProduction({
        flock_id: formData.flock_id,
        date: formData.date,
        trays_count: formData.trays_count,
        individual_eggs: formData.individual_eggs,
        broken_eggs: formData.broken_eggs,
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        flock_id: '',
        date: new Date().toISOString().split('T')[0],
        trays_count: 0,
        individual_eggs: 0,
        broken_eggs: 0,
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving egg production:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['trays_count', 'individual_eggs', 'broken_eggs'].includes(name) ? parseInt(value) || 0 : value
    }));
  };

  // Calcul automatique du total d'œufs
  const totalEggs = (formData.trays_count * 30) + formData.individual_eggs - formData.broken_eggs;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Saisie de Production"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="flock_id" className="block text-sm font-medium text-gray-700 mb-2">
            Troupeau *
          </label>
          <select
            id="flock_id"
            name="flock_id"
            value={formData.flock_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={flocksLoading}
          >
            <option value="">Sélectionner un troupeau</option>
            {flocks.map((flock) => (
              <option key={flock.id} value={flock.id}>
                {flock.name} ({flock.current_count} poules)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="trays_count" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre d'alvéoles
            </label>
            <input
              type="number"
              id="trays_count"
              name="trays_count"
              value={formData.trays_count}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Plateaux de 30 œufs</p>
          </div>

          <div>
            <label htmlFor="individual_eggs" className="block text-sm font-medium text-gray-700 mb-2">
              Œufs individuels
            </label>
            <input
              type="number"
              id="individual_eggs"
              name="individual_eggs"
              value={formData.individual_eggs}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="broken_eggs" className="block text-sm font-medium text-gray-700 mb-2">
              Œufs cassés
            </label>
            <input
              type="number"
              id="broken_eggs"
              name="broken_eggs"
              value={formData.broken_eggs}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total d'œufs utilisables:</span>
            <span className="text-lg font-bold text-green-600">{totalEggs} œufs</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ({formData.trays_count} × 30) + {formData.individual_eggs} - {formData.broken_eggs} = {totalEggs}
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EggProductionForm;