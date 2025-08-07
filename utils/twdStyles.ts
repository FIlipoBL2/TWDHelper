// TWD Helper - Tailwind CSS Utility Classes
// Centralized styling utilities for consistent theming

export const twdStyles = {
  // Layout containers
  page: 'min-h-screen bg-twd-darker text-gray-300',
  container: 'max-w-7xl mx-auto p-4',
  
  // Cards and panels
  card: 'bg-twd-dark border border-twd-gray rounded-lg p-4 shadow-twd',
  cardLarge: 'bg-twd-dark border border-twd-gray rounded-lg p-6 shadow-twd-lg',
  cardHover: 'bg-twd-gray/50 border border-twd-gray/60 hover:border-twd-red/50 transition-all',
  
  // Buttons
  btnPrimary: 'bg-twd-red hover:bg-twd-blood text-white font-bold py-2 px-4 rounded transition-colors',
  btnSecondary: 'bg-twd-gray hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors',
  btnDanger: 'bg-twd-danger hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors',
  btnSuccess: 'bg-twd-success hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors',
  btnSmall: 'py-1 px-3 text-sm',
  btnLarge: 'py-3 px-6 text-lg',
  
  // Inputs
  input: 'bg-twd-gray border border-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-twd-red focus:border-transparent',
  inputGroup: 'flex gap-2 items-center',
  
  // Typography
  heading: 'text-twd-red font-bold',
  headingLarge: 'text-3xl font-bold text-twd-red',
  headingMedium: 'text-2xl font-bold text-twd-red',
  headingSmall: 'text-xl font-bold text-twd-red',
  textMuted: 'text-gray-400',
  textSuccess: 'text-twd-success',
  textDanger: 'text-twd-danger',
  textWarning: 'text-twd-warning',
  
  // Combat/Game specific
  diceBase: 'bg-blue-100 border-blue-400 text-blue-800',
  diceStress: 'bg-red-100 border-red-400 text-red-800',
  diceHelp: 'bg-green-100 border-green-400 text-green-800',
  diceHurt: 'bg-orange-100 border-orange-400 text-orange-800',
  
  // Status indicators
  statusActive: 'bg-twd-success text-white px-2 py-1 rounded text-xs',
  statusInactive: 'bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs',
  statusDanger: 'bg-twd-danger text-white px-2 py-1 rounded text-xs',
  statusWarning: 'bg-twd-warning text-white px-2 py-1 rounded text-xs',
  
  // Animations
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse-slow',
  bounce: 'animate-bounce-slow',
  
  // Grid and layout
  gridCols2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  gridCols3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
  gridCols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  
  // Flexbox utilities
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  flexWrap: 'flex flex-wrap gap-2',
  
  // Spacing
  spaceY2: 'space-y-2',
  spaceY4: 'space-y-4',
  spaceY6: 'space-y-6',
  spaceX2: 'space-x-2',
  spaceX4: 'space-x-4',
} as const;

// Color palette constants for programmatic use
export const twdColors = {
  dark: '#1a1a1a',
  darker: '#0d0d0d', 
  gray: '#2d2d2d',
  red: '#dc2626',
  blood: '#991b1b',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const;

// Helper function to combine classes
export const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
