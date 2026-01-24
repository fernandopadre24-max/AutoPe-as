import { getSuppliersRepository, SuppliersRepository, Supplier, SupplierSearchFilters } from '../repositories/suppliers.repository';
import { RepositoryError, NotFoundError } from '../repositories/base.repository';

export interface CreateSupplierData {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  document?: string;
  website?: string;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  isActive?: boolean;
}

export interface SupplierSearchOptions {
  filters?: SupplierSearchFilters;
  pagination?: {
    limit?: number;
    offset?: number;
  };
}

export class SuppliersService {
  private suppliersRepo: SuppliersRepository;

  constructor() {
    this.suppliersRepo = getSuppliersRepository();
  }

  async create(data: CreateSupplierData): Promise<Supplier> {
    try {
      // Validate email format if provided
      if (data.email && !this.isValidEmail(data.email)) {
        throw new RepositoryError('Email inválido', 'INVALID_EMAIL_ERROR');
      }

      // Validate CNPJ if provided
      if (data.document && !this.isValidCNPJ(data.document)) {
        throw new RepositoryError('CNPJ inválido', 'INVALID_CNPJ_ERROR');
      }

      const supplierData = {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        contactName: data.contactName?.trim() || '',
        phone: data.phone?.trim() || '',
        email: data.email?.trim() || '',
        address: data.address?.trim() || '',
        document: data.document?.trim() || '',
        website: data.website?.trim() || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.suppliersRepo.create(supplierData);
      return result;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao criar fornecedor: ${data.name}`, 'CREATE_SUPPLIER_ERROR', error);
    }
  }

  async getById(id: string): Promise<Supplier> {
    try {
      const supplier = await this.suppliersRepo.findById(id);
      if (!supplier) {
        throw new NotFoundError('Supplier', id);
      }
      return supplier;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Falha ao buscar fornecedor: ${id}`, 'GET_SUPPLIER_ERROR', error);
    }
  }

  async update(id: string, data: UpdateSupplierData): Promise<Supplier> {
    try {
      const existingSupplier = await this.getById(id);

      // Validate email format if provided
      if (data.email && !this.isValidEmail(data.email)) {
        throw new RepositoryError('Email inválido', 'INVALID_EMAIL_ERROR');
      }

      // Validate CNPJ if provided
      if (data.document && data.document !== existingSupplier.document && !this.isValidCNPJ(data.document)) {
        throw new RepositoryError('CNPJ inválido', 'INVALID_CNPJ_ERROR');
      }

      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const result = await this.suppliersRepo.update(id, updateData);
      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao atualizar fornecedor: ${id}`, 'UPDATE_SUPPLIER_ERROR', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.getById(id); // Verify exists

      // TODO: Check if supplier has associated products when products repository supports this

      await this.suppliersRepo.delete(id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Falha ao deletar fornecedor: ${id}`, 'DELETE_SUPPLIER_ERROR', error);
    }
  }

  async search(options: SupplierSearchOptions = {}): Promise<{ suppliers: Supplier[]; total: number }> {
    try {
      const { filters = {}, pagination = {} } = options;

      const suppliers = await this.suppliersRepo.search(filters, pagination);
      const total = await this.suppliersRepo.count();

      return { suppliers, total };
    } catch (error) {
      throw new RepositoryError('Falha ao buscar fornecedores', 'SEARCH_SUPPLIERS_ERROR', error);
    }
  }

  async findByDocument(document: string): Promise<Supplier | null> {
    try {
      return await this.suppliersRepo.findByDocument(document);
    } catch (error) {
      throw new RepositoryError(`Falha ao buscar fornecedor por documento: ${document}`, 'FIND_BY_DOCUMENT_ERROR', error);
    }
  }



  async getDashboardStats(): Promise<{
    totalSuppliers: number;
  }> {
    try {
      const allSuppliers = await this.suppliersRepo.findAll();

      return {
        totalSuppliers: allSuppliers.length
      };
    } catch (error) {
      throw new RepositoryError('Falha ao calcular estatísticas de fornecedores', 'SUPPLIER_STATS_ERROR', error);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidCNPJ(cnpj: string): boolean {
    // Remove non-numeric characters
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return false;

    // Check if all digits are the same
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // CNPJ validation algorithm
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // First verification digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (digit1 !== parseInt(cleaned[12])) return false;

    // Second verification digit
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digit2 === parseInt(cleaned[13]);
  }
}

// Export lazy instance
let suppliersServiceInstance: SuppliersService | null = null;
export const getSuppliersService = (): SuppliersService => {
  if (!suppliersServiceInstance) {
    suppliersServiceInstance = new SuppliersService();
  }
  return suppliersServiceInstance;
};