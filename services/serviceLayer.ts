/**
 * Service Layer - Implements Repository pattern and Service abstraction
 * Following SOLID principles for better architecture and maintainability
 */

// Base Repository Interface (Interface Segregation Principle)
export interface Repository<T, K> {
  getById(id: K): T | null;
  getAll(): T[];
  add(item: T): void;
  update(id: K, updates: Partial<T>): void;
  remove(id: K): void;
}

// Base Service Interface
export interface Service {
  initialize(): void;
  cleanup(): void;
}

// Query Interface for complex searches
export interface Query<T> {
  execute(items: T[]): T[];
}

// Abstract Repository Implementation
export abstract class BaseRepository<T extends { id: string }, K = string> implements Repository<T, K> {
  protected items: Map<K, T> = new Map();

  getById(id: K): T | null {
    return this.items.get(id) || null;
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  add(item: T): void {
    this.items.set(item.id as unknown as K, item);
  }

  update(id: K, updates: Partial<T>): void {
    const existing = this.items.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.items.set(id, updated);
    }
  }

  remove(id: K): void {
    this.items.delete(id);
  }

  count(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  // Query pattern implementation
  query(queryFn: (item: T) => boolean): T[] {
    return this.getAll().filter(queryFn);
  }

  // Batch operations for performance
  addMany(items: T[]): void {
    items.forEach(item => this.add(item));
  }

  updateMany(updates: Array<{ id: K; updates: Partial<T> }>): void {
    updates.forEach(({ id, updates: itemUpdates }) => this.update(id, itemUpdates));
  }

  removeMany(ids: K[]): void {
    ids.forEach(id => this.remove(id));
  }
}

// Specific Query Implementations
export class SearchQuery<T> implements Query<T> {
  constructor(
    private searchTerm: string,
    private searchFields: (keyof T)[]
  ) {}

  execute(items: T[]): T[] {
    if (!this.searchTerm.trim()) return items;
    
    const lowerSearchTerm = this.searchTerm.toLowerCase();
    return items.filter(item => 
      this.searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearchTerm);
        }
        if (Array.isArray(value)) {
          return value.some(v => 
            typeof v === 'string' && v.toLowerCase().includes(lowerSearchTerm)
          );
        }
        return false;
      })
    );
  }
}

export class PaginationQuery<T> implements Query<T> {
  constructor(
    private page: number,
    private pageSize: number
  ) {}

  execute(items: T[]): T[] {
    const startIndex = this.page * this.pageSize;
    return items.slice(startIndex, startIndex + this.pageSize);
  }
}

export class SortQuery<T> implements Query<T> {
  constructor(
    private sortField: keyof T,
    private sortDirection: 'asc' | 'desc' = 'asc'
  ) {}

  execute(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

// Filter Query for complex filtering
export class FilterQuery<T> implements Query<T> {
  constructor(
    private filters: Array<(item: T) => boolean>
  ) {}

  execute(items: T[]): T[] {
    return items.filter(item => 
      this.filters.every(filter => filter(item))
    );
  }
}

// Query Builder Pattern
export class QueryBuilder<T> {
  private queries: Query<T>[] = [];

  search(term: string, fields: (keyof T)[]): this {
    this.queries.push(new SearchQuery(term, fields));
    return this;
  }

  paginate(page: number, pageSize: number): this {
    this.queries.push(new PaginationQuery(page, pageSize));
    return this;
  }

  sort(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    this.queries.push(new SortQuery(field, direction));
    return this;
  }

  filter(filterFn: (item: T) => boolean): this {
    this.queries.push(new FilterQuery([filterFn]));
    return this;
  }

  execute(items: T[]): T[] {
    return this.queries.reduce((currentItems, query) => 
      query.execute(currentItems), items
    );
  }

  clone(): QueryBuilder<T> {
    const newBuilder = new QueryBuilder<T>();
    newBuilder.queries = [...this.queries];
    return newBuilder;
  }

  clear(): this {
    this.queries = [];
    return this;
  }
}

// Abstract Service Base Class
export abstract class BaseService implements Service {
  protected isInitialized = false;

  abstract initialize(): void;

  cleanup(): void {
    this.isInitialized = false;
  }

  protected checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} must be initialized before use`);
    }
  }
}

// Event System for Service Communication (Observer Pattern)
export interface ServiceEvent {
  type: string;
  payload?: unknown;
  timestamp: number;
}

export class EventBus {
  private listeners: Map<string, Set<(event: ServiceEvent) => void>> = new Map();

  subscribe(eventType: string, callback: (event: ServiceEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  emit(eventType: string, payload?: unknown): void {
    const event: ServiceEvent = {
      type: eventType,
      payload,
      timestamp: Date.now()
    };

    this.listeners.get(eventType)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Singleton Event Bus Instance
export const globalEventBus = new EventBus();

// Dependency Injection Container (Simple Implementation)
export class ServiceContainer {
  private services = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();

  register<T>(name: string, service: T): void;
  register<T>(name: string, factory: () => T): void;
  register<T>(name: string, serviceOrFactory: T | (() => T)): void {
    if (typeof serviceOrFactory === 'function') {
      this.factories.set(name, serviceOrFactory as () => unknown);
    } else {
      this.services.set(name, serviceOrFactory);
    }
  }

  get<T>(name: string): T {
    // Try to get existing service instance
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Try to create from factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!;
      const service = factory();
      this.services.set(name, service); // Cache the instance
      return service as T;
    }

    throw new Error(`Service '${name}' not found in container`);
  }

  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  remove(name: string): void {
    this.services.delete(name);
    this.factories.delete(name);
  }

  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// Global Service Container Instance
export const serviceContainer = new ServiceContainer();

// Validation Service Interface
export interface Validator<T> {
  validate(item: T): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

// Repository with Validation
export abstract class ValidatedRepository<T extends { id: string }, K = string> extends BaseRepository<T, K> {
  constructor(protected validator?: Validator<T>) {
    super();
  }

  add(item: T): void {
    this.validateItem(item);
    super.add(item);
  }

  update(id: K, updates: Partial<T>): void {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`Item with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    this.validateItem(updated);
    super.update(id, updates);
  }

  private validateItem(item: T): void {
    if (this.validator) {
      const result = this.validator.validate(item);
      if (!result.isValid) {
        throw new ValidationError(result.errors);
      }
    }
  }
}

// Cache Service for Performance
export class CacheService<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; ttl?: number }>();

  set(key: K, value: V, ttlMs?: number): void {
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

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.ttl && now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export default {
  BaseRepository,
  BaseService,
  QueryBuilder,
  SearchQuery,
  PaginationQuery,
  SortQuery,
  FilterQuery,
  EventBus,
  globalEventBus,
  ServiceContainer,
  serviceContainer,
  ValidatedRepository,
  ValidationError,
  CacheService
};
