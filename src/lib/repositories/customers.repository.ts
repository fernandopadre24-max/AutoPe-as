import { BaseSQLiteRepository } from './sqlite.repository';
import { RepositoryError, NotFoundError, BaseEntity } from './base.repository';
import { customers } from '../database/schema';
import { eq, and, like, or, desc, asc } from 'drizzle-orm';

// Customer type definition
export interface Customer extends BaseEntity {
  firstName: string;
  lastName: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: string; // YYYY-MM-DD format
  sex?: 'Masculino' | 'Feminino' | 'Outro';
  isActive: boolean;
  updatedAt?: Date;
}

// Search filters for customers
export interface CustomerSearchFilters {
  query?: string;
  document?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export class CustomersRepository extends BaseSQLiteRepository<Customer> {
  constructor() {
    super('customers', customers);
  }

  // Custom search method for customers
  async search(filters: CustomerSearchFilters, options: { limit?: number; offset?: number } = {}): Promise<Customer[]> {
    try {
      const conditions = this.buildSearchConditions(filters);
      
      let query = this.db
        .select()
        .from(this.table)
        .where(conditions) as any;

      // Default ordering by firstName then lastName
      query = query.orderBy(asc(this.table.firstName), asc(this.table.lastName));

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      return await query as Customer[];
    } catch (error) {
      throw new RepositoryError(`Failed to search customers`, 'SEARCH_ERROR', error);
    }
  }

  // Find by document (CPF)
  async findByDocument(cpf: string): Promise<Customer | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.cpf, cpf))
        .limit(1);

      return (result as Customer[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find customer by document: ${cpf}`, 'FIND_BY_DOCUMENT_ERROR', error);
    }
  }

  // Find by phone
  async findByPhone(phone: string): Promise<Customer | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.phone, phone))
        .limit(1);

      return (result as Customer[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find customer by phone: ${phone}`, 'FIND_BY_PHONE_ERROR', error);
    }
  }

  // Find by email
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.email, email))
        .limit(1);

      return (result as Customer[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find customer by email: ${email}`, 'FIND_BY_EMAIL_ERROR', error);
    }
  }

  // Activate customer
  async activate(id: string): Promise<Customer> {
    try {
      const result = await this.db
        .update(this.table)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(this.table.id, id))
        .returning();

      if (!result) {
        throw new NotFoundError('Customer', id);
      }

      return (result as Customer[])[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Failed to activate customer: ${id}`, 'ACTIVATE_ERROR', error);
    }
  }

  // Build search conditions
  private buildSearchConditions(filters: CustomerSearchFilters): any {
    const conditions = [];

    // Only active customers by default
    if (filters.isActive !== false) {
      conditions.push(eq(this.table.isActive, true));
    }

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(or(
        like(this.table.firstName, searchTerm),
        like(this.table.lastName, searchTerm),
        like(this.table.email, searchTerm),
        like(this.table.address, searchTerm)
      ));
    }

    if (filters.document) {
      conditions.push(eq(this.table.cpf, filters.document));
    }

    if (filters.phone) {
      conditions.push(eq(this.table.phone, filters.phone));
    }

    if (filters.email) {
      conditions.push(eq(this.table.email, filters.email));
    }

    return conditions.length > 0 ? and(...conditions) : eq(this.table.id, this.table.id);
  }
}

// Export lazy instance
let customersRepositoryInstance: CustomersRepository | null = null;
export const getCustomersRepository = (): CustomersRepository => {
  if (!customersRepositoryInstance) {
    customersRepositoryInstance = new CustomersRepository();
  }
  return customersRepositoryInstance;
};

// Export instance for convenience
export const customersRepository = getCustomersRepository();