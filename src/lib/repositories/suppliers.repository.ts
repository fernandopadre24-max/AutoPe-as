import { BaseSQLiteRepository } from './sqlite.repository';
import { RepositoryError, NotFoundError, BaseEntity } from './base.repository';
import { suppliers } from '../database/schema';
import { eq, and, like, or, desc, asc } from 'drizzle-orm';

// Supplier type definition
export interface Supplier extends BaseEntity {
  name: string;
  document?: string;
  phone?: string;
  email: string;
  address?: string;
}

// Search filters for suppliers
export interface SupplierSearchFilters {
  query?: string;
  document?: string;
}

export class SuppliersRepository extends BaseSQLiteRepository<Supplier> {
  constructor() {
    super('suppliers', suppliers);
  }

  // Custom search method for suppliers
  async search(filters: SupplierSearchFilters, options: { limit?: number; offset?: number } = {}): Promise<Supplier[]> {
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

      return await query as Supplier[];
    } catch (error) {
      throw new RepositoryError(`Failed to search suppliers`, 'SEARCH_ERROR', error);
    }
  }

  // Find by document (CNPJ)
  async findByDocument(document: string): Promise<Supplier | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.document, document))
        .limit(1);

      return (result as Supplier[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find supplier by document: ${document}`, 'FIND_BY_DOCUMENT_ERROR', error);
    }
  }

  // Find by name
  async findByName(name: string): Promise<Supplier | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.name, name))
        .limit(1);

      return (result as Supplier[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find supplier by name: ${name}`, 'FIND_BY_NAME_ERROR', error);
    }
  }

  // Build search conditions
  private buildSearchConditions(filters: SupplierSearchFilters): any {
    const conditions = [];

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(or(
        like(this.table.name, searchTerm),
        like(this.table.email, searchTerm),
        like(this.table.address, searchTerm)
      ));
    }

    if (filters.document) {
      conditions.push(eq(this.table.document, filters.document));
    }

    return conditions.length > 0 ? and(...conditions) : eq(this.table.id, this.table.id);
  }
}

// Export lazy instance
let suppliersRepositoryInstance: SuppliersRepository | null = null;
export const getSuppliersRepository = (): SuppliersRepository => {
  if (!suppliersRepositoryInstance) {
    suppliersRepositoryInstance = new SuppliersRepository();
  }
  return suppliersRepositoryInstance;
};

// Export instance for convenience
export const suppliersRepository = getSuppliersRepository();