import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { RawMaterial } from '../../types';
import Modal from '../ui/Modal';

interface FeedEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeedEntryData {
  material_id: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  delivery_date: string;
  batch_number: string;
  expiry_date: string;
  notes: string;
  recorded_by: string;
}

const FeedEntryForm: React.FC<FeedEntryFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FeedEntryData>({
    material_id: '',
    quantity: 0,
    unit_price: 0,
    supplier: '',
    delivery_date: new Date().toISOString().split('T')[0],
    batch_number: '',
    expiry_date: '',
    notes: '',
    recorded_by: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: rawMaterials,
    loading: materialsLoading
  } = useSupabaseData<RawMaterial>('raw_materials', 'id, name, unit, current_stock, unit_price');

  const {
    insert: insertEntry
  } = useSupabaseData<any>('feed_entries');

  const {
    update: updateMaterial
  } = useSupabaseData<RawMaterial>('raw_materials');

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

    if (!formData.material_id || formData.quantity <= 0 || formData.unit_price <= 0) {
      alert('Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the selected material to get current stock
      const selectedMaterial = rawMaterials.find(material => material.id === formData.material_id);
      if (!selectedMaterial) {
        throw new Error('Matière première non trouvée');
      }

      // Calculate total amount
      const totalAmount = formData.quantity * formData.unit_price;

      // Insert feed entry record
      const { error: entryError } = await insertEntry({
        material_id: formData.material_id,
        entry_type: 'purchase',
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: totalAmount,
        supplier: formData.supplier,
        delivery_date: formData.delivery_date,
        batch_number: formData.batch_number,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes,
        recorded_by: user.id
      });

      if (entryError) {
        throw new Error(entryError);
      }

      // Update material stock (add new quantity)
      const newStock = selectedMaterial.current_stock + formData.quantity;
      const { error: updateError } = await updateMaterial(formData.material_id, {
        current_stock: newStock,
        unit_price: formData.unit_price // Update with latest price
      });

      if (updateError) {
        throw new Error(updateError);
      }

      // Reset form
      setFormData({
        material_id: '',
        quantity: 0,
        unit_price: 0,
        supplier: '',
        delivery_date: new Date().toISOString().split('T')[0],
        batch_number: '',
        expiry_date: '',
        notes: '',
        recorded_by: user.id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving feed entry:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['quantity', 'unit_price'].includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    const selectedMaterial = rawMaterials.find(material => material.id === materialId);

    setFormData(prev => ({
      ...prev,
      material_id: materialId,
      unit_price: selectedMaterial?.unit_price || 0
    }));
  };

  const totalAmount = formData.quantity * formData.unit_price;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Entrée de Marchandises - Provenderie"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Material Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="material_id" className="block text-sm font-medium text-gray-700 mb-2">
              Matière première *
            </label>
            <select
              id="material_id"
              name="material_id"
              value={formData.material_id}
              onChange={handleMaterialChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={materialsLoading}
            >
              <option value="">Sélectionner une matière première</option>
              {rawMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} (Stock: {material.current_stock} {material.unit})
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quantity and Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantité reçue *
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.material_id && (
              <p className="text-xs text-gray-500 mt-1">
                Unité: {rawMaterials.find(m => m.id === formData.material_id)?.unit}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
              Prix unitaire *
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">CFA par unité</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Montant total
            </label>
            <p className="text-lg font-bold text-blue-800">
              {totalAmount.toLocaleString()} CFA
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Batch and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Facultatif"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Remarques, conditions de livraison..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            disabled={isSubmitting || totalAmount === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'entrée'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedEntryForm;