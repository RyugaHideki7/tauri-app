export interface LayoutState {
  sidebarCollapsed: boolean;
  activeNavItem: string;
  isMobile: boolean;
  sidebarOverlay: boolean;
}

export interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activeNavItem: string;
  setActiveNavItem: (itemId: string) => void;
  isMobile: boolean;
  sidebarOverlay: boolean;
  setSidebarOverlay: (overlay: boolean) => void;
}

export interface LayoutProviderProps {
  children: React.ReactNode;
}

export interface UseLayoutHook {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeNavItem: string;
  setActiveNavItem: (itemId: string) => void;
  isMobile: boolean;
  sidebarOverlay: boolean;
  setSidebarOverlay: (overlay: boolean) => void;
}