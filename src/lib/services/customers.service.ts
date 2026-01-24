import { getCustomersRepository, CustomersRepository, Customer, CustomerSearchFilters } from '../repositories/customers.repository';
import { RepositoryError, NotFoundError } from '../repositories/base.repository';

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthDate?: string; // YYYY-MM-DD format
  sex?: 'Masculino' | 'Feminino' | 'Outro';
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  isActive?: boolean;
}

export interface CustomerSearchOptions {
  filters?: CustomerSearchFilters;
  pagination?: {
    limit?: number;
    offset?: number;
  };
}

export class CustomersService {
  private customersRepo: CustomersRepository;

  constructor() {
    this.customersRepo = getCustomersRepository();
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    try {
      const fullName = `${data.firstName} ${data.lastName}`;

      // Validate document uniqueness if provided
      if (data.cpf) {
        await this.validateDocumentUniqueness(data.cpf);
        if (!this.isValidCPF(data.cpf)) {
          throw new RepositoryError('CPF inválido', 'INVALID_CPF_ERROR');
        }
      }

      // Validate email format if provided
      if (data.email && !this.isValidEmail(data.email)) {
        throw new RepositoryError('Email inválido', 'INVALID_EMAIL_ERROR');
      }

      // Validate birth date format if provided
      if (data.birthDate && !this.isValidDate(data.birthDate)) {
        throw new RepositoryError('Data de nascimento inválida', 'INVALID_BIRTH_DATE_ERROR');
      }

      const customerData = {
        id: crypto.randomUUID(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        cpf: data.cpf?.trim() || '',
        phone: data.phone?.trim() || '',
        email: data.email?.trim() || '',
        address: data.address?.trim() || '',
        birthDate: data.birthDate || '',
        sex: data.sex || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.customersRepo.create(customerData);
      return result;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao criar cliente: ${data.firstName} ${data.lastName}`, 'CREATE_CUSTOMER_ERROR', error);
    }
  }

  async getById(id: string): Promise<Customer> {
    try {
      const customer = await this.customersRepo.findById(id);
      if (!customer) {
        throw new NotFoundError('Customer', id);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Falha ao buscar cliente: ${id}`, 'GET_CUSTOMER_ERROR', error);
    }
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    try {
      const existingCustomer = await this.getById(id);

      // Validate document uniqueness if being changed
      if (data.cpf && data.cpf !== existingCustomer.cpf) {
        await this.validateDocumentUniqueness(data.cpf);
        if (!this.isValidCPF(data.cpf)) {
          throw new RepositoryError('CPF inválido', 'INVALID_CPF_ERROR');
        }
      }

      // Validate email format if provided
      if (data.email && !this.isValidEmail(data.email)) {
        throw new RepositoryError('Email inválido', 'INVALID_EMAIL_ERROR');
      }

      // Validate birth date format if provided
      if (data.birthDate && !this.isValidDate(data.birthDate)) {
        throw new RepositoryError('Data de nascimento inválida', 'INVALID_BIRTH_DATE_ERROR');
      }

      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const result = await this.customersRepo.update(id, updateData);
      return result;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Falha ao atualizar cliente: ${id}`, 'UPDATE_CUSTOMER_ERROR', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.getById(id); // Verify exists
      await this.customersRepo.delete(id);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Falha ao deletar cliente: ${id}`, 'DELETE_CUSTOMER_ERROR', error);
    }
  }

  async search(options: CustomerSearchOptions = {}): Promise<{ customers: Customer[]; total: number }> {
    try {
      const { filters = {}, pagination = {} } = options;

      const customers = await this.customersRepo.search(filters, pagination);
      const total = await this.customersRepo.count();

      return { customers, total };
    } catch (error) {
      throw new RepositoryError('Falha ao buscar clientes', 'SEARCH_CUSTOMERS_ERROR', error);
    }
  }

  async findByDocument(document: string): Promise<Customer | null> {
    try {
      return await this.customersRepo.findByDocument(document);
    } catch (error) {
      throw new RepositoryError(`Falha ao buscar cliente por documento: ${document}`, 'FIND_BY_DOCUMENT_ERROR', error);
    }
  }

  async findByEmail(email: string): Promise<Customer | null> {
    try {
      return await this.customersRepo.findByEmail(email);
    } catch (error) {
      throw new RepositoryError(`Falha ao buscar cliente por email: ${email}`, 'FIND_BY_EMAIL_ERROR', error);
    }
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    try {
      return await this.customersRepo.findByPhone(phone);
    } catch (error) {
      throw new RepositoryError(`Falha ao buscar cliente por telefone: ${phone}`, 'FIND_BY_PHONE_ERROR', error);
    }
  }

  async getDashboardStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
  }> {
    try {
      const allCustomers = await this.customersRepo.findAll();
      const activeCustomers = allCustomers.filter(c => c.isActive);

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const newCustomersThisMonth = allCustomers.filter(customer => {
        const createdAt = new Date(customer.createdAt);
        return createdAt >= currentMonth;
      }).length;

      return {
        totalCustomers: allCustomers.length,
        activeCustomers: activeCustomers.length,
        newCustomersThisMonth
      };
    } catch (error) {
      throw new RepositoryError('Falha ao calcular estatísticas de clientes', 'CUSTOMER_STATS_ERROR', error);
    }
  }

  private async validateDocumentUniqueness(document: string): Promise<void> {
    const existingCustomer = await this.customersRepo.findByDocument(document);
    if (existingCustomer) {
      throw new RepositoryError(`Cliente com documento '${document}' já existe`, 'DUPLICATE_DOCUMENT_ERROR');
    }
  }

  private isValidCPF(cpf: string): boolean {
    // Remove non-numeric characters
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return false;

    // Check if all digits are the same
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;

    return remainder === parseInt(cleaned[10]);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
  }
}

// Export lazy instance
let customersServiceInstance: CustomersService | null = null;
export const getCustomersService = (): CustomersService => {
  if (!customersServiceInstance) {
    customersServiceInstance = new CustomersService();
  }
  return customersServiceInstance;
};