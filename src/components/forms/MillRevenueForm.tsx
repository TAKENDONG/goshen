import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

interface MillRevenueFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MillRevenueData {
  date: string;
  amount: number;
  notes: string;
  recorded_by: string;
}

const MillRevenueForm: React.FC<MillRevenueFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MillRevenueData>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    notes: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    insert: insertMillRevenue
  } = useSupabaseData<any>('mill_revenues');

  React.useEffect(() => {
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
      alert('Vous devez être connecté pour enregistrer une recette');
      return;
    }

    if (formData.amount <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertMillRevenue({
        date: formData.date,
        amount: formData.amount,
        notes: formData.notes,
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        notes: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving mill revenue:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Recette Moulin"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date et montant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Montant (CFA) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes et remarques
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Détails sur les services rendus, type de broyage..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Résumé */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-700 mb-3">Résumé</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-medium text-orange-800">
                {new Date(formData.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Montant:</span>
              <p className="font-medium text-orange-800">
                {formData.amount > 0 ? `${formData.amount.toLocaleString()} CFA` : '0 CFA'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
            disabled={isSubmitting || formData.amount === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Recette'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MillRevenueForm;