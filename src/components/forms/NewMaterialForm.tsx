import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

interface NewMaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MaterialData {
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  unit_price: number;
  supplier: string;
  minimum_stock: number;
  maximum_stock: number;
}

const NewMaterialForm: React.FC<NewMaterialFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<MaterialData>({
    name: '',
    category: '',
    unit: 'kg',
    current_stock: 0,
    unit_price: 0,
    supplier: '',
    minimum_stock: 0,
    maximum_stock: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    insert: insertMaterial
  } = useSupabaseData<any>('raw_materials');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté pour ajouter une matière première');
      return;
    }

    if (!formData.name || !formData.category || !formData.supplier) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await insertMaterial({
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        current_stock: formData.current_stock,
        unit_price: formData.unit_price,
        supplier: formData.supplier,
        minimum_stock: formData.minimum_stock,
        maximum_stock: formData.maximum_stock
      });

      if (error) {
        throw new Error(error);
      }

      // Reset form
      setFormData({
        name: '',
        category: '',
        unit: 'kg',
        current_stock: 0,
        unit_price: 0,
        supplier: '',
        minimum_stock: 0,
        maximum_stock: 0
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['current_stock', 'unit_price', 'minimum_stock', 'maximum_stock'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  const categories = [
    'cereales',
    'proteines',
    'vitamines',
    'mineraux',
    'lipides',
    'additifs'
  ];

  const units = [
    'kg',
    'tonnes',
    'sacs',
    'L',
    'unités'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Matière Première"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom et catégorie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la matière première *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Ex: Maïs grain, Tourteau de soja..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Unité et fournisseur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              Unité de mesure *
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseur principal *
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

        {/* Stock initial et prix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="current_stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stock initial
            </label>
            <input
              type="number"
              id="current_stock"
              name="current_stock"
              value={formData.current_stock}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
              Prix unitaire (CFA)
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
        </div>

        {/* Seuils de stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minimum_stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stock minimum (seuil d'alerte)
            </label>
            <input
              type="number"
              id="minimum_stock"
              name="minimum_stock"
              value={formData.minimum_stock}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="maximum_stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stock maximum (capacité)
            </label>
            <input
              type="number"
              id="maximum_stock"
              name="maximum_stock"
              value={formData.maximum_stock}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Résumé */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-700 mb-3">Résumé</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nom:</span>
              <p className="font-medium text-amber-800">{formData.name || 'Non défini'}</p>
            </div>
            <div>
              <span className="text-gray-600">Catégorie:</span>
              <p className="font-medium text-amber-800">
                {formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : 'Non définie'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Unité:</span>
              <p className="font-medium text-amber-800">{formData.unit}</p>
            </div>
            <div>
              <span className="text-gray-600">Prix:</span>
              <p className="font-medium text-amber-800">{formData.unit_price.toLocaleString()} CFA/{formData.unit}</p>
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
            disabled={isSubmitting || !formData.name || !formData.category}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enregistrement...' : 'Ajouter la Matière Première'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewMaterialForm;