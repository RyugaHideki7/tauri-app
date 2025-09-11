import React, { useState, useRef } from 'react';
import Button from './Button';

interface PictureUploadProps {
  label?: string;
  value?: string | null;
  onChange: (base64Data: string | null) => void;
  error?: string;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const PictureUpload: React.FC<PictureUploadProps> = ({
  label = "Photo (optionnelle)",
  value,
  onChange,
  error,
  disabled = false,
  accept = "image/*",
  maxSize = 5, // 5MB default
  className = ""
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`La taille du fichier ne doit pas dépasser ${maxSize}MB.`);
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erreur lors du traitement du fichier.');
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-500' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Traitement en cours...</p>
            </div>
          ) : value ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <img
                  src={value}
                  alt="Aperçu"
                  className="max-h-32 max-w-full object-contain rounded border"
                />
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  disabled={disabled}
                >
                  Remplacer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Cliquez pour sélectionner ou glissez-déposez une image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF jusqu'à {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          Ajoutez une photo pour documenter la non-conformité (optionnel)
        </p>
      </div>
    </div>
  );
};

export default PictureUpload;
