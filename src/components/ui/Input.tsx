import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <input
        className={`
          flex h-10 w-full text-foreground rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
          file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-destructive' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

export default Input;