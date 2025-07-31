colour palette prototype
@import "tailwindcss";

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(221 83% 20%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(221 83% 20%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(221 83% 20%);
  --color-primary: hsl(188 95% 42%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(197 71% 90%);
  --color-secondary-foreground: hsl(221 83% 20%);
  --color-muted: hsl(197 71% 95%);
  --color-muted-foreground: hsl(221 39% 45%);
  --color-accent: hsl(158 64% 52%);
  --color-accent-foreground: hsl(0 0% 100%);
  --color-destructive: hsl(0 84% 60%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-border: hsl(197 71% 85%);
  --color-input: hsl(197 71% 90%);
  --color-ring: hsl(188 95% 42%);

  --color-navy: hsl(221 83% 20%);
  --color-cyan: hsl(188 95% 42%);
  --color-light-blue: hsl(197 71% 73%);
  --color-green: hsl(158 64% 52%);
  --color-ice-blue: hsl(197 71% 95%);
  --color-loader: var(--color-cyan);

  /* Border radius */
  --radius-lg: 0.75rem;
  --radius-md: calc(0.75rem - 2px);
  --radius-sm: calc(0.75rem - 4px);

  /* Font family */
  --font-family-sans: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Oxygen, Ubuntu, Cantarell, "Open Sans", sans-serif;

  /* Container */
  --container-center: true;
  --container-padding: 2rem;
  --container-screens-2xl: 1400px;
}
.dark {
  --color-background: hsl(240 10% 3.9%);
  --color-foreground: hsl(30 30% 90%);
  --color-card: hsl(240 10% 3.9%);
  --color-card-foreground: hsl(30 30% 90%);
  --color-popover: hsl(240 10% 3.9%);
  --color-popover-foreground: hsl(30 30% 90%);
  --color-primary: hsl(30 30% 90%);
  --color-primary-foreground: hsl(240 5.9% 10%);
  --color-secondary: hsl(240 3.7% 15.9%);
  --color-secondary-foreground: hsl(30 30% 90%);
  --color-muted: hsl(240 3.7% 15.9%);
  --color-muted-foreground: hsl(30 15% 65%);
  --color-accent: hsl(240 3.7% 15.9%);
  --color-accent-foreground: hsl(30 30% 90%);
  --color-destructive: hsl(0 62.8% 30.6%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-border: hsl(240 3.7% 25.9%);
  --color-input: hsl(240 3.7% 25.9%);
  --color-ring: hsl(30 30% 90%);

  --color-navy: hsl(240 10% 3.9%);
  --color-cyan: hsl(30 30% 90%);
  --color-light-blue: hsl(30 15% 65%);
  --color-green: hsl(158 64% 45%);
  --color-ice-blue: hsl(240 3.7% 15.9%);
}

/* Base styles */
* {
  border-color: var(--color-border);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-family-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Loader Styles */
.loader {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  mask-image: radial-gradient(circle 8px, transparent 85%, black);
}

.loader::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(50% 70% at 50% 120%, var(--color-loader) 98%, transparent),
    radial-gradient(70% 50% at -20% 50%, var(--color-loader) 98%, transparent),
    radial-gradient(50% 70% at 50% -20%, var(--color-loader) 98%, transparent),
    radial-gradient(70% 50% at 120% 50%, var(--color-loader) 98%, transparent);
  background-position: top, right, bottom, left;
  background-size: 100% 50.1%, 50.1% 100%;
  background-repeat: no-repeat;
  filter: drop-shadow(0 0 15px color-mix(in srgb, var(--color-loader) 30%, transparent));
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

/* Mobile sidebar functionality */
.sidebar-nav-container {
  /* Dynamic centering - controlled by JavaScript */
  justify-content: center;
  
  /* Smooth scrolling handled by GSAP */
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
  
  /* Prevent text selection during scrolling */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Chevron animations - handled by GSAP */
.chevron-left,
.chevron-right {
  transform-origin: center;
}

/* GSAP Smooth Scroll */
.smooth-scroll-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden; /* Hidden by default for smooth scroll */
  z-index: 1;
}

.smooth-scroll-content {
  will-change: transform;
  transform: translate3d(0, 0, 0);
  min-height: 100vh;
}

/* Ensure sidebar stays fixed above smooth scroll content */
.sidebar-fixed {
  position: fixed !important;
  z-index: 100 !important;
}

/* Optional: Fallback for users who prefer native scrolling */
@media (prefers-reduced-motion: reduce) {
  .smooth-scroll-container {
    overflow-y: auto;
  }
  
  .smooth-scroll-content {
    transform: none !important;
    will-change: auto;
  }
}

/* Custom scrollbar styling for better UX */
.smooth-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.smooth-scroll-container::-webkit-scrollbar-track {
  background: hsl(var(--color-muted));
}

.smooth-scroll-container::-webkit-scrollbar-thumb {
  background: hsl(var(--color-muted-foreground) / 0.3);
  border-radius: 4px;
}

.smooth-scroll-container::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--color-muted-foreground) / 0.5);
}