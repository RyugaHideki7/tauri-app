import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faUser,
  faTachometerAlt,
  faIndustry,
  faBoxes,
  faUsers,
  faBuilding,
  faCog,
  faSignOutAlt,
  faChevronLeft,
  faChevronRight,
  faExclamationTriangle,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { ROLES, UserRole } from "../types/auth";

const { CLIENT, SITE01, SITE02, PERFORMANCE, ADMIN, CONSOMMATEUR } = ROLES;

export interface NavigationItem {
  icon: IconDefinition;
  label: string;
  path: string;
  allowedRoles: UserRole[];
  showInNav?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    icon: faTachometerAlt,
    label: "Tableau de bord",
    path: "/dashboard",
    allowedRoles: [ADMIN],
    showInNav: true,
  },
  {
    icon: faUser,
    label: "Profil",
    path: "/profile",
    allowedRoles: [ADMIN, SITE01, SITE02, PERFORMANCE, CONSOMMATEUR, CLIENT],
    showInNav: true,
  },
  {
    icon: faIndustry,
    label: "Lignes",
    path: "/lines",
    allowedRoles: [ADMIN],
    showInNav: true,
  },
  {
    icon: faBoxes,
    label: "Produits",
    path: "/products",
    allowedRoles: [ADMIN],
    showInNav: true,
  },
  {
    icon: faClipboardList,
    label: "Rapports",
    path: "/reports",
    allowedRoles: [ADMIN, SITE01, SITE02, PERFORMANCE, CONSOMMATEUR, CLIENT],
    showInNav: true,
  },
  {
    icon: faExclamationTriangle,
    label: "Nouveau rapport",
    path: "/reports/new",
    allowedRoles: [ADMIN, SITE01, SITE02, PERFORMANCE, CONSOMMATEUR, CLIENT],
    showInNav: true,
  },
  {
    icon: faBuilding,
    label: "Clients",
    path: "/clients",
    allowedRoles: [ADMIN, CLIENT],
    showInNav: true,
  },
  {
    icon: faUsers,
    label: "Utilisateurs",
    path: "/users",
    allowedRoles: [ADMIN],
    showInNav: true,
  },
  {
    icon: faCog,
    label: "Paramètres",
    path: "/settings",
    allowedRoles: [ADMIN, PERFORMANCE],
    showInNav: true,
  },
];

// Helper function to filter navigation items based on user role
export const getFilteredNavItems = (userRole: UserRole) => {
  return NAVIGATION_ITEMS.filter(
    (item) => item.showInNav && item.allowedRoles.includes(userRole)
  );
};

export const NAVIGATION_ICONS = {
  LOGOUT: faSignOutAlt,
  COLLAPSE: faChevronLeft,
  EXPAND: faChevronRight,
} as const;
