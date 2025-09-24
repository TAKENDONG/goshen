import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { Flock, Mortality } from '../../types';
import Modal from '../ui/Modal';

interface MortalityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MortalityData {
  flock_id: string;
  date: string;
  deaths: number;
  cause: string;
  recorded_by: string;
}

const MortalityForm: React.FC<MortalityFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MortalityData>({
    flock_id: '',
    date: new Date().toISOString().split('T')[0],
    deaths: 0,
    cause: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: flocks,
    loading: flocksLoading
  } = useSupabaseData<Flock>('flocks', 'id, name, farm_id, current_count');

  const {
    insert: insertMortality
  } = useSupabaseData<Mortality>('mortalities');

  const {
    update: updateFlock
  } = useSupabaseData<Flock>('flocks');

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

    if (!formData.flock_id || formData.deaths < 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the selected flock to get current count
      const selectedFlock = flocks.find(flock => flock.id === formData.flock_id);
      if (!selectedFlock) {
        throw new Error('Troupeau non trouvé');
      }

      // Check if deaths exceed current count
      if (formData.deaths > selectedFlock.current_count) {
        alert(`Le nombre de morts (${formData.deaths}) ne peut pas dépasser l'effectif actuel (${selectedFlock.current_count})`);
        return;
      }

      // Insert mortality record
      const { error: mortalityError } = await insertMortality({
        flock_id: formData.flock_id,
        date: formData.date,
        deaths: formData.deaths,
        cause: formData.cause,
        recorded_by: user.id
      });

      if (mortalityError) {
        throw new Error(mortalityError);
      }

      // Update flock current count (decrement by deaths)
      const newCurrentCount = selectedFlock.current_count - formData.deaths;
      const { error: updateError } = await updateFlock(formData.flock_id, {
        current_count: newCurrentCount
      });

      if (updateError) {
        throw new Error(updateError);
      }

      // Reset form
      setFormData({
        flock_id: '',
        date: new Date().toISOString().split('T')[0],
        deaths: 0,
        cause: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving mortality:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'deaths' ? parseInt(value) || 0 : value
    }));
  };

  const commonCauses = [
    'Maladie',
    'Stress thermique',
    'Accident',
    'Prédateur',
    'Vieillesse',
    'Problème alimentaire',
    'Autre'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Déclarer Mortalité"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="deaths" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de morts *
          </label>
          <input
            type="number"
            id="deaths"
            name="deaths"
            value={formData.deaths}
            onChange={handleInputChange}
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="cause" className="block text-sm font-medium text-gray-700 mb-2">
            Cause (optionnel)
          </label>
          <select
            id="cause"
            name="cause"
            value={formData.cause}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
          >
            <option value="">Sélectionner une cause</option>
            {commonCauses.map((cause) => (
              <option key={cause} value={cause}>
                {cause}
              </option>
            ))}
          </select>

          {formData.cause === 'Autre' && (
            <textarea
              name="cause"
              value={formData.cause}
              onChange={handleInputChange}
              placeholder="Préciser la cause..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          )}
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MortalityForm;