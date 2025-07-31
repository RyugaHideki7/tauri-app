import React from 'react';
import { cn, themeClasses } from './ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'sm',
  hover = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: themeClasses.shadow.sm,
    md: themeClasses.shadow.md,
    lg: themeClasses.shadow.lg
  };

  return (
    <div className={cn(
      'bg-surface border border-border',
      paddingClasses[padding],
      shadow !== 'none' && 'shadow-sm dark:shadow-notion',
      hover && 'hover:bg-surface-hover transition-colors duration-200',
      className
    )}>
      {children}
    </div>
  );
};

export default Card;