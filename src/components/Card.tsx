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
      themeClasses.bg.surface,
      'rounded-lg border',
      themeClasses.border.default,
      paddingClasses[padding],
      shadowClasses[shadow],
      hover && themeClasses.interactive.hover,
      className
    )}>
      {children}
    </div>
  );
};

export default Card;