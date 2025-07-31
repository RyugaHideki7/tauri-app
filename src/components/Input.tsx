import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText, 
  leftIcon, 
  rightIcon, 
  className = '',
  ...props 
}) => {
  const baseClasses = `
    w-full px-3 py-2 border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:placeholder:text-notion-gray-600
    shadow-sm focus:shadow-md
  `;

  const inputClasses = `
    ${baseClasses}
    bg-surface text-notion-gray-900 dark:text-notion-gray-100
    border-border focus:border-notion-blue focus:ring-notion-blue/50
    ${error ? 'border-notion-red focus:ring-notion-red/50 focus:border-notion-red' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-notion-gray-700 dark:text-notion-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-notion-gray-500 dark:text-notion-gray-500 [&>svg]:text-current [&>svg]:stroke-current">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input className={inputClasses} {...props} />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-notion-gray-500 dark:text-notion-gray-500 [&>svg]:text-current [&>svg]:stroke-current">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-notion-red">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-notion-gray-500 dark:text-notion-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;