import { getProductsRepository, ProductsRepository, Product, ProductSearchFilters } from '../repositories/products.repository';
import { getSuppliersRepository, SuppliersRepository } from '../repositories/suppliers.repository';
import { getCategoriesRepository, CategoriesRepository } from '../repositories/categories.repository';
import { RepositoryError, NotFoundError } from '../repositories/base.repository';

export interface CreateProductData {
  name: string;
  sku?: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  brand: string;
  gender: 'Masculino' | 'Feminino' | 'Unissex';
  color: string;
  size: string;
  material?: string;
  categoryId?: string;
  supplierId?: string;
  barcode?: string;
  imageUrl?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  isActive?: boolean;
}

export interface ProductSearchOptions {
  filters?: ProductSearchFilters;
  pagination?: {
    limit?: number;
    offset?: number;
  };
  includeInactive?: boolean;
}

export class ProductsService {
  private productsRepo: ProductsRepository;
  private suppliersRepo: SuppliersRepository;
  private categoriesRepo: CategoriesRepository;

  constructor() {
    this.productsRepo = getProductsRepository();
    this.suppliersRepo = getSuppliersRepository();
    this.categoriesRepo = getCategoriesRepository();
  }

  async create(data: CreateProductData): Promise<Product> {
    try {
      // Generate SKU if not provided
      const sku = data.sku || await this.generateUniqueSku(data.name);

      // Validate supplier exists if provided
      if (data.supplierId) {
        await this.validateSupplierExists(data.supplierId);
      }

      // Check for duplicate SKU
      const existingProduct = await this.productsRepo.findBySku(sku);
      if (existingProduct) {
        throw new RepositoryError(`Produto com SKU '${sku}' já existe`, 'DUPLICATE_SKU_ERROR');
      }

      // Check for duplicate barcode if provided
      if (data.barcode) {
        const existingByBarcode = await this.productsRepo.findByBarcode(data.barcode);
        if (existingByBarcode) {
          throw new RepositoryError(`Produto com código de barras '${data.barcode}' já existe`, 'DUPLICATE_BARCODE_ERROR');
        }
      }

      const productData = {
        id: crypto.randomUUID(),
        sku,
        name: data.name.trim(),
        description: data.description?.trim() || '',
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        stock: data.stock,
        minStock: data.minStock,
        brand: data.brand.trim(),
        gender: data.gender,
        color: data.color.trim(),
        size: data.size.trim(),
        material: data.material?.trim() || '',
        supplierId: data.supplierId || '',
        barcode: data.barcode?.trim() || '',
        imageUrl: data.imageUrl?.trim() || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.productsRepo.create(productData);
      return result;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao criar produto: ${data.name}`, 'CREATE_PRODUCT_ERROR', error);
    }
  }

  async getById(id: string): Promise<Product> {
    try {
      const product = await this.productsRepo.findById(id);
      if (!product) {
        throw new NotFoundError('Product', id);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Falha ao buscar produto: ${id}`, 'GET_PRODUCT_ERROR', error);
    }
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    try {
      const existingProduct = await this.getById(id);

      // Validate supplier exists if provided
      if (data.supplierId) {
        await this.validateSupplierExists(data.supplierId);
      }

      // Check for duplicate SKU if being changed
      if (data.sku && data.sku !== existingProduct.sku) {
        const existingBySku = await this.productsRepo.findBySku(data.sku);
        if (existingBySku) {
          throw new RepositoryError(`Produto com SKU '${data.sku}' já existe`, 'DUPLICATE_SKU_ERROR');
        }
      }

      // Check for duplicate barcode if being changed
      if (data.barcode && data.barcode !== existingProduct.barcode) {
        const existingByBarcode = await this.productsRepo.findByBarcode(data.barcode);
        if (existingByBarcode) {
          throw new RepositoryError(`Produto com código de barras '${data.barcode}' já existe`, 'DUPLICATE_BARCODE_ERROR');
        }
      }

      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const result = await this.productsRepo.update(id, updateData);
      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao atualizar produto: ${id}`, 'UPDATE_PRODUCT_ERROR', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.getById(id); // Verify exists
      await this.productsRepo.delete(id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Falha ao deletar produto: ${id}`, 'DELETE_PRODUCT_ERROR', error);
    }
  }

  async search(options: ProductSearchOptions = {}): Promise<{ products: Product[]; total: number }> {
    try {
      const { filters = {}, pagination = {} } = options;

      const products = await this.productsRepo.search(filters, pagination);

      // Get total count for pagination
      const total = await this.productsRepo.count(); // Count all active products for now

      return { products, total };
    } catch (error) {
      throw new RepositoryError('Falha ao buscar produtos', 'SEARCH_PRODUCTS_ERROR', error);
    }
  }

  async findBySku(sku: string): Promise<Product | null> {
    try {
      return await this.productsRepo.findBySku(sku);
    } catch (error) {
      throw new RepositoryError(`Falha ao buscar produto por SKU: ${sku}`, 'FIND_BY_SKU_ERROR', error);
    }
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    try {
      return await this.productsRepo.findByBarcode(barcode);
    } catch (error) {
      throw new RepositoryError(`Falha ao buscar produto por código de barras: ${barcode}`, 'FIND_BY_BARCODE_ERROR', error);
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    try {
      return await this.productsRepo.findLowStock();
    } catch (error) {
      throw new RepositoryError('Falha ao buscar produtos com estoque baixo', 'LOW_STOCK_ERROR', error);
    }
  }

  async updateStock(id: string, newStock: number): Promise<Product> {
    try {
      if (newStock < 0) {
        throw new RepositoryError('Estoque não pode ser negativo', 'INVALID_STOCK_ERROR');
      }

      return await this.productsRepo.updateStock(id, newStock);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao atualizar estoque do produto: ${id}`, 'UPDATE_STOCK_ERROR', error);
    }
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    try {
      await this.validateSupplierExists(supplierId);
      return await this.productsRepo.findBySupplier(supplierId);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao buscar produtos do fornecedor: ${supplierId}`, 'GET_PRODUCTS_BY_SUPPLIER_ERROR', error);
    }
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      await this.validateCategoryExists(categoryId);
      return await this.productsRepo.findByCategory(categoryId);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao buscar produtos da categoria: ${categoryId}`, 'GET_PRODUCTS_BY_CATEGORY_ERROR', error);
    }
  }

  async getDashboardStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalValue: number;
  }> {
    try {
      const allProducts = await this.productsRepo.findAll();
      const activeProducts = allProducts.filter(p => p.isActive);
      const lowStockProducts = await this.productsRepo.findLowStock();

      const totalValue = activeProducts.reduce((sum, product) => {
        return sum + (product.salePrice * product.stock);
      }, 0);

      return {
        totalProducts: allProducts.length,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStockProducts.length,
        totalValue
      };
    } catch (error) {
      throw new RepositoryError('Falha ao calcular estatísticas do dashboard', 'DASHBOARD_STATS_ERROR', error);
    }
  }

  private async generateUniqueSku(baseName: string): Promise<string> {
    try {
      const base = baseName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const timestamp = Date.now().toString().slice(-6);

      let sku = `${base}${timestamp}`;
      let counter = 1;

      // Ensure uniqueness
      while (await this.productsRepo.findBySku(sku)) {
        sku = `${base}${timestamp}${counter.toString().padStart(2, '0')}`;
        counter++;
        if (counter > 99) {
          // Fallback to random
          sku = `PROD-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
          break;
        }
      }

      return sku;
    } catch (error) {
      // Fallback to random UUID
      return `PROD-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    }
  }

  private async validateSupplierExists(supplierId: string): Promise<void> {
    const supplier = await this.suppliersRepo.findById(supplierId);
    if (!supplier) {
      throw new RepositoryError(`Fornecedor não encontrado: ${supplierId}`, 'SUPPLIER_NOT_FOUND_ERROR');
    }
  }

  private async validateCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoriesRepo.findById(categoryId);
    if (!category) {
      throw new RepositoryError(`Categoria não encontrada: ${categoryId}`, 'CATEGORY_NOT_FOUND_ERROR');
    }
  }
}

// Export lazy instance
let productsServiceInstance: ProductsService | null = null;
export const getProductsService = (): ProductsService => {
  if (!productsServiceInstance) {
    productsServiceInstance = new ProductsService();
  }
  return productsServiceInstance;
};