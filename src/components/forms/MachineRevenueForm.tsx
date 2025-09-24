import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

interface MachineRevenueFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MachineRevenueData {
  date: string;
  quantity: number;
  amount: number;
  notes: string;
  recorded_by: string;
}

const MachineRevenueForm: React.FC<MachineRevenueFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MachineRevenueData>({
    date: new Date().toISOString().split('T')[0],
    quantity: 0,
    amount: 0,
    notes: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    insert: insertMachineRevenue
  } = useSupabaseData<any>('machine_revenues');

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

    if (formData.quantity <= 0 || formData.amount <= 0) {
      alert('Veuillez saisir une quantité et un montant valides');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertMachineRevenue({
        date: formData.date,
        quantity: formData.quantity,
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
        quantity: 0,
        amount: 0,
        notes: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving machine revenue:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['quantity', 'amount'].includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  // Calcul du prix par kg
  const pricePerKg = formData.quantity > 0 ? formData.amount / formData.quantity : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Recette Machine à Provende"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Quantité et montant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantité (kg) *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              required
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Prix par kg calculé */}
        {pricePerKg > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-indigo-700 mb-1">
              Prix par kg (calculé automatiquement)
            </label>
            <p className="text-lg font-bold text-indigo-800">
              {pricePerKg.toFixed(0)} CFA/kg
            </p>
          </div>
        )}

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
            placeholder="Type d'aliment produit, client, particularités..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Résumé */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-indigo-700 mb-3">Résumé</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-medium text-indigo-800">
                {new Date(formData.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Quantité:</span>
              <p className="font-medium text-indigo-800">
                {formData.quantity > 0 ? `${formData.quantity} kg` : '0 kg'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Montant:</span>
              <p className="font-medium text-indigo-800">
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
            disabled={isSubmitting || formData.quantity === 0 || formData.amount === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Recette'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MachineRevenueForm;