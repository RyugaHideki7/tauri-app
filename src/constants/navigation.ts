import {
  faSignOutAlt,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { User, hasAnyRole } from '../types/auth';
import { APP_ROUTES } from "./routes";

// Helper function to filter navigation items based on user roles (supports multiple roles)
export const getFilteredNavItems = (user: User) => {
  return APP_ROUTES.filter(
    (route) => route.showInNav && route.label && route.icon && hasAnyRole(user, route.allowedRoles)
  );
};

export const NAVIGATION_ICONS = {
  LOGOUT: faSignOutAlt,
  COLLAPSE: faChevronLeft,
  EXPAND: faChevronRight,
} as const;
