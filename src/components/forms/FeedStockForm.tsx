import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

interface FeedStockFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeedStockData {
  feed_type: string;
  total_weight: number;
  bags_count: number;
  weight_per_bag: number;
  supplier: string;
  delivery_date: string;
  unit_price: number;
  total_cost: number;
  batch_number: string;
  expiry_date: string;
  storage_location: string;
  notes: string;
  recorded_by: string;
}

const FeedStockForm: React.FC<FeedStockFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FeedStockData>({
    feed_type: '',
    total_weight: 0,
    bags_count: 0,
    weight_per_bag: 0,
    supplier: '',
    delivery_date: new Date().toISOString().split('T')[0],
    unit_price: 0,
    total_cost: 0,
    batch_number: '',
    expiry_date: '',
    storage_location: '',
    notes: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    insert: insertFeedStock
  } = useSupabaseData<any>('feed_stocks');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        recorded_by: user.id
      }));
    }
  }, [user]);

  // Calculs automatiques
  useEffect(() => {
    if (formData.total_weight > 0 && formData.bags_count > 0) {
      const weightPerBag = formData.total_weight / formData.bags_count;
      setFormData(prev => ({
        ...prev,
        weight_per_bag: Math.round(weightPerBag * 100) / 100
      }));
    }
  }, [formData.total_weight, formData.bags_count]);

  useEffect(() => {
    if (formData.unit_price > 0 && formData.total_weight > 0) {
      const totalCost = formData.unit_price * formData.total_weight;
      setFormData(prev => ({
        ...prev,
        total_cost: Math.round(totalCost * 100) / 100
      }));
    }
  }, [formData.unit_price, formData.total_weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour enregistrer des données');
      return;
    }

    if (!formData.feed_type || formData.total_weight <= 0 || formData.bags_count <= 0) {
      alert('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertFeedStock({
        feed_type: formData.feed_type,
        total_weight: formData.total_weight,
        bags_count: formData.bags_count,
        weight_per_bag: formData.weight_per_bag,
        supplier: formData.supplier,
        delivery_date: formData.delivery_date,
        unit_price: formData.unit_price,
        total_cost: formData.total_cost,
        batch_number: formData.batch_number,
        expiry_date: formData.expiry_date || null,
        storage_location: formData.storage_location,
        notes: formData.notes,
        current_stock: formData.total_weight, // Stock initial = poids total
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        feed_type: '',
        total_weight: 0,
        bags_count: 0,
        weight_per_bag: 0,
        supplier: '',
        delivery_date: new Date().toISOString().split('T')[0],
        unit_price: 0,
        total_cost: 0,
        batch_number: '',
        expiry_date: '',
        storage_location: '',
        notes: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving feed stock:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['total_weight', 'bags_count', 'unit_price', 'weight_per_bag', 'total_cost'].includes(name)
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
    'Autre'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Stock de Provende"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type d'aliment et fournisseur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="">Sélectionner un type</option>
              {feedTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseur *
            </label>
            <input
              type="text"
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              required
              placeholder="Nom du fournisseur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Poids et sacs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="total_weight" className="block text-sm font-medium text-gray-700 mb-2">
              Poids total (kg) *
            </label>
            <input
              type="number"
              id="total_weight"
              name="total_weight"
              value={formData.total_weight}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              required
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="bags_count" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de sacs *
            </label>
            <input
              type="number"
              id="bags_count"
              name="bags_count"
              value={formData.bags_count}
              onChange={handleInputChange}
              min="1"
              required
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-amber-700 mb-1">
              Poids par sac
            </label>
            <p className="text-lg font-bold text-amber-800">
              {formData.weight_per_bag > 0 ? `${formData.weight_per_bag} kg` : '0 kg'}
            </p>
          </div>
        </div>

        {/* Prix et coût */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
              Prix par kg (CFA)
            </label>
            <input
              type="number"
              id="unit_price"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-green-700 mb-1">
              Coût total
            </label>
            <p className="text-lg font-bold text-green-800">
              {formData.total_cost > 0 ? `${formData.total_cost.toLocaleString()} CFA` : '0 CFA'}
            </p>
          </div>

          <div>
            <label htmlFor="storage_location" className="block text-sm font-medium text-gray-700 mb-2">
              Lieu de stockage
            </label>
            <input
              type="text"
              id="storage_location"
              name="storage_location"
              value={formData.storage_location}
              onChange={handleInputChange}
              placeholder="Ex: Entrepôt A, Zone 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Dates et lot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date d'expiration
            </label>
            <input
              type="date"
              id="expiry_date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de lot
            </label>
            <input
              type="text"
              id="batch_number"
              name="batch_number"
              value={formData.batch_number}
              onChange={handleInputChange}
              placeholder="Ex: ALM2025001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
            placeholder="Qualité de l'aliment, conditions de livraison, observations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Résumé */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Résumé de l'entrée</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Poids total:</span>
              <p className="font-medium">{formData.total_weight} kg</p>
            </div>
            <div>
              <span className="text-gray-600">Nombre de sacs:</span>
              <p className="font-medium">{formData.bags_count}</p>
            </div>
            <div>
              <span className="text-gray-600">Poids/sac:</span>
              <p className="font-medium">{formData.weight_per_bag} kg</p>
            </div>
            <div>
              <span className="text-gray-600">Coût total:</span>
              <p className="font-medium">{formData.total_cost.toLocaleString()} CFA</p>
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
            disabled={isSubmitting || formData.total_weight === 0 || formData.bags_count === 0}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedStockForm;