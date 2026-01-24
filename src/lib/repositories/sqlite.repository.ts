import { IBaseRepository, QueryOptions, RepositoryError, NotFoundError, BaseEntity } from './base.repository';
import { eq, and, like, desc, asc, count, SQL } from 'drizzle-orm';
import { getDatabase } from '../database/sqlite';

// Generic SQLite repository implementation
export abstract class BaseSQLiteRepository<T extends BaseEntity> implements IBaseRepository<T> {
  protected tableName: string;
  protected table: any;

  constructor(tableName: string, table: any) {
    this.tableName = tableName;
    this.table = table;
  }

  protected get db() {
    return getDatabase();
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    try {
      const now = new Date();
      const createData = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
      } as T;

      const result = await this.db.insert(this.table).values(createData).returning();
      return (result as T[])[0];
    } catch (error) {
      throw new RepositoryError(`Failed to create ${this.tableName}`, 'CREATE_ERROR', error);
    }
  }

  async createMany(dataArray: Omit<T, keyof BaseEntity>[]): Promise<T[]> {
    try {
      const now = new Date();
      const createData = dataArray.map(data => ({
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
      })) as any[];

      const result = await this.db.insert(this.table).values(createData).returning();
      return result as T[];
    } catch (error) {
      throw new RepositoryError(`Failed to create multiple ${this.tableName}`, 'CREATE_MANY_ERROR', error);
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);
      
      return (result as T[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find ${this.tableName} by id: ${id}`, 'FIND_ERROR', error);
    }
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const result = await this.db
        .select()
        .from(this.table)
        .where(conditions)
        .limit(1);
      
      return (result as T[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find one ${this.tableName}`, 'FIND_ONE_ERROR', error);
    }
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    try {
      let query = this.db.select().from(this.table) as any;

      // Apply ordering
      if (options.orderBy) {
        const orderKeys = Object.keys(options.orderBy);
        if (orderKeys.length > 0) {
          const firstKey = orderKeys[0];
          const order = options.orderBy[firstKey];
          query = query.orderBy(order === 'desc' ? desc(this.table[firstKey]) : asc(this.table[firstKey]));
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      return await query as T[];
    } catch (error) {
      throw new RepositoryError(`Failed to find all ${this.tableName}`, 'FIND_ALL_ERROR', error);
    }
  }

  async findMany(filter: Partial<T>, options: QueryOptions = {}): Promise<T[]> {
    try {
      const conditions = this.buildFilterConditions(filter);
      let query = this.db
        .select()
        .from(this.table)
        .where(conditions) as any;

      // Apply ordering
      if (options.orderBy) {
        const orderKeys = Object.keys(options.orderBy);
        if (orderKeys.length > 0) {
          const firstKey = orderKeys[0];
          const order = options.orderBy[firstKey];
          query = query.orderBy(order === 'desc' ? desc(this.table[firstKey]) : asc(this.table[firstKey]));
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      return await query as T[];
    } catch (error) {
      throw new RepositoryError(`Failed to find many ${this.tableName}`, 'FIND_MANY_ERROR', error);
    }
  }

  async update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      } as any;

      const result = await this.db
        .update(this.table)
        .set(updateData)
        .where(eq(this.table.id, id))
        .returning();

      if (!result) {
        throw new NotFoundError(this.tableName, id);
      }

      return (result as T[])[0] || null;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Failed to update ${this.tableName} with id: ${id}`, 'UPDATE_ERROR', error);
    }
  }

  async updateMany(filter: Partial<T>, data: Partial<Omit<T, keyof BaseEntity>>): Promise<number> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const updateData = {
        ...data,
        updatedAt: new Date(),
      } as any;

      const result = await this.db
        .update(this.table)
        .set(updateData)
        .where(conditions);

      return Number(result.changes || 0);
    } catch (error) {
      throw new RepositoryError(`Failed to update many ${this.tableName}`, 'UPDATE_MANY_ERROR', error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(this.table)
        .where(eq(this.table.id, id));

      return Number(result.changes || 0) > 0;
    } catch (error) {
      throw new RepositoryError(`Failed to delete ${this.tableName} with id: ${id}`, 'DELETE_ERROR', error);
    }
  }

  async deleteMany(filter: Partial<T>): Promise<number> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const result = await this.db.delete(this.table).where(conditions);
      return Number(result.changes || 0);
    } catch (error) {
      throw new RepositoryError(`Failed to delete many ${this.tableName}`, 'DELETE_MANY_ERROR', error);
    }
  }

  async count(filter?: Partial<T>): Promise<number> {
    try {
      let query = this.db.select({ count: count() }).from(this.table) as any;
      
      if (filter) {
        const conditions = this.buildFilterConditions(filter);
        query = query.where(conditions);
      }

      const result = await query;
      return Number(result[0]?.count || 0);
    } catch (error) {
      throw new RepositoryError(`Failed to count ${this.tableName}`, 'COUNT_ERROR', error);
    }
  }

  async exists(filter: Partial<T>): Promise<boolean> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const result = await this.db
        .select({ exists: count() })
        .from(this.table)
        .where(conditions)
        .limit(1);

      return Number(result[0]?.exists || 0) > 0;
    } catch (error) {
      throw new RepositoryError(`Failed to check if ${this.tableName} exists`, 'EXISTS_ERROR', error);
    }
  }

  // Helper method to build filter conditions
  protected buildFilterConditions(filter: Partial<T>): SQL {
    const conditions: SQL[] = [];
    
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && this.table[key]) {
        if (typeof value === 'string' && key.includes('name')) {
          // Use LIKE for name fields
          conditions.push(like(this.table[key], `%${value}%`));
        } else {
          // Use exact match for other fields
          conditions.push(eq(this.table[key], value));
        }
      }
    }

    return conditions.length > 0 ? and(...conditions)! : eq(this.table.id, this.table.id); // Return all if no filter
  }
}