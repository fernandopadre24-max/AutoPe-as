import { BaseSQLiteRepository } from './sqlite.repository';
import { RepositoryError, NotFoundError, BaseEntity } from './base.repository';
import { sales, saleItems, products, customers } from '../database/schema';
import { getDatabase } from '../database/sqlite';
import { eq, and, like, desc, asc, sum, sql, SQL, SQLWrapper, gte, lte, count } from 'drizzle-orm';

// Sale type definition
export interface Sale extends BaseEntity {
  customerId?: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  paymentMethod: 'Dinheiro' | 'Cartão' | 'PIX' | 'Transferência' | 'Fiado';
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  observations?: string;
  updatedAt?: Date;
}

// Sale item type definition
export interface SaleItem extends BaseEntity {
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
}

// Product info for sale items
interface ProductInfo {
  id: string;
  name: string;
  sku: string;
  salePrice: number;
}

// Customer info for sales
interface CustomerInfo {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
}

// Sale with items
export interface SaleWithItems extends Sale {
  items: (SaleItem & { product?: ProductInfo })[];
  customer?: CustomerInfo;
}

// Search filters for sales
export interface SaleSearchFilters {
  customerId?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
}

export class SalesRepository extends BaseSQLiteRepository<Sale> {
  constructor() {
    super('sales', sales);
  }

