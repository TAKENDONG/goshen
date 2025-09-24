import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TransactionData {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  notes: string;
  recorded_by: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TransactionData>({
    type: 'income',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    insert: insertTransaction
  } = useSupabaseData<any>('transactions');

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
      alert('Vous devez être connecté pour enregistrer une transaction');
      return;
    }

    if (!formData.description || !formData.category || formData.amount <= 0) {
      alert('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertTransaction({
        type: formData.type,
        category: formData.category,
        description: formData.description,
        amount: formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount),
        date: formData.date,
        notes: formData.notes,
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        type: 'income',
        category: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const incomeCategories = [
    'Vente d\'œufs',
    'Vente de volaille',
    'Subvention',
    'Autre revenu'
  ];

  const expenseCategories = [
    'Achat d\'aliment',
    'Achat de matières premières',
    'Achat d\'alvéoles',
    'Vaccination',
    'Médicaments',
    'Transport',
    'Main d\'œuvre',
    'Maintenance',
    'Carburant',
    'Autre dépense'
  ];

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Transaction"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type de transaction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de transaction *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
              className={`p-3 border rounded-lg text-center font-medium transition-colors ${
                formData.type === 'income'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              💰 Entrée d'argent
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
              className={`p-3 border rounded-lg text-center font-medium transition-colors ${
                formData.type === 'expense'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              💸 Sortie d'argent
            </button>
          </div>
        </div>

        {/* Catégorie et description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Description de la transaction"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Montant et date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            placeholder="Détails supplémentaires sur cette transaction..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Résumé */}
        <div className={`border rounded-lg p-4 ${
          formData.type === 'income' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${
            formData.type === 'income' ? 'text-green-700' : 'text-red-700'
          }`}>
            Résumé de la transaction
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <p className={`font-medium ${
                formData.type === 'income' ? 'text-green-800' : 'text-red-800'
              }`}>
                {formData.type === 'income' ? 'Entrée d\'argent' : 'Sortie d\'argent'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Montant:</span>
              <p className={`font-medium ${
                formData.type === 'income' ? 'text-green-800' : 'text-red-800'
              }`}>
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
            disabled={isSubmitting || formData.amount === 0 || !formData.category}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              formData.type === 'income'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;