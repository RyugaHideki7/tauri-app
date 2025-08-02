import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  error, 
  className = '',
  placeholder = 'Select an option...',
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-destructive' : ''}
          ${className}
        `}
      >
        {placeholder && !value && (
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
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
};

export default Select;