  // Create sale with items
  async createSaleWithItems(saleData: Omit<Sale, keyof BaseEntity>, itemsData: Omit<SaleItem, keyof BaseEntity | 'saleId'>[]): Promise<SaleWithItems> {
    const db = getDatabase();
    
    try {
      return await db.transaction(async (tx) => {
        // Create sale
        const saleId = crypto.randomUUID();
        const now = new Date();
        
        const sale = await tx.insert(sales).values({
          ...saleData,
          id: saleId,
          createdAt: now,
          updatedAt: now,
        }).returning();

        // Create sale items
        const items = await Promise.all(
          itemsData.map(item => 
            tx.insert(saleItems).values({
              ...item,
              id: crypto.randomUUID(),
              saleId,
              createdAt: now,
            }).returning()
          )
        );

        // Update product stock
        for (const item of itemsData) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
              updatedAt: now,
            })
            .where(eq(products.id, item.productId));
        }

        return {
          ...sale[0],
          items: items.map(item => item[0]),
        } as SaleWithItems;
      });
    } catch (error) {
      throw new RepositoryError(`Failed to create sale with items`, 'CREATE_SALE_ITEMS_ERROR', error);
    }
  }

  // Custom search method for sales
  async search(filters: SaleSearchFilters, options: { limit?: number; offset?: number } = {}): Promise<SaleWithItems[]> {
    try {
      const conditions = this.buildSearchConditions(filters);
      
      let query = this.db
        .select()
        .from(this.table)
        .where(conditions) as any;

      // Default ordering by date descending
      query = query.orderBy(desc(this.table.createdAt));

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const sales = await query;

      // Load items and customer for each sale
      const salesWithItems = await Promise.all(
        sales.map(async (sale: any) => {
          const items = await this.db
            .select()
            .from(saleItems)
            .where(eq(saleItems.saleId, sale.id));

          const customer = sale.customerId ? await this.db
            .select()
            .from(customers)
            .where(eq(customers.id, sale.customerId))
            .limit(1) : null;

          return {
            ...sale,
            items,
            customer: customer?.[0],
          };
        })
      );

      return salesWithItems as SaleWithItems[];
    } catch (error) {
      throw new RepositoryError(`Failed to search sales`, 'SEARCH_ERROR', error);
    }
  }

  // Find sale with items
  async findWithItems(id: string): Promise<SaleWithItems | null> {
    try {
      const sale = await this.findById(id);
      if (!sale) return null;

      const items = await this.db
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, id));

      const customer = sale.customerId ? await this.db
        .select()
        .from(customers)
        .where(eq(customers.id, sale.customerId))
        .limit(1) : null;

      return {
        ...sale,
        items,
        customer: customer?.[0],
      } as SaleWithItems;
    } catch (error) {
      throw new RepositoryError(`Failed to find sale with items: ${id}`, 'FIND_WITH_ITEMS_ERROR', error);
    }
  }

  // Cancel sale (restore stock)
  async cancelSale(id: string, reason?: string): Promise<Sale> {
    const db = getDatabase();
    
    try {
      return await db.transaction(async (tx) => {
        // Get sale items to restore stock
        const items = await tx
          .select()
          .from(saleItems)
          .where(eq(saleItems.saleId, id));

        // Restore product stock
        for (const item of items) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }

        // Update sale status
        const result = await tx
          .update(sales)
          .set({
            status: 'Cancelado',
            observations: reason ? `Cancelado: ${reason}` : 'Cancelado',
            updatedAt: new Date(),
          })
          .where(eq(sales.id, id))
          .returning();

        if (!result[0]) {
          throw new NotFoundError('Sale', id);
        }

        return result[0] as Sale;
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Failed to cancel sale: ${id}`, 'CANCEL_ERROR', error);
    }
  }

  // Get sales by status
  async findByStatus(status: string, options: { limit?: number; offset?: number } = {}): Promise<SaleWithItems[]> {
    try {
      let query = this.db
        .select()
        .from(this.table)
        .where(eq(this.table.status, status)) as any;

      query = query.orderBy(desc(this.table.createdAt));

      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const sales = await query;

      // Load items for each sale
      const salesWithItems = await Promise.all(
        sales.map(async (sale: any) => {
          const items = await this.db
            .select()
            .from(saleItems)
            .where(eq(saleItems.saleId, sale.id));

          return {
            ...sale,
            items,
          };
        })
      );

      return salesWithItems as SaleWithItems[];
    } catch (error) {
      throw new RepositoryError(`Failed to find sales by status: ${status}`, 'FIND_BY_STATUS_ERROR', error);
    }
  }

  // Get sales by customer
  async findByCustomer(customerId: string, options: { limit?: number; offset?: number } = {}): Promise<SaleWithItems[]> {
    try {
      let query = this.db
        .select()
        .from(this.table)
        .where(eq(this.table.customerId, customerId)) as any;

      query = query.orderBy(desc(this.table.createdAt));

      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const sales = await query;

      // Load items for each sale
      const salesWithItems = await Promise.all(
        sales.map(async (sale: any) => {
          const items = await this.db
            .select()
            .from(saleItems)
            .where(eq(saleItems.saleId, sale.id));

          return {
            ...sale,
            items,
          };
        })
      );

      return salesWithItems as SaleWithItems[];
    } catch (error) {
      throw new RepositoryError(`Failed to find sales by customer: ${customerId}`, 'FIND_BY_CUSTOMER_ERROR', error);
    }
  }

  // Get sales summary (total sales by date)
  async getSalesSummary(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const conditions: SQLWrapper[] = [];

      if (startDate) {
        conditions.push(gte(this.table.createdAt, startDate));
      }

      if (endDate) {
        conditions.push(lte(this.table.createdAt, endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : sql`1 = 1`;

      const result = await this.db
        .select({
          totalSales: sum(this.table.total),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(this.table)
        .where(whereClause);

      return result[0] || { totalSales: 0, count: 0 };
    } catch (error) {
      throw new RepositoryError(`Failed to get sales summary`, 'SUMMARY_ERROR', error);
    }
  }

  // Build search conditions
  private buildSearchConditions(filters: SaleSearchFilters): any {
    const conditions = [];

    if (filters.customerId) {
      conditions.push(eq(this.table.customerId, filters.customerId));
    }

    if (filters.status) {
      conditions.push(eq(this.table.status, filters.status));
    }

    if (filters.paymentMethod) {
      conditions.push(eq(this.table.paymentMethod, filters.paymentMethod));
    }

    if (filters.startDate) {
      conditions.push(gte(this.table.createdAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(this.table.createdAt, filters.endDate));
    }

    if (filters.minTotal) {
      conditions.push(gte(this.table.total, filters.minTotal));
    }

    if (filters.maxTotal) {
      conditions.push(lte(this.table.total, filters.maxTotal));
    }

    return conditions.length > 0 ? and(...conditions) : eq(this.table.id, this.table.id);
  }
}

// Export singleton instance
// Export lazy instance
let salesRepositoryInstance: SalesRepository | null = null;
export const getSalesRepository = (): SalesRepository => {
  if (!salesRepositoryInstance) {
    salesRepositoryInstance = new SalesRepository();
  }
  return salesRepositoryInstance;
};

// Export instance for convenience
export const salesRepository = getSalesRepository();