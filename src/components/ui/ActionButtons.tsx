import React from 'react';
import { Edit3, Eye, Trash2 } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';

interface ActionButtonsProps {
  onEdit: () => void;
  onShowImage?: () => void;
  onDelete: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  showImageButton?: boolean;
  deleteConfirmation?: {
    title: string;
    message: string;
  };
  theme?: 'light' | 'dark';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onEdit, 
  onShowImage, 
  onDelete, 
  size = 'md',
  variant = 'default',
  showImageButton = true,
  deleteConfirmation,
  theme
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const sizeClasses = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  const baseButtonClass = `
  ${sizeClasses[size]}
  rounded-xl
  transition-all
  duration-300
  ease-out
  flex
  items-center
  justify-center
  backdrop-blur-sm
  focus:outline-none
  focus:ring-2
  focus:ring-offset-2
  active:scale-95
  disabled:opacity-50
  disabled:cursor-not-allowed
  transform
  hover:-translate-y-0.5
`;

const buttonVariants = {
  default: {
    edit: `${baseButtonClass} bg-transparent hover:bg-blue-50 active:bg-blue-100 border border-blue-200 text-blue-600 hover:text-blue-700 focus:ring-blue-500/30 dark:bg-transparent dark:hover:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300 dark:hover:text-blue-200`,
    view: `${baseButtonClass} bg-transparent hover:bg-emerald-50 active:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 focus:ring-emerald-500/30 dark:bg-transparent dark:hover:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200`,
    delete: `${baseButtonClass} bg-transparent hover:bg-red-50 active:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 focus:ring-red-500/30 dark:bg-transparent dark:hover:bg-red-900/30 dark:border-red-700 dark:text-red-300 dark:hover:text-red-200`
  },
  
  outline: {
    edit: `${baseButtonClass} bg-transparent hover:bg-blue-50 active:bg-blue-100 border border-blue-300 text-blue-600 hover:text-blue-700 focus:ring-blue-500/30 dark:border-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300`,
    view: `${baseButtonClass} bg-transparent hover:bg-emerald-50 active:bg-emerald-100 border border-emerald-300 text-emerald-600 hover:text-emerald-700 focus:ring-emerald-500/30 dark:border-emerald-600 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:hover:text-emerald-300`,
    delete: `${baseButtonClass} bg-transparent hover:bg-red-50 active:bg-red-100 border border-red-300 text-red-600 hover:text-red-700 focus:ring-red-500/30 dark:border-red-600 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300`
  },
  
  minimal: {
    edit: `${baseButtonClass} bg-transparent hover:bg-gray-100 active:bg-gray-200 border-transparent text-blue-600 hover:text-blue-700 focus:ring-blue-500/30 dark:hover:bg-gray-700/50 dark:text-blue-400 dark:hover:text-blue-300`,
    view: `${baseButtonClass} bg-transparent hover:bg-gray-100 active:bg-gray-200 border-transparent text-emerald-600 hover:text-emerald-700 focus:ring-emerald-500/30 dark:hover:bg-gray-700/50 dark:text-emerald-400 dark:hover:text-emerald-300`,
    delete: `${baseButtonClass} bg-transparent hover:bg-gray-100 active:bg-gray-200 border-transparent text-red-600 hover:text-red-700 focus:ring-red-500/30 dark:hover:bg-gray-700/50 dark:text-red-400 dark:hover:text-red-300`
  }
};

  const handleDeleteClick = () => {
    if (deleteConfirmation) {
      setShowDeleteDialog(true);
    } else {
      onDelete();
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className={buttonVariants[variant].edit}
          title="Modifier"
          type="button"
        >
          <Edit3 size={iconSizes[size]} />
        </button>

        {showImageButton && onShowImage && (
          <button
            onClick={onShowImage}
            className={buttonVariants[variant].view}
            title="Voir la photo"
            type="button"
          >
            <Eye size={iconSizes[size]} />
          </button>
        )}

        <button
          onClick={handleDeleteClick}
          className={buttonVariants[variant].delete}
          title="Supprimer"
          type="button"
        >
          <Trash2 size={iconSizes[size]} />
        </button>
      </div>

      {deleteConfirmation && (
        <Dialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title={deleteConfirmation.title}
          theme={theme}
        >
          <div className="space-y-4">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              {deleteConfirmation.message}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default ActionButtons;
