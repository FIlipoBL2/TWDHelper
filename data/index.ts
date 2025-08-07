// Lazy loading for large data files to improve initial bundle size

export const loadTables = () => import('./tables');
export const loadPremades = () => import('./premades');

// Re-export constants that are needed immediately
export * from '../constants';
