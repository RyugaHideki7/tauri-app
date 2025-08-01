export const LAYOUT_CONSTANTS = {
  SIDEBAR: {
    EXPANDED_WIDTH: 280,
    COLLAPSED_WIDTH: 72,
    ANIMATION_DURATION: 300,
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
  },
} as const;

export type LayoutConstants = typeof LAYOUT_CONSTANTS;