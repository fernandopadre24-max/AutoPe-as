// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Generic repository interface
export interface IBaseRepository<T extends BaseEntity> {
  // Basic CRUD operations
  create(data: Omit<T, keyof BaseEntity>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;
  delete(id: string): Promise<boolean>;
  
  // Search operations
  findOne(filter: Partial<T>): Promise<T | null>;
  findMany(filter: Partial<T>, options?: QueryOptions): Promise<T[]>;
  
  // Count operations
  count(filter?: Partial<T>): Promise<number>;
  exists(filter: Partial<T>): Promise<boolean>;
  
  // Bulk operations
  createMany(data: Omit<T, keyof BaseEntity>[]): Promise<T[]>;
  updateMany(filter: Partial<T>, data: Partial<Omit<T, keyof BaseEntity>>): Promise<number>;
  deleteMany(filter: Partial<T>): Promise<number>;
}

// Query options interface
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, any>;
}

// Database port interface (for dependency injection)
export interface IDatabasePort {
  // Transaction support
  transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T>;

  // Raw query execution
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  queryOne(sql: string, params?: unknown[]): Promise<unknown>;

  // Prepared statements
  prepare(sql: string): unknown;

  // Health check
  healthCheck(): Promise<boolean>;

  // Backup and restore
  backup(path: string): Promise<void>;
  restore(path: string): Promise<void>;
}

// Error types
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class DatabaseConnectionError extends RepositoryError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_CONNECTION_ERROR', details);
    this.name = 'DatabaseConnectionError';
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends RepositoryError {
  constructor(entity: string, id?: string) {
    const message = id ? `${entity} with id ${id} not found` : `${entity} not found`;
    super(message, 'NOT_FOUND', { entity, id });
    this.name = 'NotFoundError';
  }
}