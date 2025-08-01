import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faUser,
  faTachometerAlt,
  faIndustry,
  faBoxes,
  faUsers,
  faCog,
  faSignOutAlt,
  faChevronLeft,
  faChevronRight,
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
    icon: faUser,
    label: "Profile",
    path: "/profile",
    allowedRoles: [ADMIN, SITE01, SITE02, PERFORMANCE, CONSOMMATEUR, CLIENT],
    showInNav: true,
  },
  {
    icon: faTachometerAlt,
    label: "Dashboard",
    path: "/dashboard",
    allowedRoles: [ADMIN, SITE01, SITE02, PERFORMANCE, CONSOMMATEUR],
    showInNav: true,
  },
  {
    icon: faIndustry,
    label: "Lines",
    path: "/lines",
    allowedRoles: [ADMIN, SITE01, SITE02, PERFORMANCE],
    showInNav: true,
  },
  {
    icon: faBoxes,
    label: "Products",
    path: "/products",
    allowedRoles: [ADMIN, SITE01, SITE02, PERFORMANCE],
    showInNav: true,
  },
  {
    icon: faUsers,
    label: "Users",
    path: "/users",
    allowedRoles: [ADMIN],
    showInNav: true,
  },
  {
    icon: faCog,
    label: "Settings",
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
