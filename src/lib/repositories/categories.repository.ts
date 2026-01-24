import { BaseSQLiteRepository } from './sqlite.repository';
import { RepositoryError, NotFoundError, BaseEntity } from './base.repository';
import { categories } from '../database/schema';
import { eq, and, like, or, desc, asc } from 'drizzle-orm';

// Category type definition
export interface Category extends BaseEntity {
  name: string;
  color: string;
}

// Search filters for categories
export interface CategorySearchFilters {
  query?: string;
}

export class CategoriesRepository extends BaseSQLiteRepository<Category> {
  constructor() {
    super('categories', categories);
  }

  // Custom search method for categories
  async search(filters: CategorySearchFilters, options: { limit?: number; offset?: number } = {}): Promise<Category[]> {
    try {
      const conditions = this.buildSearchConditions(filters);
      
      let query = this.db
        .select()
        .from(this.table)
        .where(conditions) as any;

      // Default ordering by name
      query = query.orderBy(asc(this.table.name));

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      return await query as Category[];
    } catch (error) {
      throw new RepositoryError(`Failed to search categories`, 'SEARCH_ERROR', error);
    }
  }

  // Find by name
  async findByName(name: string): Promise<Category | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.name, name))
        .limit(1);

      return (result as Category[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find category by name: ${name}`, 'FIND_BY_NAME_ERROR', error);
    }
  }

  // Build search conditions
  private buildSearchConditions(filters: CategorySearchFilters): any {
    const conditions = [];

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(like(this.table.name, searchTerm));
    }

    return conditions.length > 0 ? and(...conditions) : eq(this.table.id, this.table.id);
  }
}

// Export factory function instead of singleton instance
let categoriesRepositoryInstance: CategoriesRepository | null = null;

export function getCategoriesRepository(): CategoriesRepository {
  if (!categoriesRepositoryInstance) {
    categoriesRepositoryInstance = new CategoriesRepository();
  }
  return categoriesRepositoryInstance;
}