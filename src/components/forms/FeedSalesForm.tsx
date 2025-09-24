import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

interface FeedSalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeedSaleData {
  client_name: string;
  feed_type: string;
  quantity_kg: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  delivery_date: string;
  delivery_address: string;
  notes: string;
  recorded_by: string;
}

const FeedSalesForm: React.FC<FeedSalesFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FeedSaleData>({
    client_name: '',
    feed_type: '',
    quantity_kg: 0,
    unit_price: 0,
    total_amount: 0,
    payment_method: 'cash',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_address: '',
    notes: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    insert: insertFeedSale
  } = useSupabaseData<any>('feed_sales');

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        recorded_by: user.id
      }));
    }
  }, [user]);

  // Calcul automatique du montant total
  React.useEffect(() => {
    if (formData.quantity_kg > 0 && formData.unit_price > 0) {
      const total = formData.quantity_kg * formData.unit_price;
      setFormData(prev => ({
        ...prev,
        total_amount: Math.round(total * 100) / 100
      }));
    }
  }, [formData.quantity_kg, formData.unit_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour enregistrer une vente');
      return;
    }

    if (!formData.client_name || !formData.feed_type || formData.quantity_kg <= 0 || formData.unit_price <= 0) {
      alert('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertFeedSale({
        client_name: formData.client_name,
        feed_type: formData.feed_type,
        quantity_kg: formData.quantity_kg,
        unit_price: formData.unit_price,
        total_amount: formData.total_amount,
        payment_method: formData.payment_method,
        delivery_date: formData.delivery_date,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        date: formData.delivery_date,
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        client_name: '',
        feed_type: '',
        quantity_kg: 0,
        unit_price: 0,
        total_amount: 0,
        payment_method: 'cash',
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_address: '',
        notes: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving feed sale:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['quantity_kg', 'unit_price', 'total_amount'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  const feedTypes = [
    'Aliment Ponte Standard',
    'Aliment Ponte Enrichi',
    'Aliment Poussin',
    'Aliment Croissance',
    'Aliment Finition',
    'Aliment Reproducteur',
    'Aliment Porc',
    'Aliment Bovin',
    'Autre'
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'transfer', label: 'Virement' },
    { value: 'check', label: 'Chèque' },
    { value: 'credit', label: 'À crédit' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Vente d'Aliment"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client et type d'aliment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du client *
            </label>
            <input
              type="text"
              id="client_name"
              name="client_name"
              value={formData.client_name}
              onChange={handleInputChange}
              required
              placeholder="Nom du client"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Sélectionner un type</option>
              {feedTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantité et prix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="quantity_kg" className="block text-sm font-medium text-gray-700 mb-2">
              Quantité (kg) *
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
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
              Prix par kg (CFA) *
            </label>
            <input
              type="number"
              id="unit_price"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-green-700 mb-1">
              Montant total
            </label>
            <p className="text-lg font-bold text-green-800">
              {formData.total_amount > 0 ? `${formData.total_amount.toLocaleString()} CFA` : '0 CFA'}
            </p>
          </div>
        </div>

        {/* Mode de paiement et date de livraison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
              Mode de paiement
            </label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date de livraison *
            </label>
            <input
              type="date"
              id="delivery_date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Adresse de livraison */}
        <div>
          <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse de livraison
          </label>
          <input
            type="text"
            id="delivery_address"
            name="delivery_address"
            value={formData.delivery_address}
            onChange={handleInputChange}
            placeholder="Adresse complète de livraison"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
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
            placeholder="Conditions particulières, remarques..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Résumé */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-700 mb-3">Résumé de la vente</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Client:</span>
              <p className="font-medium text-purple-800">{formData.client_name || 'Non défini'}</p>
            </div>
            <div>
              <span className="text-gray-600">Quantité:</span>
              <p className="font-medium text-purple-800">{formData.quantity_kg} kg</p>
            </div>
            <div>
              <span className="text-gray-600">Prix unitaire:</span>
              <p className="font-medium text-purple-800">{formData.unit_price.toLocaleString()} CFA/kg</p>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <p className="font-medium text-purple-800">{formData.total_amount.toLocaleString()} CFA</p>
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
            disabled={isSubmitting || formData.quantity_kg === 0 || formData.unit_price === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Vente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedSalesForm;