import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ProductionLine {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Product {
  id: string;
  designation: string;
  code: string;
}

interface DescriptionType {
  id: number;
  name: string;
}

interface CreateReportRequest {
  line_id: string;
  product_id: string;
  production_date: string;
  team: string;
  time: string;
  description_type: string;
  description_details: string;
  quantity: number;
  claim_origin: string;
  valuation: number;
  performance?: string;
}

export const NewReportPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [descriptionTypes, setDescriptionTypes] = useState<DescriptionType[]>([]);
  
  const [formData, setFormData] = useState<CreateReportRequest>({
    line_id: '',
    product_id: '',
    production_date: new Date().toISOString().split('T')[0],
    team: 'A',
    time: new Date().toTimeString().slice(0, 5),
    description_type: '',
    description_details: '',
    quantity: 0,
    claim_origin: 'client',
    valuation: 0,
    performance: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [linesData, productsData, typesData] = await Promise.all([
        invoke<ProductionLine[]>('get_lines'),
        invoke<Product[]>('get_products'),
        invoke<DescriptionType[]>('get_description_types'),
      ]);
      
      setLines(linesData.filter(line => line.is_active));
      setProducts(productsData);
      setDescriptionTypes(typesData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleInputChange = (field: keyof CreateReportRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.line_id) newErrors.line_id = 'Production line is required';
    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.production_date) newErrors.production_date = 'Production date is required';
    if (!formData.team) newErrors.team = 'Team is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.description_type) newErrors.description_type = 'Description type is required';
    if (!formData.description_details.trim()) newErrors.description_details = 'Description details are required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.claim_origin) newErrors.claim_origin = 'Claim origin is required';
    if (formData.valuation < 0) newErrors.valuation = 'Valuation cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        ...formData,
        // Only include performance field if user has permission
        performance: (user?.role === 'performance' || user?.role === 'admin') ? formData.performance : undefined
      };

      await invoke('create_report', {
        request: reportData,
        reportedBy: user?.id
      });

      // Reset form
      setFormData({
        line_id: '',
        product_id: '',
        production_date: new Date().toISOString().split('T')[0],
        team: 'A',
        time: new Date().toTimeString().slice(0, 5),
        description_type: '',
        description_details: '',
        quantity: 0,
        claim_origin: 'client',
        valuation: 0,
        performance: '',
      });

      alert('Report created successfully!');
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Failed to create report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canViewPerformance = user?.role === 'performance' || user?.role === 'admin';

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Non-Conformity Report</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Production Line */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Line *
              </label>
              <select
                value={formData.line_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('line_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a production line</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </select>
              {errors.line_id && <p className="text-red-500 text-sm mt-1">{errors.line_id}</p>}
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product *
              </label>
              <select
                value={formData.product_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('product_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.designation} ({product.code})
                  </option>
                ))}
              </select>
              {errors.product_id && <p className="text-red-500 text-sm mt-1">{errors.product_id}</p>}
            </div>

            {/* Production Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Date *
              </label>
              <Input
                type="date"
                value={formData.production_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('production_date', e.target.value)}
                error={errors.production_date}
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('time', e.target.value)}
                error={errors.time}
              />
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team *
              </label>
              <select
                value={formData.team}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('team', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Team A</option>
                <option value="B">Team B</option>
                <option value="C">Team C</option>
              </select>
              {errors.team && <p className="text-red-500 text-sm mt-1">{errors.team}</p>}
            </div>

            {/* Description Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description Type *
              </label>
              <select
                value={formData.description_type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('description_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select description type</option>
                {descriptionTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.description_type && <p className="text-red-500 text-sm mt-1">{errors.description_type}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (bottles) *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.quantity.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                error={errors.quantity}
              />
            </div>

            {/* Claim Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claim Origin *
              </label>
              <select
                value={formData.claim_origin}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('claim_origin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="client">Client</option>
                <option value="site01">Site 01</option>
                <option value="site02">Site 02</option>
                <option value="Consommateur">Consommateur</option>
              </select>
              {errors.claim_origin && <p className="text-red-500 text-sm mt-1">{errors.claim_origin}</p>}
            </div>

            {/* Valuation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valuation (DZD)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.valuation.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('valuation', parseFloat(e.target.value) || 0)}
                error={errors.valuation}
              />
            </div>
          </div>

          {/* Description Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description Details *
            </label>
            <textarea
              value={formData.description_details}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description_details', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed description of the non-conformity..."
            />
            {errors.description_details && <p className="text-red-500 text-sm mt-1">{errors.description_details}</p>}
          </div>

          {/* Performance Field - Only visible to performance and admin roles */}
          {canViewPerformance && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performance Notes
              </label>
              <textarea
                value={formData.performance}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('performance', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add performance-related notes or metrics..."
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-2"
            >
              {loading ? 'Creating Report...' : 'Create Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};