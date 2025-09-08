import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchableSelect from '../components/ui/SearchableSelect';
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

interface Format {
  id: number;
  format_index: number;
  format_unit: string;
}

interface DescriptionType {
  id: number;
  name: string;
}

interface Client {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CreateReportRequest {
  line_id: string;
  product_id: string;
  format_id?: number;
  report_date: string;
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

interface FormData extends CreateReportRequest {
  claim_origin_client_id: string;
  claim_origin_manual: string;
}

export const NewReportPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [descriptionTypes, setDescriptionTypes] = useState<DescriptionType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    line_id: '',
    product_id: '',
    format_id: undefined,
    report_date: new Date().toISOString().split('T')[0],
    production_date: new Date().toISOString().split('T')[0],
    team: 'A',
    time: new Date().toTimeString().slice(0, 5),
    description_type: '',
    description_details: '',
    quantity: 0,
    claim_origin: '',
    claim_origin_client_id: '',
    claim_origin_manual: '',
    valuation: 0,
    performance: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  // Initialize claim origin based on user role
  useEffect(() => {
    if (user?.role) {
      let initialClaimOrigin = '';
      
      switch (user.role.toLowerCase()) {
        case 'site01':
        case 'site 01':
          initialClaimOrigin = 'site01';
          break;
        case 'site02':
        case 'site 02':
          initialClaimOrigin = 'site02';
          break;
        case 'client':
          initialClaimOrigin = 'client';
          break;
        case 'consommateur':
          initialClaimOrigin = 'consommateur';
          break;
        default:
          initialClaimOrigin = 'client';
      }
      
      setFormData(prev => ({
        ...prev,
        claim_origin: initialClaimOrigin
      }));
    }
  }, [user?.role]);

  const loadInitialData = async () => {
    try {
      const [linesData, productsData, formatsData, typesData, clientsData] = await Promise.all([
        invoke<ProductionLine[]>('get_lines'),
        invoke<Product[]>('get_products'),
        invoke<Format[]>('get_formats'),
        invoke<DescriptionType[]>('get_description_types'),
        invoke<Client[]>('get_clients'),
      ]);
      
      setLines(linesData.filter(line => line.is_active));
      setProducts(productsData);
      setFormats(formatsData);
      setDescriptionTypes(typesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Échec du chargement des données initiales :', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | undefined) => {
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
    const role = user?.role?.toLowerCase();

    if (!formData.line_id) newErrors.line_id = 'La ligne de production est requise';
    if (!formData.product_id) newErrors.product_id = 'Le produit est requis';
    if (!formData.format_id) newErrors.format_id = 'Le format est requis';
    if (!formData.report_date) newErrors.report_date = 'La date de la réclamation est requise';
    if (!formData.production_date) newErrors.production_date = 'La date de production est requise';
    if (!formData.team) newErrors.team = "L'équipe est requise";
    if (!formData.time) newErrors.time = "L'heure est requise";
    if (!formData.description_type) newErrors.description_type = 'Le type de description est requis';
    if (!formData.description_details.trim()) newErrors.description_details = 'Veuillez fournir des détails de description';
    if (formData.quantity <= 0) newErrors.quantity = 'La quantité doit être supérieure à 0';
    if (formData.valuation < 0) newErrors.valuation = 'La valorisation ne peut pas être négative';

    // Validate claim origin based on user role
    if (role === 'client') {
      if (!formData.claim_origin_client_id) {
        newErrors.claim_origin_client_id = 'Veuillez sélectionner un client';
      }
    } else if (role === 'consommateur') {
      if (!formData.claim_origin_manual?.trim()) {
        newErrors.claim_origin_manual = 'Veuillez saisir l\'origine de la réclamation';
      }
    } else {
      // For site01, site02, and other roles
      if (!formData.claim_origin) {
        newErrors.claim_origin = 'L\'origine de la réclamation est requise';
      }
    }

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
      // Prepare report data based on user role and claim origin type
      const reportData: CreateReportRequest = {
        line_id: formData.line_id,
        product_id: formData.product_id,
        format_id: formData.format_id,
        report_date: formData.report_date,
        production_date: formData.production_date,
        team: formData.team,
        time: formData.time,
        description_type: formData.description_type,
        description_details: formData.description_details,
        quantity: formData.quantity,
        claim_origin: formData.claim_origin,
        valuation: formData.valuation,
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
        format_id: undefined,
        report_date: new Date().toISOString().split('T')[0],
        production_date: new Date().toISOString().split('T')[0],
        team: 'A',
        time: new Date().toTimeString().slice(0, 5),
        description_type: '',
        description_details: '',
        quantity: 0,
        claim_origin: '',
        claim_origin_client_id: '',
        claim_origin_manual: '',
        valuation: 0,
        performance: '',
      });

      alert('Déclaration créée avec succès !');
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Échec de la création de la déclaration. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const canViewPerformance = user?.role === 'performance' || user?.role === 'admin';


  // Render claim origin field based on user role
  const renderClaimOriginField = () => {
    const role = user?.role?.toLowerCase();
    
    // For site01 and site02 roles - show disabled select with pre-selected value
    if (role === 'site01' || role === 'site 01' || role === 'site02' || role === 'site 02') {
      return (
        <Select
          label="Origine de la réclamation *"
          value={formData.claim_origin}
          onChange={() => {}} // No-op since it's disabled
          options={[
            { value: 'site01', label: 'Site 01' },
            { value: 'site02', label: 'Site 02' }
          ]}
          error={errors.claim_origin}
          disabled={true}
          placeholder="Origine de la réclamation (sélectionnée automatiquement)"
        />
      );
    }
    
    // For client role - show searchable dropdown of clients
    if (role === 'client') {
      return (
        <SearchableSelect
          label="Origine de la réclamation *"
          value={formData.claim_origin_client_id}
          onChange={(value) => {
            handleInputChange('claim_origin_client_id', value);
            // Also update the main claim_origin field for backend
            const selectedClient = clients.find(c => c.id === value);
            if (selectedClient) {
              handleInputChange('claim_origin', `Client: ${selectedClient.name}`);
            }
          }}
          options={clients.map(client => ({
            value: client.id,
            label: `Client: ${client.name}`
          }))}
          error={errors.claim_origin_client_id || errors.claim_origin}
          placeholder="Recherchez et sélectionnez un client..."
          searchPlaceholder="Rechercher des clients..."
        />
      );
    }
    
    // For consommateur role - show manual input
    if (role === 'consommateur') {
      return (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Origine de la réclamation *
          </label>
          <Input
            type="text"
            value={formData.claim_origin_manual}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleInputChange('claim_origin_manual', e.target.value);
              handleInputChange('claim_origin', e.target.value);
            }}
            error={errors.claim_origin_manual || errors.claim_origin}
            placeholder="Saisissez l'origine de la réclamation manuellement..."
          />
        </div>
      );
    }
    
    // Default fallback - regular select
    return (
      <Select
        label="Origine de la réclamation *"
        value={formData.claim_origin}
        onChange={(value) => handleInputChange('claim_origin', value)}
        options={[
          { value: 'client', label: 'Client' },
          { value: 'site01', label: 'Site 01' },
          { value: 'site02', label: 'Site 02' },
          { value: 'consommateur', label: 'Consommateur' }
        ]}
        error={errors.claim_origin}
        placeholder="Sélectionnez l'origine de la réclamation"
      />
    );
  };

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Rapport de Non-Conformité</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Production Line */}
            <div>
              <Select
                label="Ligne de production *"
                value={formData.line_id}
                onChange={(value) => handleInputChange('line_id', value)}
                options={[
                  { value: '', label: 'Sélectionnez une ligne de production' },
                  ...lines.map((line) => ({
                    value: line.id,
                    label: line.name
                  }))
                ]}
                error={errors.line_id}
                placeholder="Sélectionnez une ligne de production"
              />
            </div>

