import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// Stores table
export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  document: text('document').unique(),
  logoUrl: text('logo_url'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  pixKeyType: text('pix_key_type').$type<'email' | 'cpf' | 'cnpj' | 'telefone' | 'aleatoria'>(),
  pixKeyValue: text('pix_key_value'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index('idx_stores_name').on(table.name),
}));

// Categories table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').default('#6366f1'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index('idx_categories_name').on(table.name),
}));

// Suppliers table
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cnpj: text('cnpj').unique(),
  contactName: text('contact_name'),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index('idx_suppliers_name').on(table.name),
}));

// Customers table
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  cpf: text('cpf').unique(),
  birthDate: text('birth_date'),
  sex: text('sex').$type<'Masculino' | 'Feminino' | 'Outro'>(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index('idx_customers_name').on(table.firstName, table.lastName),
  emailIdx: index('idx_customers_email').on(table.email),
  cpfIdx: index('idx_customers_cpf').on(table.cpf),
  activeIdx: index('idx_customers_active').on(table.isActive),
}));

// Employees table
export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  employeeCode: text('employee_code').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  cpf: text('cpf').unique(),
  role: text('role').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  codeIdx: index('idx_employees_code').on(table.employeeCode),
  nameIdx: index('idx_employees_name').on(table.firstName, table.lastName),
  emailIdx: index('idx_employees_email').on(table.email),
  roleIdx: index('idx_employees_role').on(table.role),
  activeIdx: index('idx_employees_active').on(table.isActive),
}));

// Products table
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: text('category_id').references(() => categories.id),
  costPrice: real('cost_price').notNull(),
  salePrice: real('sale_price').notNull(),
  stock: integer('stock').default(0),
  minStock: integer('min_stock').default(5),
  brand: text('brand').notNull(),
  gender: text('gender').notNull().$type<'Masculino' | 'Feminino' | 'Unissex'>(),
  color: text('color').notNull(),
  size: text('size').notNull(),
  material: text('material'),
  supplierId: text('supplier_id').references(() => suppliers.id),
  barcode: text('barcode').unique(),
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  activeIdx: index('idx_products_active').on(table.isActive),
  searchIdx: index('idx_products_search').on(table.name, table.barcode, table.sku),
  barcodeIdx: index('idx_products_barcode').on(table.barcode),
  skuIdx: index('idx_products_sku').on(table.sku),
  categoryIdx: index('idx_products_category').on(table.categoryId),
  stockIdx: index('idx_products_stock').on(table.stock),
}));

// Sales table
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  status: text('status').notNull().$type<'Pago' | 'Pendente' | 'Cancelado'>().default('Pendente'),
  paymentMethod: text('payment_method').notNull().$type<'Dinheiro' | 'Cartão' | 'PIX' | 'Transferência' | 'Fiado'>(),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').default(0),
  total: real('total').notNull(),
  paidAmount: real('paid_amount').default(0),
  changeAmount: real('change_amount').default(0),
  observations: text('observations'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  customerIdx: index('idx_sales_customer').on(table.customerId),
  statusIdx: index('idx_sales_status').on(table.status),
  dateIdx: index('idx_sales_date').on(table.createdAt),
}));

// Sale items table
export const saleItems = sqliteTable('sale_items', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').references(() => sales.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').default(0),
  total: real('total').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  saleIdx: index('idx_sale_items_sale').on(table.saleId),
  productIdx: index('idx_sale_items_product').on(table.productId),
}));

// Inventory movements table
export const inventoryMovements = sqliteTable('inventory_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id).notNull(),
  type: text('type').notNull().$type<'Entrada' | 'Saída' | 'Ajuste'>(),
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull(),
  referenceId: text('reference_id'), // Can reference sale ID, purchase ID, etc.
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  productIdx: index('idx_inventory_movements_product').on(table.productId),
  typeIdx: index('idx_inventory_movements_type').on(table.type),
  dateIdx: index('idx_inventory_movements_date').on(table.createdAt),
}));

// Cash flow table
export const cashFlow = sqliteTable('cash_flow', {
  id: text('id').primaryKey(),
  type: text('type').notNull().$type<'Entrada' | 'Saída'>(),
  category: text('category').notNull().$type<'Venda' | 'Pagamento' | 'Recebimento' | 'Despesa' | 'Saque' | 'Depósito'>(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  referenceId: text('reference_id'), // Can reference sale ID, payment ID, etc.
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  typeIdx: index('idx_cash_flow_type').on(table.type),
  categoryIdx: index('idx_cash_flow_category').on(table.category),
  dateIdx: index('idx_cash_flow_date').on(table.createdAt),
}));

// Database configuration
export const dbConfig = {
  name: 'loja2026.db',
  path: process.env.NODE_ENV === 'development' 
    ? './loja2026.db' 
    : '$RESOURCE_DIR/loja2026.db',
};