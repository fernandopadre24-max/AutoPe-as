import { getSalesRepository, SalesRepository, Sale, SaleWithItems, SaleItem, SaleSearchFilters } from '../repositories/sales.repository';
import { getProductsRepository, ProductsRepository } from '../repositories/products.repository';
import { getCustomersRepository, CustomersRepository } from '../repositories/customers.repository';
import { RepositoryError, NotFoundError } from '../repositories/base.repository';

export interface CreateSaleItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateSaleData {
  customerId?: string;
  paymentMethod: 'Dinheiro' | 'Cartão' | 'PIX' | 'Transferência' | 'Fiado';
  items: CreateSaleItemData[];
  discount?: number;
  paidAmount?: number;
  observations?: string;
}

export interface UpdateSaleData {
  customerId?: string;
  status?: 'Pago' | 'Pendente' | 'Cancelado';
  paymentMethod?: 'Dinheiro' | 'Cartão' | 'PIX' | 'Transferência' | 'Fiado';
  discount?: number;
  paidAmount?: number;
  observations?: string;
}

export interface SaleSearchOptions {
  filters?: SaleSearchFilters;
  pagination?: {
    limit?: number;
    offset?: number;
  };
  includeItems?: boolean;
  includeCustomer?: boolean;
}

export class SalesService {
  private salesRepo: SalesRepository;
  private productsRepo: ProductsRepository;
  private customersRepo: CustomersRepository;

  constructor() {
    this.salesRepo = getSalesRepository();
    this.productsRepo = getProductsRepository();
    this.customersRepo = getCustomersRepository();
  }

