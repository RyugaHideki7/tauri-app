import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface NavigationItem {
  id: string;
  label: string;
  icon: IconDefinition;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: NavigationItem[];
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  navigationItems: NavigationItem[];
}

export interface NavigationItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  isActive?: boolean;
  level?: number;
}

export interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export interface SidebarNavigationProps {
  items: NavigationItem[];
  isCollapsed: boolean;
  activeItemId?: string;
}

export interface SidebarFooterProps {
  isCollapsed: boolean;
}