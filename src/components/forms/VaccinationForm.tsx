import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { Flock, Vaccination } from '../../types';
import Modal from '../ui/Modal';

interface VaccinationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VaccinationData {
  flock_id: string;
  vaccine_name: string;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  administered_by?: string;
  status: 'scheduled' | 'completed' | 'overdue';
}

const VaccinationForm: React.FC<VaccinationFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VaccinationData>({
    flock_id: '',
    vaccine_name: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost: 0,
    status: 'scheduled'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const {
    data: flocks,
    loading: flocksLoading
  } = useSupabaseData<Flock>('flocks', 'id, name, farm_id, current_count');

  const {
    insert: insertVaccination
  } = useSupabaseData<Vaccination>('vaccinations');

  useEffect(() => {
    if (user && isCompleted) {
      setFormData(prev => ({
        ...prev,
        administered_by: user.id,
        completed_date: new Date().toISOString().split('T')[0],
        status: 'completed'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        administered_by: undefined,
        completed_date: undefined,
        status: 'scheduled'
      }));
    }
  }, [user, isCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour enregistrer des données');
      return;
    }

    if (!formData.flock_id || !formData.vaccine_name || formData.cost < 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const vaccinationData: VaccinationData = {
        flock_id: formData.flock_id,
        vaccine_name: formData.vaccine_name,
        scheduled_date: formData.scheduled_date,
        cost: formData.cost,
        status: isCompleted ? 'completed' : 'scheduled'
      };

      if (isCompleted) {
        vaccinationData.completed_date = formData.completed_date;
        vaccinationData.administered_by = user.id;
      }

      const { error } = await insertVaccination(vaccinationData);

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        flock_id: '',
        vaccine_name: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        cost: 0,
        status: 'scheduled'
      });
      setIsCompleted(false);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving vaccination:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cost' ? parseFloat(value) || 0 : value
    }));
  };

  const commonVaccines = [
    'Newcastle',
    'Gumboro',
    'Bronchite Infectieuse',
    'Variole Aviaire',
    'Coryza',
    'Typhose',
    'Choléra Aviaire',
    'Autre'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Programmer Vaccination"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
          <label htmlFor="vaccine_name" className="block text-sm font-medium text-gray-700 mb-2">
            Vaccin *
          </label>
          <select
            id="vaccine_name"
            name="vaccine_name"
            value={formData.vaccine_name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Sélectionner un vaccin</option>
            {commonVaccines.map((vaccine) => (
              <option key={vaccine} value={vaccine}>
                {vaccine}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-2">
            Date {isCompleted ? 'd\'administration' : 'de programmation'} *
          </label>
          <input
            type="date"
            id="scheduled_date"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
            Coût (CFA) *
          </label>
          <input
            type="number"
            id="cost"
            name="cost"
            value={formData.cost}
            onChange={handleInputChange}
            min="0"
            step="100"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isCompleted"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-700">
            Vaccination déjà effectuée
          </label>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : (isCompleted ? 'Enregistrer comme Effectué' : 'Programmer')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VaccinationForm;