// These should match the backend's UserRole enum exactly
export const ROLES = {
  RECLAMATION_CLIENT: 'Réclamation client',
  RETOUR_CLIENT: 'Retour client',
  SITE01: 'site01',
  SITE02: 'site02',
  PERFORMANCE: 'performance',
  ADMIN: 'admin',
  CONSOMMATEUR: 'consommateur',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export interface User {
  id: string;
  username: string;
  role: string; // Primary role for backward compatibility
  roles: string[]; // Multiple roles array
}

export interface NavItem {
  icon: any; // This will be FontAwesome icon
  label: string;
  path: string;
  allowedRoles: UserRole[];
  showInNav?: boolean;
}

// Utility functions for role checking
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.roles.includes(role);
};

export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.some(role => user.roles.includes(role));
};

export const hasAllRoles = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.every(role => user.roles.includes(role));
};
