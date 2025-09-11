import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchableSelect from '../components/ui/SearchableSelect';
import DatePicker from '../components/ui/DatePicker';
import IntuitiveTimePicker from '../components/ui/IntuitiveTimePicker';
import Dialog from '../components/ui/Dialog';
import { ROLES } from '../types/auth';

interface Client {
  id: string;
  name: string;
}


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
  claim_origin_detail: string | null;
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
  const [selectedClient, setSelectedClient] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    line_id: '',
    product_id: '',
    format_id: undefined,
    report_date: new Date().toISOString().split('T')[0],
    production_date: new Date().toISOString().split('T')[0],
    team: 'A',
    time: new Date().toTimeString().slice(0, 5),
    description_type: '',
    description_details: user?.role === 'site01' ? 'Site 01' : user?.role === 'site02' ? 'Site 02' : '',
    quantity: 0,
    claim_origin: '',
    claim_origin_detail: '',
    claim_origin_client_id: '',
    claim_origin_manual: '',
    valuation: 0,
    performance: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Initialize claim origin based on user role
  useEffect(() => {
    if (user?.role) {
      const role = user.role;
      let initialClaimOrigin = '';
      
      // Only set initial value for non-admin/non-performance roles
      if (role !== ROLES.PERFORMANCE && role !== ROLES.ADMIN) {
        switch (role) {
          case ROLES.SITE01:
            initialClaimOrigin = ROLES.SITE01;
            break;
          case ROLES.SITE02:
            initialClaimOrigin = ROLES.SITE02;
            break;
          case ROLES.RECLAMATION_CLIENT:
            initialClaimOrigin = ROLES.RECLAMATION_CLIENT;
            break;
          case ROLES.RETOUR_CLIENT:
            initialClaimOrigin = ROLES.RETOUR_CLIENT;
            break;
          case ROLES.CONSOMMATEUR:
            initialClaimOrigin = ROLES.CONSOMMATEUR;
            break;
          default:
            initialClaimOrigin = role;
        }
        
        setFormData(prev => ({
          ...prev,
          claim_origin: initialClaimOrigin
        }));
      }
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
      setClients(clientsData || []);
    } catch (error) {
      console.error('Échec du chargement des données initiales :', error);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => {
      // If claim_origin changes to/from site01/site02, update description_details accordingly
      if (name === 'claim_origin') {
        if (['site01', 'site02'].includes(value)) {
          return {
            ...prev,
            [name]: value,
            description_details: value === 'site01' ? 'Site 01' : 'Site 02'
          };
        } else if (['site01', 'site02'].includes(prev.claim_origin)) {
          // If changing from site01/site02 to something else, clear the description
          return {
            ...prev,
            [name]: value,
            description_details: ''
          };
        }
      }
      return {
        ...prev,
        [name]: value
      };
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.line_id) newErrors.line_id = 'La ligne de production est requise';
    if (!formData.product_id) newErrors.product_id = 'Le produit est requis';
    if (!formData.format_id) newErrors.format_id = 'Le format est requis';
    if (!formData.report_date) newErrors.report_date = 'La date de la réclamation est requise';
    if (!formData.production_date) newErrors.production_date = 'La date de production est requise';
    if (!formData.team) newErrors.team = "L'équipe est requise";
    if (!formData.time) newErrors.time = "L'heure est requise";
    if (!formData.description_type) newErrors.description_type = 'Le type de description est requis';
    // Skip description_details validation for site01/site02 users or when site01/site02 is selected
    const isSiteUser = ['site01', 'site02'].includes(user?.role || '');
    const isSiteSelected = ['site01', 'site02'].includes(formData.claim_origin);
    if (!isSiteUser && !isSiteSelected && !formData.description_details.trim()) {
      newErrors.description_details = 'Veuillez fournir des détails de description';
    }
    if (formData.quantity <= 0) newErrors.quantity = 'La quantité doit être supérieure à 0';

    // Validate claim origin - required for all roles
    if (!formData.claim_origin) {
      newErrors.claim_origin = 'L\'origine de la réclamation est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
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
        claim_origin_detail: formData.claim_origin_detail && formData.claim_origin_detail.trim() !== '' ? formData.claim_origin_detail.trim() : null,
        valuation: 0,
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
        claim_origin_detail: '',
        claim_origin_client_id: '',
        claim_origin_manual: '',
        valuation: 0,
        performance: '',
      });

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Échec de la création de la déclaration. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Render claim origin field based on user role
  const renderClaimOriginField = () => {
    const role = user?.role;
    const canEditClaimOrigin = role === ROLES.PERFORMANCE || role === ROLES.ADMIN;
    const isClientClaim = [ROLES.RECLAMATION_CLIENT, ROLES.RETOUR_CLIENT].includes(formData.claim_origin as typeof ROLES.RECLAMATION_CLIENT | typeof ROLES.RETOUR_CLIENT);

    // For performance and admin roles - show full select with all options
    if (canEditClaimOrigin) {
      return (
        <Select
          label="Origine de la réclamation *"
          value={formData.claim_origin}
          onChange={(value) => {
            handleInputChange('claim_origin', value as string);
            // Clear client selection when changing claim origin
            setSelectedClient('');
            handleInputChange('claim_origin_detail', '');
            handleInputChange('claim_origin_client_id', '');
          }}
          options={[
            { value: ROLES.RECLAMATION_CLIENT, label: ROLES.RECLAMATION_CLIENT },
            { value: ROLES.RETOUR_CLIENT, label: ROLES.RETOUR_CLIENT },
            { value: 'site01', label: 'Site 01' },
            { value: 'site02', label: 'Site 02' },
            { value: ROLES.CONSOMMATEUR, label: ROLES.CONSOMMATEUR },
          ]}
          error={errors.claim_origin}
          placeholder="Sélectionnez l'origine de la réclamation"
        />
      );
    }

    // For site01 and site02 roles - show disabled select with pre-selected value
    if (role === 'site01' || role === 'site02') {
      return (
        <Select
          label="Origine de la réclamation *"
          value={role}
          onChange={() => {}}
          options={[
            { value: 'site01', label: 'Site 01' },
            { value: 'site02', label: 'Site 02' },
          ]}
          error={errors.claim_origin}
          disabled={true}
          placeholder="Origine de la réclamation (pré-sélectionnée)"
        />
      );
    }

    // For client roles - show disabled select with role pre-selected
    if (role === ROLES.RECLAMATION_CLIENT || role === ROLES.RETOUR_CLIENT) {
      return (
        <Select
          label="Origine de la réclamation *"
          value={role}
          onChange={() => {}}
          options={[
            { value: ROLES.RECLAMATION_CLIENT, label: ROLES.RECLAMATION_CLIENT },
            { value: ROLES.RETOUR_CLIENT, label: ROLES.RETOUR_CLIENT },
          ]}
          error={errors.claim_origin}
          disabled={true}
          placeholder="Origine de la réclamation (pré-sélectionnée)"
        />
      );
    }

    // For consommateur role - show disabled select with consommateur pre-selected
    if (role === ROLES.CONSOMMATEUR) {
      return (
        <Select
          label="Origine de la réclamation *"
          value={ROLES.CONSOMMATEUR}
          onChange={() => {}}
          options={[
            { value: ROLES.CONSOMMATEUR, label: ROLES.CONSOMMATEUR },
          ]}
          error={errors.claim_origin}
          disabled={true}
          placeholder="Origine de la réclamation (pré-sélectionnée)"
        />
      );
    }

    // Default fallback - should not happen with proper role setup
    return (
      <Select
        label="Origine de la réclamation *"
        value={formData.claim_origin}
        onChange={() => {}}
        options={[
          { value: ROLES.RECLAMATION_CLIENT, label: ROLES.RECLAMATION_CLIENT },
          { value: ROLES.RETOUR_CLIENT, label: ROLES.RETOUR_CLIENT },
          { value: 'site01', label: 'Site 01' },
          { value: 'site02', label: 'Site 02' },
          { value: ROLES.CONSOMMATEUR, label: ROLES.CONSOMMATEUR },
        ]}
        error={errors.claim_origin}
        disabled={true}
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
              <SearchableSelect
                label="Ligne de production *"
                value={formData.line_id}
                onChange={(value) => handleInputChange('line_id', value as string)}
                options={[
                  { value: '', label: 'Sélectionnez une ligne de production' },
                  ...lines.map((line) => ({
                    value: line.id,
                    label: line.name
                  }))
                ]}
                error={errors.line_id}
                placeholder="Sélectionnez une ligne de production"
                searchPlaceholder="Rechercher une ligne..."
              />
            </div>

            {/* Product */}
            <div>
              <SearchableSelect
                label="Produit *"
                value={formData.product_id}
                onChange={(value) => handleInputChange('product_id', value as string)}
                options={[
                  { value: '', label: 'Sélectionnez un produit' },
                  ...products.map((product) => ({
                    value: product.id,
                    label: product.code ? `${product.designation} (${product.code})` : product.designation
                  }))
                ]}
                error={errors.product_id}
                placeholder="Sélectionnez un produit"
                searchPlaceholder="Rechercher un produit..."
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

            {/* Client Selection or Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Détail de la réclamation *
              </label>
              {['site01', 'site02'].includes(user?.role || '') || 
               ['site01', 'site02'].includes(formData.claim_origin) ? (
                <Input
                  type="text"
                  value={formData.claim_origin === 'site01' || user?.role === 'site01' ? 'Site 01' : 'Site 02'}
                  disabled
                  className="w-full bg-gray-100"
                />
              ) : ((user?.role === ROLES.RECLAMATION_CLIENT || 
                 user?.role === ROLES.RETOUR_CLIENT ||
                 (user?.role === ROLES.ADMIN && (formData.claim_origin === ROLES.RECLAMATION_CLIENT || formData.claim_origin === ROLES.RETOUR_CLIENT)) ||
                 (user?.role === ROLES.PERFORMANCE && (formData.claim_origin === ROLES.RECLAMATION_CLIENT || formData.claim_origin === ROLES.RETOUR_CLIENT))
                ) && clients.length > 0) ? (
                <>
                  <SearchableSelect
                    value={selectedClient}
                    onChange={(value) => {
                      const selectedClientData = clients.find(c => c.id === value);
                      setSelectedClient(value);
                      // Store client name in claim_origin_detail
                      handleInputChange('claim_origin_detail', selectedClientData?.name || '');
                      // Store client ID in claim_origin_client_id
                      handleInputChange('claim_origin_client_id', value);
                    }}
                    options={[
                      { value: '', label: 'Sélectionnez un client' },
                      ...clients.map(client => ({
                        value: client.id,
                        label: client.name
                      }))
                    ]}
                    error={errors.description_details}
                    placeholder="Sélectionnez un client"
                    searchPlaceholder="Rechercher un client..."
                  />
                  {errors.description_details && (
                    <p className="mt-1 text-sm text-red-500">{errors.description_details}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-full">
                    <textarea
                      id="description-details"
                      value={formData.description_details || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description_details', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={4}
                      placeholder="Décrivez en détail la non-conformité constatée..."
                      required
                    />
                  </div>
                  {errors.description_details && (
                    <p className="mt-1 text-sm text-red-500">{errors.description_details}</p>
                  )}
                </>
              )}
            </div>

            {/* Claim Origin Detail (optional) */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Détails complémentaires
              </label>
              <div className="w-full">
                <textarea
                  id="claim-origin-details"
                  value={formData.claim_origin_detail || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('claim_origin_detail', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
                  placeholder="Détails complémentaires sur la non-conformité..."
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Ce champ est optionnel et sert à ajouter des détails spécifiques sur l'origine du signalement.
              </p>
            </div>

            {/* Submit Button */}
            <div className="col-span-2 pt-4">
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Confirmation Dialog */}
        <Dialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          title="Confirmer la déclaration"
        >
          <p className="mb-6">Êtes-vous sûr de vouloir soumettre cette déclaration de non-conformité ?</p>
          <div className="flex justify-end space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? 'Envoi en cours...' : 'Confirmer'}
            </Button>
          </div>
        </Dialog>

        {/* Success Dialog */}
        <Dialog
          isOpen={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            window.location.href = '/reports';
          }}
          title="Déclaration enregistrée"
          className="max-w-md"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Déclaration enregistrée</h3>
            <p className="text-sm text-gray-500 mb-6">
              Votre rapport a été enregistré avec succès dans le système.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessDialog(false);
                  window.location.href = '/reports';
                }}
                className="px-4 py-2"
              >
                Voir les rapports
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  // Reset form data
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
                    claim_origin_detail: '', // This will be set by the client selection
                    claim_origin_client_id: '',
                    claim_origin_manual: '',
                    valuation: 0,
                    performance: '',
                  });
                  // Reset client selection
                  setSelectedClient('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                Créer un autre rapport
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};