import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  error, 
  helperText, 
  options,
  value,
  onChange,
  placeholder,
  className = '',
  ...props 
}) => {
  const baseClasses = `
    w-full px-3 py-2 border transition-all duration-200
    focus:outline-none focus:ring-1 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const selectClasses = `
    ${baseClasses}
    bg-surface text-notion-gray-900
    border-border focus:border-notion-blue focus:ring-notion-blue/30
    ${error ? 'border-notion-red focus:ring-notion-red/30 focus:border-notion-red' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-notion-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <select 
        className={selectClasses}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-notion-red">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-notion-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select;