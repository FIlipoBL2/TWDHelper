/**
 * Architecture Improvements and Race Condition Fixes
 * This file contains the key improvements identified from the codebase analysis
 */

import React, { useCallback, useRef, useEffect, useMemo } from 'react';

// 1. RACE CONDITION FIX - Safe Timeout Hook
export function useSafeTimeout() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      timeoutsRef.current.delete(timeout);
      callback();
    }, delay);
    timeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  const clearSafeTimeout = useCallback((timeout: NodeJS.Timeout) => {
    clearTimeout(timeout);
    timeoutsRef.current.delete(timeout);
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return { setSafeTimeout, clearSafeTimeout };
}

// 2. RACE CONDITION FIX - Safe Async Operations
export function useSafeAsync() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeAsync = useCallback(async function<T>(
    asyncFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> {
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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return executeAsync;
}

// 3. PERFORMANCE FIX - Debounced Search Hook
export function useDebounce<T>(value: T, delay: number): T {
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

// 4. PERFORMANCE FIX - Memoized Selectors
export function createMemoizedSelector<TInput, TOutput>(
  selector: (input: TInput) => TOutput,
  equalityFn?: (a: TInput, b: TInput) => boolean
): (input: TInput) => TOutput {
  let lastInput: TInput;
  let lastOutput: TOutput;
  let hasResult = false;

  return (input: TInput): TOutput => {
    if (!hasResult || 
        (equalityFn ? !equalityFn(lastInput, input) : lastInput !== input)) {
      lastInput = input;
      lastOutput = selector(input);
      hasResult = true;
    }
    return lastOutput;
  };
}

// 5. MEMORY LEAK FIX - Enhanced useEffect with Cleanup
export function useAsyncEffect(
  effect: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList
) {
  useEffect(() => {
    const abortController = new AbortController();
    
    effect(abortController.signal).catch(error => {
      if (!abortController.signal.aborted) {
        console.error('Async effect error:', error);
      }
    });

    return () => {
      abortController.abort();
    };
  }, deps);
}

// 6. ARCHITECTURE FIX - Component Wrapper for Error Boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  class ErrorBoundaryWrapper extends React.Component<P, { hasError: boolean }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Component error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <h3 className="text-red-400 font-bold">Component Error</h3>
            <p className="text-gray-300">This component encountered an error.</p>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  }

  const WrappedComponent = ErrorBoundaryWrapper as any;
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// 7. PERFORMANCE FIX - Optimized Event Handlers
export function useOptimizedEventHandlers() {
  const handlersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());

  const createHandler = useCallback(function<T extends any[]>(
    key: string,
    handler: (...args: T) => void,
    deps: React.DependencyList
  ) {
    return useMemo(() => {
      const optimizedHandler = (...args: T) => handler(...args);
      handlersRef.current.set(key, optimizedHandler);
      return optimizedHandler;
    }, deps);
  }, []);

  const getHandler = useCallback((key: string) => {
    return handlersRef.current.get(key);
  }, []);

  return { createHandler, getHandler };
}

// 8. ARCHITECTURE FIX - Service Pattern Implementation
export abstract class BaseService {
  protected isInitialized = false;
  
  abstract initialize(): Promise<void> | void;
  
  abstract cleanup(): void;
  
  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} must be initialized before use`);
    }
  }
}

// 9. PERFORMANCE FIX - Virtual List for Large Data Sets
interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactElement;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div
      style={{ height, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// 10. ARCHITECTURE FIX - Type-Safe Event Emitter
interface EventMap {
  [key: string]: any;
}

export class TypedEventEmitter<TEvents extends EventMap> {
  private listeners = new Map<keyof TEvents, Set<(data: any) => void>>();

  on<K extends keyof TEvents>(event: K, listener: (data: TEvents[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    this.listeners.get(event)?.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });
  }

  off<K extends keyof TEvents>(event: K, listener?: (data: TEvents[K]) => void): void {
    if (listener) {
      this.listeners.get(event)?.delete(listener);
    } else {
      this.listeners.delete(event);
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// 11. PERFORMANCE FIX - Caching Service
export class CacheService<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; ttl?: number }>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  set(key: K, value: V, ttlMs?: number): void {
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: K): V | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (cached.ttl && Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  has(key: K): boolean {
    return this.get(key) !== null;
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 12. SOLID PRINCIPLE FIX - Repository Pattern
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export abstract class BaseRepository<T extends { id: string }> implements Repository<T> {
  protected entities = new Map<string, T>();

  async findById(id: string): Promise<T | null> {
    return this.entities.get(id) || null;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.entities.values());
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    const newEntity = { ...entity, id: this.generateId() } as T;
    this.entities.set(newEntity.id, newEntity);
    return newEntity;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const existing = this.entities.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.entities.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.entities.delete(id);
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default {
  useSafeTimeout,
  useSafeAsync,
  useDebounce,
  createMemoizedSelector,
  useAsyncEffect,
  withErrorBoundary,
  useOptimizedEventHandlers,
  BaseService,
  VirtualList,
  TypedEventEmitter,
  CacheService,
  BaseRepository
};
