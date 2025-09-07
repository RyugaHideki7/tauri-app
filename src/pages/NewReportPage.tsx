import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DatePicker from '../components/ui/DatePicker';
import IntuitiveTimePicker from '../components/ui/IntuitiveTimePicker';

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
        <h1 className="text-2xl font-bold text-foreground mb-6">Create New Non-Conformity Report</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Production Line */}
            <div>
              <Select
                label="Production Line *"
                value={formData.line_id}
                onChange={(value) => handleInputChange('line_id', value)}
                options={[
                  { value: '', label: 'Select a production line' },
                  ...lines.map((line) => ({
                    value: line.id,
                    label: line.name
                  }))
                ]}
                error={errors.line_id}
                placeholder="Select a production line"
              />
            </div>

            {/* Product */}
            <div>
              <Select
                label="Product *"
                value={formData.product_id}
                onChange={(value) => handleInputChange('product_id', value)}
                options={[
                  { value: '', label: 'Select a product' },
                  ...products.map((product) => ({
                    value: product.id,
                    label: product.code ? `${product.designation} (${product.code})` : product.designation
                  }))
                ]}
                error={errors.product_id}
                placeholder="Select a product"
              />
            </div>

            {/* Production Date */}
            <div>
              <DatePicker
                label="Production Date *"
                value={formData.production_date}
                onChange={(value) => handleInputChange('production_date', value)}
                error={errors.production_date}
                placeholder="Select production date"
                maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>

            {/* Time */}
            <div>
              <IntuitiveTimePicker
                label="Time *"
                value={formData.time}
                onChange={(value) => handleInputChange('time', value)}
                error={errors.time}
                format="24"
              />
            </div>

            {/* Team */}
            <div>
              <Select
                label="Team *"
                value={formData.team}
                onChange={(value) => handleInputChange('team', value)}
                options={[
                  { value: 'A', label: 'Team A' },
                  { value: 'B', label: 'Team B' },
                  { value: 'C', label: 'Team C' }
                ]}
                error={errors.team}
                placeholder="Select team"
              />
            </div>

            {/* Description Type */}
            <div>
              <Select
                label="Description Type *"
                value={formData.description_type}
                onChange={(value) => handleInputChange('description_type', value)}
                options={[
                  { value: '', label: 'Select description type' },
                  ...descriptionTypes.map((type) => ({
                    value: type.name,
                    label: type.name
                  }))
                ]}
                error={errors.description_type}
                placeholder="Select description type"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
              <Select
                label="Claim Origin *"
                value={formData.claim_origin}
                onChange={(value) => handleInputChange('claim_origin', value)}
                options={[
                  { value: 'client', label: 'Client' },
                  { value: 'site01', label: 'Site 01' },
                  { value: 'site02', label: 'Site 02' },
                  { value: 'Consommateur', label: 'Consommateur' }
                ]}
                error={errors.claim_origin}
                placeholder="Select claim origin"
              />
            </div>

            {/* Valuation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Description Details *
            </label>
            <textarea
              value={formData.description_details}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description_details', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
              placeholder="Provide detailed description of the non-conformity..."
            />
            {errors.description_details && <p className="text-destructive text-sm mt-1">{errors.description_details}</p>}
          </div>

          {/* Performance Field - Only visible to performance and admin roles */}
          {canViewPerformance && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Performance Notes
              </label>
              <textarea
                value={formData.performance}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('performance', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
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