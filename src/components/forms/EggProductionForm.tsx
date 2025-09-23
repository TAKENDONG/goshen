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
  eggs_produced: number;
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
    eggs_produced: 0,
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

    if (!formData.flock_id || formData.eggs_produced < 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertProduction({
        flock_id: formData.flock_id,
        date: formData.date,
        eggs_produced: formData.eggs_produced,
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        flock_id: '',
        date: new Date().toISOString().split('T')[0],
        eggs_produced: 0,
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
      [name]: name === 'eggs_produced' ? parseInt(value) || 0 : value
    }));
  };

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

        <div>
          <label htmlFor="eggs_produced" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre d'œufs produits *
          </label>
          <input
            type="number"
            id="eggs_produced"
            name="eggs_produced"
            value={formData.eggs_produced}
            onChange={handleInputChange}
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
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