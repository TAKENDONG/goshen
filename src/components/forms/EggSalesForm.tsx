import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { EggSale } from '../../types';
import Modal from '../ui/Modal';

interface EggSalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EggSalesData {
  date: string;
  trays_count: number;
  unit_price: number;
  client_name: string;
  total_amount: number;
  recorded_by: string;
}

const EggSalesForm: React.FC<EggSalesFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EggSalesData>({
    date: new Date().toISOString().split('T')[0],
    trays_count: 0,
    unit_price: 0,
    client_name: '',
    total_amount: 0,
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    insert: insertEggSale
  } = useSupabaseData<EggSale>('egg_sales');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        recorded_by: user.id
      }));
    }
  }, [user]);

  // Calculate total amount when trays_count or unit_price changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_amount: prev.trays_count * prev.unit_price
    }));
  }, [formData.trays_count, formData.unit_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour enregistrer des données');
      return;
    }

    if (!formData.client_name || formData.trays_count <= 0 || formData.unit_price <= 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertEggSale({
        date: formData.date,
        trays_count: formData.trays_count,
        unit_price: formData.unit_price,
        client_name: formData.client_name,
        total_amount: formData.total_amount,
        recorded_by: user.id
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        trays_count: 0,
        unit_price: 0,
        client_name: '',
        total_amount: 0,
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving egg sale:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'trays_count' ? parseInt(value) || 0 :
               name === 'unit_price' ? parseFloat(value) || 0 : value
    }));
  };

  const commonClients = [
    'Marché Central',
    'Restaurant Le Palmier',
    'Supermarché Citymart',
    'Hotel des Palmiers',
    'Restaurant La Terrasse',
    'Marché de Gros',
    'Client Particulier',
    'Autre'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Vente d'Œufs"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
            Client *
          </label>
          <select
            id="client_name"
            name="client_name"
            value={formData.client_name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2"
          >
            <option value="">Sélectionner un client</option>
            {commonClients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>

          {formData.client_name === 'Autre' && (
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleInputChange}
              placeholder="Nom du client..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          )}
        </div>

        <div>
          <label htmlFor="trays_count" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de plateaux *
          </label>
          <input
            type="number"
            id="trays_count"
            name="trays_count"
            value={formData.trays_count}
            onChange={handleInputChange}
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
            Prix unitaire (CFA) *
          </label>
          <input
            type="number"
            id="unit_price"
            name="unit_price"
            value={formData.unit_price}
            onChange={handleInputChange}
            min="0"
            step="50"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Montant total
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-medium">
            {formData.total_amount.toLocaleString()} CFA
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

export default EggSalesForm;