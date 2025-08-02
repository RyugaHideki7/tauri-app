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

export interface NavigationItem {
  icon: IconDefinition;
  label: string;
  path: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    icon: faUser,
    label: "Profile",
    path: "/profile",
  },
  {
    icon: faTachometerAlt,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: faIndustry,
    label: "Lines",
    path: "/lines",
  },
  {
    icon: faBoxes,
    label: "Products",
    path: "/products",
  },
  {
    icon: faUsers,
    label: "Users",
    path: "/users",
  },
  {
    icon: faCog,
    label: "Settings",
    path: "/settings",
  },
];

export const NAVIGATION_ICONS = {
  LOGOUT: faSignOutAlt,
  COLLAPSE: faChevronLeft,
  EXPAND: faChevronRight,
} as const;
