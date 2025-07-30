import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-notion-blue text-white hover:bg-notion-blue/90 focus:ring-notion-blue/50 shadow-sm',
    secondary: 'bg-notion-gray-200 dark:bg-notion-gray-300 text-notion-gray-900 dark:text-notion-gray-900 hover:bg-notion-gray-300 dark:hover:bg-notion-gray-400 focus:ring-notion-gray-400/50',
    ghost: 'text-notion-gray-700 dark:text-notion-gray-700 hover:bg-notion-gray-200 dark:hover:bg-notion-gray-300 focus:ring-notion-gray-400/50',
    danger: 'bg-notion-red text-white hover:bg-notion-red/90 focus:ring-notion-red/50 shadow-sm'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;