import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Store preference
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme utility classes for consistent styling
export const themeClasses = {
  // Text colors
  text: {
    primary: 'text-notion-gray-900',
    secondary: 'text-notion-gray-600', 
    tertiary: 'text-notion-gray-500',
    muted: 'text-notion-gray-400',
  },
  
  // Background colors
  bg: {
    primary: 'bg-background',
    surface: 'bg-surface',
    elevated: 'bg-surface-elevated',
    hover: 'bg-surface-hover',
  },
  
  // Border colors
  border: {
    default: 'border-border',
    light: 'border-border-light',
  },
  
  // Interactive states
  interactive: {
    hover: 'hover:bg-surface-hover transition-colors duration-200',
    focus: 'focus:outline-none focus:ring-2 focus:ring-notion-blue/50 focus:border-notion-blue',
  },
  
  // Shadows
  shadow: {
    sm: 'shadow-sm dark:shadow-notion',
    md: 'shadow-md dark:shadow-notion',
    lg: 'shadow-lg dark:shadow-notion',
  },
};

// Helper function to combine theme classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};