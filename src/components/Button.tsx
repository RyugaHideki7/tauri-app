import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  isLoading = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-notion-blue hover:bg-notion-blue/90 text-white border border-notion-blue hover:border-notion-blue/90 focus:ring-notion-blue/30',
    secondary: 'bg-surface hover:bg-surface-hover text-notion-gray-700 border border-border hover:border-notion-gray-400 focus:ring-notion-gray-400/30',
    ghost: 'text-notion-gray-700 hover:bg-surface-hover focus:ring-notion-gray-400/30',
    danger: 'bg-notion-red text-white hover:bg-notion-red/90 border border-notion-red hover:border-notion-red/90 focus:ring-notion-red/30'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={`${classes} relative`} disabled={isLoading} {...props}>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>{children}</span>
    </button>
  );
};

export default Button;