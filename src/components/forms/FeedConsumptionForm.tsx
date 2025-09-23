import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { Flock, FeedConsumption } from '../../types';
import Modal from '../ui/Modal';

interface FeedConsumptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeedConsumptionData {
  flock_id: string;
  date: string;
  quantity_kg: number;
  feed_type: string;
  recorded_by: string;
}

const FeedConsumptionForm: React.FC<FeedConsumptionFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FeedConsumptionData>({
    flock_id: '',
    date: new Date().toISOString().split('T')[0],
    quantity_kg: 0,
    feed_type: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: flocks,
    loading: flocksLoading
  } = useSupabaseData<Flock>('flocks', 'id, name, farm_id, current_count');

  const {
    insert: insertFeedConsumption
  } = useSupabaseData<FeedConsumption>('feed_consumptions');

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

    if (!formData.flock_id || formData.quantity_kg <= 0 || !formData.feed_type) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertFeedConsumption({
        flock_id: formData.flock_id,
        date: formData.date,
        quantity_kg: formData.quantity_kg,
        feed_type: formData.feed_type,
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        flock_id: '',
        date: new Date().toISOString().split('T')[0],
        quantity_kg: 0,
        feed_type: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving feed consumption:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity_kg' ? parseFloat(value) || 0 : value
    }));
  };

  const feedTypes = [
    'Ponte Standard',
    'Ponte Premium',
    'Démarrage',
    'Croissance',
    'Finition',
    'Mélange Maison',
    'Autre'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saisir Distribution Aliment"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="quantity_kg" className="block text-sm font-medium text-gray-700 mb-2">
            Quantité distribuée (kg) *
          </label>
          <input
            type="number"
            id="quantity_kg"
            name="quantity_kg"
            value={formData.quantity_kg}
            onChange={handleInputChange}
            min="0"
            step="0.1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="feed_type" className="block text-sm font-medium text-gray-700 mb-2">
            Type d'aliment *
          </label>
          <select
            id="feed_type"
            name="feed_type"
            value={formData.feed_type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Sélectionner un type d'aliment</option>
            {feedTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedConsumptionForm;