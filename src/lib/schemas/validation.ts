import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().min(1, 'ID é obrigatório');
export const emailSchema = z.string().email('Email inválido');
export const phoneSchema = z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20, 'Telefone muito longo');
export const positiveNumberSchema = z.number().positive('Deve ser um número positivo');
export const nonEmptyStringSchema = z.string().min(1, 'Campo obrigatório').trim();

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  sku: z.string().min(3, 'SKU deve ter pelo menos 3 caracteres').max(50, 'SKU muito longo').optional(),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  costPrice: positiveNumberSchema.max(999999.99, 'Preço muito alto'),
  salePrice: positiveNumberSchema.max(999999.99, 'Preço muito alto'),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo').max(999999, 'Estoque muito alto'),
  minStock: z.number().int().min(0, 'Estoque mínimo não pode ser negativo').max(999999, 'Estoque mínimo muito alto').default(5),
  brand: z.string().min(1, 'Marca obrigatória').max(50, 'Marca muito longa'),
  gender: z.enum(['Masculino', 'Feminino', 'Unissex'], { errorMap: () => ({ message: 'Gênero deve ser Masculino, Feminino ou Unissex' }) }),
  color: z.string().min(1, 'Cor obrigatória').max(50, 'Cor muito longa'),
  size: z.string().min(1, 'Tamanho obrigatório').max(20, 'Tamanho muito longo'),
  material: z.string().max(100, 'Material muito longo').optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  barcode: z.string().max(50, 'Código de barras muito longo').optional(),
  imageUrl: z.string().url('URL da imagem inválida').optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();

export const productSearchSchema = z.object({
  search: z.string().max(100, 'Termo de busca muito longo').optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Customer schemas
export const createCustomerSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50, 'Nome muito longo'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres').max(50, 'Sobrenome muito longo'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: z.string().max(200, 'Endereço muito longo').optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter exatamente 11 dígitos').optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  sex: z.enum(['Masculino', 'Feminino', 'Outro']).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerSearchSchema = z.object({
  search: z.string().max(100, 'Termo de busca muito longo').optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Employee schemas
export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(3, 'Código deve ter pelo menos 3 caracteres').max(20, 'Código muito longo').optional(),
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50, 'Nome muito longo'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres').max(50, 'Sobrenome muito longo'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: z.string().max(200, 'Endereço muito longo').optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter exatamente 11 dígitos').optional(),
  role: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres').max(50, 'Cargo muito longo'),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeSearchSchema = z.object({
  search: z.string().max(100, 'Termo de busca muito longo').optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Supplier schemas
export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter exatamente 14 dígitos').optional(),
  contactName: z.string().max(100, 'Nome do contato muito longo').optional(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: z.string().max(200, 'Endereço muito longo').optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierSearchSchema = z.object({
  search: z.string().max(100, 'Termo de busca muito longo').optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Sale schemas
export const saleItemSchema = z.object({
  productId: z.string().min(1, 'ID do produto obrigatório'),
  quantity: positiveNumberSchema.int().max(9999, 'Quantidade muito alta'),
  unitPrice: positiveNumberSchema.max(999999.99, 'Preço unitário muito alto'),
  discount: z.number().min(0).max(999999.99, 'Desconto muito alto').default(0),
});

export const createSaleSchema = z.object({
  customerId: z.string().optional(), // optional for "Consumidor Final"
  paymentMethod: z.enum(['Dinheiro', 'Cartão', 'PIX', 'Transferência', 'Fiado'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  items: z.array(saleItemSchema).min(1, 'Pelo menos um item é obrigatório').max(100, 'Muitos itens na venda'),
});

export const saleSearchSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const employeeCredentialsSchema = z.object({
  employeeCode: z.string().min(1, 'Código do funcionário obrigatório'),
  // password could be added here if implementing authentication
});

// Type exports for use in components and APIs
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmployeeCredentialsInput = z.infer<typeof employeeCredentialsSchema>;