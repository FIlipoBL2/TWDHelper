/**
 * Performance monitoring and optimization utilities
 * Provides tools for tracking performance, managing memory, and optimizing renders
 */
import React from 'react';

// Performance measurement utility
export class PerformanceMonitor {
  private static markers = new Map<string, number>();
  private static measurements = new Map<string, number[]>();

  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      this.markers.set(name, performance.now());
    }
  }

  static measure(name: string, startMark: string): number {
    if (typeof performance !== 'undefined' && this.markers.has(startMark)) {
      const startTime = this.markers.get(startMark)!;
      const duration = performance.now() - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
      
      return duration;
    }
    return 0;
  }

  static getAverageMeasurement(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  static clearMeasurements(): void {
    this.markers.clear();
    this.measurements.clear();
  }
}

// Component render tracking decorator
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
): React.ComponentType<T> {
  return React.memo((props: T) => {
    React.useEffect(() => {
      PerformanceMonitor.mark(`${componentName}-render-start`);
      return () => {
        PerformanceMonitor.measure(`${componentName}-render`, `${componentName}-render-start`);
      };
    });

    return React.createElement(Component, props);
  });
}

// Memory management utilities
export class MemoryManager {
  private static timers = new Set<NodeJS.Timeout>();
  private static intervals = new Set<NodeJS.Timeout>();
  private static abortControllers = new Set<AbortController>();

  static createTimer(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  static createInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  static createAbortController(): AbortController {
    const controller = new AbortController();
    this.abortControllers.add(controller);
    return controller;
  }

  static clearTimer(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  static clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  static clearAbortController(controller: AbortController): void {
    controller.abort();
    this.abortControllers.delete(controller);
  }

  static cleanup(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.intervals.forEach(interval => clearInterval(interval));
    this.abortControllers.forEach(controller => controller.abort());
    
    this.timers.clear();
    this.intervals.clear();
    this.abortControllers.clear();
  }
}

// React hooks for performance and memory management
export function usePerformanceTracker(componentName: string) {
  React.useEffect(() => {
    PerformanceMonitor.mark(`${componentName}-mount`);
    return () => {
      PerformanceMonitor.measure(`${componentName}-lifetime`, `${componentName}-mount`);
    };
  }, [componentName]);
}

export function useSafeTimeout() {
  const timeoutsRef = React.useRef<Set<NodeJS.Timeout>>(new Set());

  const setSafeTimeout = React.useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      timeoutsRef.current.delete(timeout);
      callback();
    }, delay);
    timeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  const clearSafeTimeout = React.useCallback((timeout: NodeJS.Timeout) => {
    clearTimeout(timeout);
    timeoutsRef.current.delete(timeout);
  }, []);

  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return { setSafeTimeout, clearSafeTimeout };
}

export function useSafeAsync<T>() {
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const executeAsync = React.useCallback(async (
    asyncFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const result = await asyncFn(signal);
      if (!signal.aborted) {
        return result;
      }
    } catch (error) {
      if (!signal.aborted) {
        throw error;
      }
    }
    return null;
  }, []);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return executeAsync;
}

// Debouncing utility for expensive operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoization helpers for expensive calculations
export function createMemoizedSelector<TInput, TOutput>(
  selector: (input: TInput) => TOutput,
  dependencies: (input: TInput) => unknown[] = () => []
): (input: TInput) => TOutput {
  const cache = new Map<string, TOutput>();

  return (input: TInput): TOutput => {
    const key = JSON.stringify(dependencies(input));
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = selector(input);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
}

// Component optimization helpers
export const withMemoization = <T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic for better performance
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  });
};

// Error boundary helper function (React class components need to be in JSX files)
export function createErrorBoundary(fallback?: React.ComponentType): React.ComponentType<{ children: React.ReactNode }> {
  class PerformanceErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Performance component error:', error, errorInfo);
      PerformanceMonitor.mark('error-occurred');
    }

    render() {
      if (this.state.hasError) {
        const FallbackComponent = fallback;
        if (FallbackComponent) {
          return React.createElement(FallbackComponent);
        }
        return React.createElement('div', {
          className: 'p-4 bg-red-900/20 border border-red-500 rounded-lg'
        }, [
          React.createElement('h3', {
            key: 'title',
            className: 'text-red-400 font-bold'
          }, 'Component Error'),
          React.createElement('p', {
            key: 'message',
            className: 'text-gray-300'
          }, 'Something went wrong. Please refresh the page.')
        ]);
      }

      return this.props.children;
    }
  }

  return PerformanceErrorBoundary;
}

export default {
  PerformanceMonitor,
  MemoryManager,
  withPerformanceTracking,
  withMemoization,
  createErrorBoundary,
  usePerformanceTracker,
  useSafeTimeout,
  useSafeAsync,
  useDebounce,
  createMemoizedSelector
};
