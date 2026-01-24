import { BaseSQLiteRepository } from './sqlite.repository';
import { RepositoryError, NotFoundError, BaseEntity } from './base.repository';
import { products, categories, suppliers } from '../database/schema';
import { eq, and, like, or, desc, asc } from 'drizzle-orm';

// Product type definition
export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  brand: string;
  gender: 'Masculino' | 'Feminino' | 'Unissex';
  color: string;
  size: string;
  material?: string;
  supplierId?: string;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  updatedAt?: Date;
}

// Search filters for products
export interface ProductSearchFilters {
  query?: string;
  categoryId?: string;
  supplierId?: string;
  gender?: string;
  brand?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  isActive?: boolean;
  barcode?: string;
}

export class ProductsRepository extends BaseSQLiteRepository<Product> {
  constructor() {
    super('products', products);
  }

  // Custom search method for products
  async search(filters: ProductSearchFilters, options: { limit?: number; offset?: number } = {}): Promise<Product[]> {
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

      return await query as Product[];
    } catch (error) {
      throw new RepositoryError(`Failed to search products`, 'SEARCH_ERROR', error);
    }
  }

  // Find by barcode
  async findByBarcode(barcode: string): Promise<Product | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.barcode, barcode))
        .limit(1);

      return (result as Product[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find product by barcode: ${barcode}`, 'FIND_BY_BARCODE_ERROR', error);
    }
  }

  // Find by SKU
  async findBySku(sku: string): Promise<Product | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.sku, sku))
        .limit(1);

      return (result as Product[])[0] || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find product by SKU: ${sku}`, 'FIND_BY_SKU_ERROR', error);
    }
  }

  // Find products with low stock
  async findLowStock(): Promise<Product[]> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(and(
          eq(this.table.isActive, true),
          this.buildLowStockCondition()
        ))
        .orderBy(asc(this.table.name));

      return result as Product[];
    } catch (error) {
      throw new RepositoryError(`Failed to find low stock products`, 'LOW_STOCK_ERROR', error);
    }
  }

  // Update stock
  async updateStock(id: string, newStock: number): Promise<Product> {
    try {
      const result = await this.db
        .update(this.table)
        .set({
          stock: newStock,
          updatedAt: new Date(),
        })
        .where(eq(this.table.id, id))
        .returning();

      if (!result) {
        throw new NotFoundError('Product', id);
      }

      return (result as Product[])[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Failed to update stock for product: ${id}`, 'UPDATE_STOCK_ERROR', error);
    }
  }

  // Get products by category
  async findByCategory(categoryId: string, options: { limit?: number; offset?: number } = {}): Promise<Product[]> {
    try {
      let query = this.db
        .select()
        .from(this.table)
        .where(and(
          eq(this.table.categoryId, categoryId),
          eq(this.table.isActive, true)
        )) as any;

      query = query.orderBy(asc(this.table.name));

      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      return await query as Product[];
    } catch (error) {
      throw new RepositoryError(`Failed to find products by category: ${categoryId}`, 'FIND_BY_CATEGORY_ERROR', error);
    }
  }

  // Get products by supplier
  async findBySupplier(supplierId: string, options: { limit?: number; offset?: number } = {}): Promise<Product[]> {
    try {
      let query = this.db
        .select()
        .from(this.table)
        .where(and(
          eq(this.table.supplierId, supplierId),
          eq(this.table.isActive, true)
        )) as any;

      query = query.orderBy(asc(this.table.name));

      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      return await query as Product[];
    } catch (error) {
      throw new RepositoryError(`Failed to find products by supplier: ${supplierId}`, 'FIND_BY_SUPPLIER_ERROR', error);
    }
  }

  // Build search conditions
  private buildSearchConditions(filters: ProductSearchFilters): any {
    const conditions = [];

    // Only active products by default
    if (filters.isActive !== false) {
      conditions.push(eq(this.table.isActive, true));
    }

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(or(
        like(this.table.name, searchTerm),
        like(this.table.sku, searchTerm),
        like(this.table.description, searchTerm),
        like(this.table.brand, searchTerm),
        like(this.table.barcode, searchTerm)
      ));
    }

    if (filters.categoryId) {
      conditions.push(eq(this.table.categoryId, filters.categoryId));
    }

    if (filters.supplierId) {
      conditions.push(eq(this.table.supplierId, filters.supplierId));
    }

    if (filters.gender) {
      conditions.push(eq(this.table.gender, filters.gender));
    }

    if (filters.brand) {
      conditions.push(eq(this.table.brand, filters.brand));
    }

    if (filters.color) {
      conditions.push(eq(this.table.color, filters.color));
    }

    if (filters.size) {
      conditions.push(eq(this.table.size, filters.size));
    }

    if (filters.minPrice) {
      conditions.push(this.table.salePrice >= filters.minPrice);
    }

    if (filters.maxPrice) {
      conditions.push(this.table.salePrice <= filters.maxPrice);
    }

    if (filters.inStock) {
      conditions.push(this.table.stock > 0);
    }

    if (filters.lowStock) {
      conditions.push(this.buildLowStockCondition());
    }

    if (filters.barcode) {
      conditions.push(eq(this.table.barcode, filters.barcode));
    }

    return conditions.length > 0 ? and(...conditions) : eq(this.table.id, this.table.id);
  }

  // Build low stock condition
  private buildLowStockCondition(): any {
    return this.table.stock <= this.table.minStock;
  }
}

// Export lazy instance
let productsRepositoryInstance: ProductsRepository | null = null;
export const getProductsRepository = (): ProductsRepository => {
  if (!productsRepositoryInstance) {
    productsRepositoryInstance = new ProductsRepository();
  }
  return productsRepositoryInstance;
};

// Export instance for convenience
export const productsRepository = getProductsRepository();


// Re-export other repositories that are commonly imported together
export { customersRepository } from './customers.repository';
export { suppliersRepository } from './suppliers.repository';
export { salesRepository } from './sales.repository';