  async create(data: CreateSaleData): Promise<SaleWithItems> {
    try {
      // Validate customer exists if provided
      if (data.customerId) {
        await this.validateCustomerExists(data.customerId);
      }

      // Validate and process items
      const processedItems = await this.processSaleItems(data.items);

      // Calculate totals
      const { subtotal, total } = this.calculateTotals(processedItems, data.discount || 0);

      // Determine status based on payment method and paid amount
      const status = this.determineSaleStatus(data.paymentMethod, data.paidAmount || 0, total);
      const changeAmount = this.calculateChange(data.paymentMethod, data.paidAmount || 0, total);

      const saleData = {
        customerId: data.customerId || '',
        status,
        paymentMethod: data.paymentMethod,
        subtotal,
        discount: data.discount || 0,
        total,
        paidAmount: data.paidAmount || 0,
        changeAmount,
        observations: data.observations?.trim() || ''
      };

      const itemsData = processedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        discount: item.discount,
        total: item.total
      }));

      const result = await this.salesRepo.createSaleWithItems(saleData, itemsData);

      // Update product stock
      await this.updateProductStock(processedItems);

      return result;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError('Falha ao criar venda', 'CREATE_SALE_ERROR', error);
    }
  }

  async getById(id: string, includeItems = true, includeCustomer = false): Promise<SaleWithItems | null> {
    try {
      const sale = await this.salesRepo.findWithItems(id);
      return sale;
    } catch (error) {
      throw new RepositoryError(`Falha ao buscar venda: ${id}`, 'GET_SALE_ERROR', error);
    }
  }

  async update(id: string, data: UpdateSaleData): Promise<Sale> {
    try {
      const existingSale = await this.getById(id, true);
      if (!existingSale) {
        throw new NotFoundError('Sale', id);
      }

      // Validate customer exists if being changed
      if (data.customerId && data.customerId !== existingSale.customerId) {
        await this.validateCustomerExists(data.customerId);
      }

      // Recalculate totals if discount changed
      let total = existingSale.total;
      let changeAmount = existingSale.changeAmount;

      if (data.discount !== undefined && data.discount !== existingSale.discount) {
        const subtotal = existingSale.subtotal;
        total = Math.max(0, subtotal - data.discount);
      }

      // Recalculate change if paid amount changed
      if (data.paidAmount !== undefined) {
        changeAmount = this.calculateChange(existingSale.paymentMethod, data.paidAmount, total);

        // Update status based on new payment
        if (data.status === undefined) {
          data.status = this.determineSaleStatus(existingSale.paymentMethod, data.paidAmount, total);
        }
      }

      const updateData = {
        ...data,
        total,
        changeAmount
      };

      const result = await this.salesRepo.update(id, updateData);
      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao atualizar venda: ${id}`, 'UPDATE_SALE_ERROR', error);
    }
  }

  async cancel(id: string): Promise<Sale> {
    try {
      const sale = await this.getById(id, true);
      if (!sale) {
        throw new NotFoundError('Sale', id);
      }

      if (sale.status === 'Cancelado') {
        throw new RepositoryError('Venda já está cancelada', 'SALE_ALREADY_CANCELLED_ERROR');
      }

      // Restore product stock
      await this.restoreProductStock(sale.items);

      const result = await this.salesRepo.update(id, {
        status: 'Cancelado'
      });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao cancelar venda: ${id}`, 'CANCEL_SALE_ERROR', error);
    }
  }

  async search(options: SaleSearchOptions = {}): Promise<{ sales: Sale[]; total: number }> {
    try {
      const { filters = {}, pagination = {} } = options;

      const sales = await this.salesRepo.search(filters, pagination);
      const total = await this.salesRepo.count();

      return { sales, total };
    } catch (error) {
      throw new RepositoryError('Falha ao buscar vendas', 'SEARCH_SALES_ERROR', error);
    }
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    try {
      await this.validateCustomerExists(customerId);
      return await this.salesRepo.findByCustomer(customerId);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao buscar vendas do cliente: ${customerId}`, 'GET_SALES_BY_CUSTOMER_ERROR', error);
    }
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    try {
      // Use search with date filters
      const sales = await this.salesRepo.search({
        startDate,
        endDate
      });
      return sales;
    } catch (error) {
      throw new RepositoryError('Falha ao buscar vendas por período', 'GET_SALES_BY_DATE_RANGE_ERROR', error);
    }
  }

  async getDashboardStats(): Promise<{
    totalSales: number;
    totalRevenue: number;
    averageSaleValue: number;
    pendingPayments: number;
    salesToday: number;
    salesThisMonth: number;
  }> {
    try {
      const allSales = await this.salesRepo.findAll();
      const paidSales = allSales.filter(s => s.status === 'Pago');

      const totalRevenue = paidSales.reduce((sum, sale) => sum + sale.total, 0);
      const averageSaleValue = paidSales.length > 0 ? totalRevenue / paidSales.length : 0;

      const pendingPayments = allSales.filter(s => s.status === 'Pendente').length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const salesToday = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= today && saleDate < tomorrow;
      }).length;

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const salesThisMonth = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= currentMonth;
      }).length;

      return {
        totalSales: paidSales.length,
        totalRevenue,
        averageSaleValue,
        pendingPayments,
        salesToday,
        salesThisMonth
      };
    } catch (error) {
      throw new RepositoryError('Falha ao calcular estatísticas de vendas', 'SALES_STATS_ERROR', error);
    }
  }

  private async processSaleItems(items: CreateSaleItemData[]): Promise<Array<CreateSaleItemData & { subtotal: number; total: number; productName?: string }>> {
    const processedItems: Array<CreateSaleItemData & { subtotal: number; total: number; productName?: string }> = [];

    for (const item of items) {
      // Validate product exists and has stock
      const product = await this.productsRepo.findById(item.productId);
      if (!product) {
        throw new RepositoryError(`Produto não encontrado: ${item.productId}`, 'PRODUCT_NOT_FOUND_ERROR');
      }

      if (!product.isActive) {
        throw new RepositoryError(`Produto inativo: ${product.name}`, 'PRODUCT_INACTIVE_ERROR');
      }

      if (product.stock < item.quantity) {
        throw new RepositoryError(
          `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
          'INSUFFICIENT_STOCK_ERROR'
        );
      }

      // Use product's sale price if not specified
      const unitPrice = item.unitPrice || product.salePrice;

      const subtotal = unitPrice * item.quantity;
      const total = Math.max(0, subtotal - (item.discount || 0));

      processedItems.push({
        ...item,
        unitPrice,
        subtotal,
        total,
        productName: product.name
      });
    }

    return processedItems;
  }

  private calculateTotals(items: Array<{ subtotal: number; discount: number }>, globalDiscount: number) {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = Math.max(0, subtotal - globalDiscount);
    return { subtotal, total };
  }

  private determineSaleStatus(paymentMethod: string, paidAmount: number, total: number): 'Pago' | 'Pendente' | 'Cancelado' {
    if (paymentMethod === 'Fiado') {
      return 'Pendente';
    }
    return paidAmount >= total ? 'Pago' : 'Pendente';
  }

  private calculateChange(paymentMethod: string, paidAmount: number, total: number): number {
    if (paymentMethod === 'Fiado' || paidAmount <= total) {
      return 0;
    }
    return paidAmount - total;
  }

  private async updateProductStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
    for (const item of items) {
      const product = await this.productsRepo.findById(item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        await this.productsRepo.updateStock(product.id, newStock);
      }
    }
  }

  private async restoreProductStock(items: SaleItem[]): Promise<void> {
    for (const item of items) {
      const product = await this.productsRepo.findById(item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        await this.productsRepo.updateStock(product.id, newStock);
      }
    }
  }

  private async validateCustomerExists(customerId: string): Promise<void> {
    const customer = await this.customersRepo.findById(customerId);
    if (!customer) {
      throw new RepositoryError(`Cliente não encontrado: ${customerId}`, 'CUSTOMER_NOT_FOUND_ERROR');
    }
  }
}

// Export lazy instance
let salesServiceInstance: SalesService | null = null;
export const getSalesService = (): SalesService => {
  if (!salesServiceInstance) {
    salesServiceInstance = new SalesService();
  }
  return salesServiceInstance;
};