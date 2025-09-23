import { faUser, faTachometerAlt, faIndustry, faBoxes, faUsers, faBuilding, faClipboardList, faExclamationTriangle, faCog } from "@fortawesome/free-solid-svg-icons";
import { ROLES, UserRole } from '../types/auth';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import LinesPage from '../pages/LinesPage';
import ProductsPage from '../pages/ProductsPage';
import ClientsPage from '../pages/ClientsPage';
import UsersPage from '../pages/UsersPage';
import { NewReportPage } from '../pages/NewReportPage';
import { ReportsPage } from '../pages/ReportsPage';
import SettingsPage from "../pages/SettingsPage";

export interface AppRoute {
  path: string;
  element: React.ComponentType;
  allowedRoles: UserRole[];
  label?: string;
  icon?: any;
  showInNav?: boolean;
}

export const APP_ROUTES: AppRoute[] = [
  {
    path: "/dashboard",
    element: DashboardPage,
    label: "Tableau de bord",
    icon: faTachometerAlt,
    allowedRoles: [ROLES.ADMIN],
    showInNav: true,
  },
  {
    path: "/profile",
    element: ProfilePage,
    label: "Profil",
    icon: faUser,
    allowedRoles: Object.values(ROLES),
    showInNav: true,
  },
  {
    path: "/lines",
    element: LinesPage,
    label: "Lignes",
    icon: faIndustry,
    allowedRoles: [ROLES.ADMIN],
    showInNav: true,
  },
  {
    path: "/products",
    element: ProductsPage,
    label: "Produits",
    icon: faBoxes,
    allowedRoles: [ROLES.ADMIN],
    showInNav: true,
  },
  {
    path: "/reports",
    element: ReportsPage,
    label: "Rapports",
    icon: faClipboardList,
    allowedRoles: Object.values(ROLES),
    showInNav: true,
  },
  {
    path: "/reports/new",
    element: NewReportPage,
    label: "Nouveau rapport",
    icon: faExclamationTriangle,
    allowedRoles: Object.values(ROLES),
    showInNav: true,
  },
  {
    path: "/clients",
    element: ClientsPage,
    label: "Clients",
    icon: faBuilding,
    allowedRoles: [ROLES.ADMIN],
    showInNav: true,
  },
  {
    path: "/users",
    element: UsersPage,
    label: "Utilisateurs",
    icon: faUsers,
    allowedRoles: [ROLES.ADMIN],
    showInNav: true,
  },
  {
    path: "/settings",
    element: SettingsPage,
    label: "Paramètres",
    icon: faCog,
    allowedRoles: [ROLES.ADMIN],
    showInNav: false,
  },
];
