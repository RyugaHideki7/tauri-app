// These should match the backend's UserRole enum exactly
export const ROLES = {
  CLIENT: 'client',
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

export interface NavItem {
  icon: any; // This will be FontAwesome icon
  label: string;
  path: string;
  allowedRoles: UserRole[];
  showInNav?: boolean;
}
