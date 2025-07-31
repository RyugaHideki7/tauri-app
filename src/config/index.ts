// Configuration management for the application
export const config = {
  app: {
    name: 'Tauri App',
    version: '1.0.0',
  },
  auth: {
    // In production, this would come from environment variables
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxLoginAttempts: 3,
  },
  api: {
    // Future API endpoint configuration
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://api.yourapp.com' 
      : 'http://localhost:3001',
    timeout: 10000,
  },
  ui: {
    // UI configuration
    sidebarWidth: {
      expanded: 240,
      collapsed: 64,
    },
    animation: {
      duration: 200,
    },
  },
} as const;

export type Config = typeof config;