            {/* Product */}
            <div>
              <Select
                label="Produit *"
                value={formData.product_id}
                onChange={(value) => handleInputChange('product_id', value)}
                options={[
                  { value: '', label: 'Sélectionnez un produit' },
                  ...products.map((product) => ({
                    value: product.id,
                    label: product.code ? `${product.designation} (${product.code})` : product.designation
                  }))
                ]}
                error={errors.product_id}
                placeholder="Sélectionnez un produit"
              />
            </div>

            {/* Format */}
            <div>
              <Select
                label="Format *"
                value={formData.format_id?.toString() || ''}
                onChange={(value) => handleInputChange('format_id', value ? parseInt(value) : undefined)}
                options={[
                  { value: '', label: 'Sélectionnez un format' },
                  ...formats.map((format) => ({
                    value: format.id.toString(),
                    label: `${format.format_index} ${format.format_unit}`
                  }))
                ]}
                error={errors.format_id}
                placeholder="Sélectionnez un format"
              />
            </div>

            {/* Report Date */}
            <div>
              <DatePicker
                label="Date de la réclamation *"
                value={formData.report_date}
                onChange={(value) => handleInputChange('report_date', value)}
                error={errors.report_date}
                placeholder="Sélectionnez la date de la réclamation"
                maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>

            {/* Production Date */}
            <div>
              <DatePicker
                label="Date de production *"
                value={formData.production_date}
                onChange={(value) => handleInputChange('production_date', value)}
                error={errors.production_date}
                placeholder="Sélectionnez la date de production"
                maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>

            {/* Time */}
            <div>
              <IntuitiveTimePicker
                label="Heure *"
                value={formData.time}
                onChange={(value) => handleInputChange('time', value)}
                error={errors.time}
                format="24"
              />
            </div>

            {/* Team */}
            <div>
              <Select
                label="Équipe *"
                value={formData.team}
                onChange={(value) => handleInputChange('team', value)}
                options={[
                  { value: 'A', label: 'Équipe A' },
                  { value: 'B', label: 'Équipe B' },
                  { value: 'C', label: 'Équipe C' }
                ]}
                error={errors.team}
                placeholder="Sélectionnez une équipe"
              />
            </div>

            {/* Description Type */}
            <div>
              <Select
                label="Description de la NC *"
                value={formData.description_type}
                onChange={(value) => handleInputChange('description_type', value)}
                options={[
                  { value: '', label: 'Sélectionnez une description de la NC' },
                  ...descriptionTypes.map((type) => ({
                    value: type.name,
                    label: type.name
                  }))
                ]}
                error={errors.description_type}
                placeholder="Sélectionnez une description de la NC"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quantité (bouteilles) *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.quantity.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                error={errors.quantity}
              />
            </div>

            {/* Claim Origin - Dynamic based on user role */}
            <div>
              {renderClaimOriginField()}
            </div>

            {/* Valuation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Valorisation (DZD)
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
              Détails de la description *
            </label>
            <textarea
              value={formData.description_details}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description_details', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
              placeholder="Décrivez en détail la non-conformité..."
            />
            {errors.description_details && <p className="text-destructive text-sm mt-1">{errors.description_details}</p>}
          </div>

          {/* Performance Field - Only visible to performance and admin roles */}
          {canViewPerformance && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes de performance
              </label>
              <textarea
                value={formData.performance}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('performance', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
                placeholder="Ajoutez des notes ou des indicateurs de performance..."
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
              {loading ? 'Création en cours...' : 'Enregistrer la déclaration'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};