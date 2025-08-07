/**
 * Component Factory - Creates optimized, memoized components following SOLID principles
 * Addresses performance issues through proper memoization and lazy loading
 */
import React, { 
  ComponentType, 
  PropsWithChildren, 
  ReactElement, 
  Suspense,
  lazy,
  memo,
  useMemo,
  useCallback,
  useRef,
  useEffect
} from 'react';

// Loading component for lazy-loaded components
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
    <span className="ml-2 text-gray-400">{message}</span>
  </div>
);

// Error boundary wrapper component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  PropsWithChildren<{ fallback?: ComponentType<{ error?: Error }> }>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{ fallback?: ComponentType<{ error?: Error }> }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }
      return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <h3 className="text-red-400 font-bold">Something went wrong</h3>
          <p className="text-gray-300">Please refresh the page to continue.</p>
          {this.state.error && (
            <details className="mt-2 text-xs text-gray-400">
              <summary>Error details</summary>
              <pre>{this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
    <h3 className="text-red-400 font-bold">Component Error</h3>
    <p className="text-gray-300">This component encountered an error and couldn't render.</p>
    {error && (
      <details className="mt-2 text-xs text-gray-400">
        <summary>Technical details</summary>
        <pre>{error.message}</pre>
      </details>
    )}
  </div>
);

// Higher-order component for performance optimization
export function withPerformanceOptimization<P extends object>(
  Component: ComponentType<P>,
  options: {
    displayName?: string;
    shouldUpdate?: (prevProps: P, nextProps: P) => boolean;
    errorFallback?: ComponentType<{ error?: Error }>;
  } = {}
): ComponentType<P> {
  const OptimizedComponent = memo(Component, options.shouldUpdate);
  
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={options.errorFallback || DefaultErrorFallback}>
      <OptimizedComponent {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = options.displayName || `Optimized(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Lazy loading factory with error boundary
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    fallback?: ReactElement;
    errorFallback?: ComponentType<{ error?: Error }>;
    displayName?: string;
  } = {}
): ComponentType<P> {
  const LazyComponent = lazy(importFn);
  
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={options.errorFallback || DefaultErrorFallback}>
      <Suspense fallback={options.fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = options.displayName || 'LazyComponent';
  
  return WrappedComponent;
}

// Memoized callback factory
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Stable reference hook for objects
export function useStableReference<T>(value: T, comparer?: (prev: T, next: T) => boolean): T {
  const ref = useRef<T>(value);
  
  const areEqual = comparer 
    ? comparer(ref.current, value)
    : JSON.stringify(ref.current) === JSON.stringify(value);
    
  if (!areEqual) {
    ref.current = value;
  }
  
  return ref.current;
}

// Debounced value hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Optimized list renderer
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactElement;
  keyExtractor: (item: T, index: number) => string;
  height?: number;
  itemHeight?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  keyExtractor,
  height = 400,
  itemHeight = 50,
  overscan = 5,
  className = ""
}: VirtualizedListProps<T>): ReactElement {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItemCount = Math.ceil(height / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleItemCount + overscan * 2);

  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      index: startIndex + i,
      key: keyExtractor(item, startIndex + i)
    }))
  , [items, startIndex, endIndex, keyExtractor]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Component registry for dynamic component loading
class ComponentRegistry {
  private components = new Map<string, ComponentType<any>>();
  private lazyComponents = new Map<string, () => Promise<{ default: ComponentType<any> }>>();

  register<P>(name: string, component: ComponentType<P>): void {
    this.components.set(name, component);
  }

  registerLazy<P>(name: string, importFn: () => Promise<{ default: ComponentType<P> }>): void {
    this.lazyComponents.set(name, importFn);
  }

  get<P>(name: string): ComponentType<P> | null {
    return this.components.get(name) || null;
  }

  getLazy<P>(name: string): ComponentType<P> | null {
    const importFn = this.lazyComponents.get(name);
    if (!importFn) return null;

    return createLazyComponent(importFn, { displayName: name });
  }

  has(name: string): boolean {
    return this.components.has(name) || this.lazyComponents.has(name);
  }

  remove(name: string): void {
    this.components.delete(name);
    this.lazyComponents.delete(name);
  }

  clear(): void {
    this.components.clear();
    this.lazyComponents.clear();
  }

  list(): string[] {
    return [...this.components.keys(), ...this.lazyComponents.keys()];
  }
}

// Global component registry
export const componentRegistry = new ComponentRegistry();

// Factory function for creating optimized form components
export function createOptimizedForm<T extends Record<string, any>>(
  initialValues: T,
  validator?: (values: T) => Record<keyof T, string[]>
) {
  return function OptimizedForm({
    onSubmit,
    children,
    className = ""
  }: {
    onSubmit: (values: T) => void | Promise<void>;
    children: (props: {
      values: T;
      errors: Record<keyof T, string[]>;
      setValue: <K extends keyof T>(key: K, value: T[K]) => void;
      setValues: (values: Partial<T>) => void;
      isValid: boolean;
      isSubmitting: boolean;
      handleSubmit: (e: React.FormEvent) => void;
    }) => ReactElement;
    className?: string;
  }) {
    const [values, setValues] = React.useState<T>(initialValues);
    const [errors, setErrors] = React.useState<Record<keyof T, string[]>>({} as any);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
      setValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateValues = useCallback((updates: Partial<T>) => {
      setValues(prev => ({ ...prev, ...updates }));
    }, []);

    const isValid = useMemo(() => {
      if (!validator) return true;
      
      const currentErrors = validator(values);
      setErrors(currentErrors as Record<keyof T, string[]>);
      return Object.values(currentErrors).every((errorList: unknown) => 
        Array.isArray(errorList) && errorList.length === 0
      );
    }, [values, validator]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }, [values, isValid, isSubmitting, onSubmit]);

    return (
      <form onSubmit={handleSubmit} className={className}>
        {children({
          values,
          errors,
          setValue,
          setValues: updateValues,
          isValid,
          isSubmitting,
          handleSubmit
        })}
      </form>
    );
  };
}

export default {
  withPerformanceOptimization,
  createLazyComponent,
  LoadingSpinner,
  ErrorBoundary,
  DefaultErrorFallback,
  useMemoizedCallback,
  useStableReference,
  useDebouncedValue,
  VirtualizedList,
  componentRegistry,
  createOptimizedForm
};
