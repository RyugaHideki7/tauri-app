import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  type: propType = 'text',
  showPasswordToggle = propType === 'password',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const type = showPasswordToggle && showPassword ? 'text' : propType;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          className={`
            flex h-10 w-full text-foreground rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
            file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground 
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-destructive' : ''}
            ${showPasswordToggle ? 'pr-10' : ''}
            ${className}
          `}
          {...(propType === 'password' ? { 'data-password-input': 'true' } : {})}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setShowPassword(!showPassword);
            }}
            tabIndex={-1}
          >
            <FontAwesomeIcon 
              icon={showPassword ? faEyeSlash : faEye} 
              className="h-4 w-4"
              aria-hidden="true"
            />
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </button>
        )}
      </div>
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