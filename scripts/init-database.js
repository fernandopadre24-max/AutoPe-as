#!/usr/bin/env node

/**
 * Loja2026 - Database Initialization Script
 * Creates SQLite database schema and populates with demo data
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database configuration
const DB_DIR = './.database';
const DB_FILE = path.join(DB_DIR, 'loja2026.db');

// Demo data - extracted from src/lib/data.tsx
const demoData = {
  stores: [
    {
      id: 'store-1',
      name: 'Fashion Store PDV',
      document: '12345678000100',
      phone: '1122334455',
      email: 'contato@fashionstore.com',
      address: 'Rua das Compras, 100, São Paulo - SP',
      pixKeyType: 'telefone',
      pixKeyValue: '16996509803'
    }
  ],

  categories: [
    { id: 'cat-1', name: 'Camisetas', color: '#3b82f6' },
    { id: 'cat-2', name: 'Calças', color: '#10b981' },
    { id: 'cat-3', name: 'Vestidos', color: '#f59e0b' },
    { id: 'cat-4', name: 'Calçados', color: '#ef4444' },
    { id: 'cat-5', name: 'Jaquetas', color: '#8b5cf6' },
  ],

  suppliers: [
    {
      id: 'sup-1',
      name: 'Distribuidora Têxtil Brasil',
      cnpj: '12345678000100',
      contactName: 'Ricardo Almeida',
      phone: '1122334455',
      email: 'contato@distribuidorabrasil.com',
      address: 'Rua dos Fornecedores, 100, São Paulo - SP'
    },
    {
      id: 'sup-2',
      name: 'Jeans & Co.',
      cnpj: '98765432000111',
      contactName: 'Sofia Costa',
      phone: '4133445566',
      email: 'vendas@jeansco.com',
      address: 'Avenida Industrial, 200, Curitiba - PR'
    }
  ],

  customers: [
    {
      id: 'cus-1',
      firstName: 'João',
      lastName: 'Silva',
      phone: '11999998888',
      email: 'joao.silva@email.com',
      address: 'Rua A, 123, São Paulo - SP',
      cpf: '12345678909',
      birthDate: '1990-05-15',
      sex: 'Masculino'
    },
    {
      id: 'cus-2',
      firstName: 'Maria',
      lastName: 'Santos',
      phone: '21988887777',
      email: 'maria.santos@email.com',
      address: 'Av B, 456, Rio de Janeiro - RJ',
      cpf: '98765432100',
      birthDate: '1985-10-20',
      sex: 'Feminino'
    },
    {
      id: 'cus-default',
      firstName: 'Consumidor',
      lastName: 'Final',
      phone: null,
      email: 'consumidor@final.com',
      address: null,
      cpf: null,
      birthDate: null,
      sex: null
    }
  ],

  employees: [
    {
      id: 'emp-1',
      employeeCode: 'EMP001',
      firstName: 'Carlos',
      lastName: 'Pereira',
      phone: '31977776666',
      email: 'carlos.p@email.com',
      address: 'Rua das Flores, 123, Belo Horizonte - MG',
      cpf: '11122233344',
      role: 'Vendedor'
    },
    {
      id: 'emp-2',
      employeeCode: 'EMP002',
      firstName: 'Ana',
      lastName: 'Oliveira',
      phone: '41966665555',
      email: 'ana.o@email.com',
      address: 'Avenida do Sol, 456, Curitiba - PR',
      cpf: '55566677788',
      role: 'Gerente'
    }
  ],

  products: [
    {
      id: 'prod-1',
      sku: 'SKU-001',
      name: 'Camiseta Básica Branca',
      description: 'Camiseta de algodão pima, perfeita para o dia a dia.',
      categoryId: 'cat-1',
      costPrice: 25.00,
      salePrice: 49.90,
      stock: 120,
      brand: 'Fashion Basic',
      gender: 'Unissex',
      color: 'Branca',
      size: 'M',
      supplierId: 'sup-1'
    },
    {
      id: 'prod-2',
      sku: 'SKU-002',
      name: 'Calça Jeans Slim Fit',
      description: 'Calça jeans com elastano, modelo slim fit que se ajusta ao corpo.',
      categoryId: 'cat-2',
      costPrice: 70.00,
      salePrice: 149.90,
      stock: 75,
      brand: 'Denim Co',
      gender: 'Masculino',
      color: 'Azul Escuro',
      size: '42',
      supplierId: 'sup-2'
    },
    {
      id: 'prod-3',
      sku: 'SKU-003',
      name: 'Vestido Floral Midi',
      description: 'Vestido midi com estampa floral, tecido leve e fluído.',
      categoryId: 'cat-3',
      costPrice: 90.00,
      salePrice: 199.90,
      stock: 50,
      brand: 'Floral Dreams',
      gender: 'Feminino',
      color: 'Estampado',
      size: 'M',
      supplierId: 'sup-1'
    },
    {
      id: 'prod-4',
      sku: 'SKU-004',
      name: 'Tênis Casual Branco',
      description: 'Tênis casual versátil, combina com qualquer look.',
      categoryId: 'cat-4',
      costPrice: 80.00,
      salePrice: 179.90,
      stock: 80,
      brand: 'Sport Style',
      gender: 'Unissex',
      color: 'Branco',
      size: '40',
      supplierId: 'sup-2'
    },
    {
      id: 'prod-5',
      sku: 'SKU-005',
      name: 'Jaqueta de Couro PU',
      description: 'Jaqueta estilo motociclista em couro sintético de alta qualidade.',
      categoryId: 'cat-5',
      costPrice: 150.00,
      salePrice: 299.90,
      stock: 30,
      brand: 'Urban Leather',
      gender: 'Unissex',
      color: 'Preta',
      size: 'G',
      supplierId: 'sup-1'
    }
  ],

  sales: [
    {
      id: 'sale-1',
      customerId: 'cus-1',
      status: 'Pago',
      paymentMethod: 'Cartão',
      subtotal: 99.80,
      discount: 0,
      total: 99.80,
      paidAmount: 99.80,
      observations: 'Primeira venda de demonstração'
    },
    {
      id: 'sale-2',
      customerId: 'cus-2',
      status: 'Pago',
      paymentMethod: 'PIX',
      subtotal: 149.90,
      discount: 10.00,
      total: 139.90,
      paidAmount: 139.90,
      observations: 'Venda com desconto aplicado'
    },
    {
      id: 'sale-3',
      customerId: 'cus-2',
      status: 'Pendente',
      paymentMethod: 'Fiado',
      subtotal: 199.90,
      discount: 0,
      total: 199.90,
      paidAmount: 0,
      observations: 'Venda a prazo - aguardando pagamento'
    }
  ],

  saleItems: [
    { saleId: 'sale-1', productId: 'prod-1', quantity: 2, unitPrice: 49.90, subtotal: 99.80, discount: 0, total: 99.80 },
    { saleId: 'sale-2', productId: 'prod-2', quantity: 1, unitPrice: 149.90, subtotal: 149.90, discount: 10.00, total: 139.90 },
    { saleId: 'sale-3', productId: 'prod-3', quantity: 1, unitPrice: 199.90, subtotal: 199.90, discount: 0, total: 199.90 }
  ]
};

// SQL statements for schema creation
const schemaSQL = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create tables
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT UNIQUE,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  pix_key_type TEXT,
  pix_key_value TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  cpf TEXT UNIQUE,
  birth_date TEXT,
  sex TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  cpf TEXT UNIQUE,
  role TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  cost_price REAL NOT NULL,
  sale_price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  brand TEXT NOT NULL,
  gender TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  material TEXT,
  supplier_id TEXT REFERENCES suppliers(id),
  barcode TEXT UNIQUE,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  change_amount REAL DEFAULT 0,
  observations TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_flow (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  reference_id TEXT,
  created_at INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_search ON products(name, barcode, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_category ON cash_flow(category);
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(created_at);
`;

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return Math.floor(Date.now());
}

// Helper function to generate UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function initializeDatabase() {
  console.log('🚀 Inicializando banco de dados Loja2026...');

  // Ensure database directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log(`📁 Diretório ${DB_DIR} criado`);
  }

  // Create database connection
  const db = new Database(DB_FILE);

  try {
    // Enable foreign keys and performance settings
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000');
    db.pragma('temp_store = memory');
    db.pragma('mmap_size = 268435456');

    console.log('⚙️ Configurações de performance aplicadas');

    // Create schema
    console.log('📋 Criando schema do banco...');
    db.exec(schemaSQL);

    // Add PIX columns to existing stores table if they don't exist
    const tableInfo = db.prepare('PRAGMA table_info(stores)').all();
    const hasPixKeyType = tableInfo.some(col => col.name === 'pix_key_type');
    const hasPixKeyValue = tableInfo.some(col => col.name === 'pix_key_value');

    if (!hasPixKeyType) {
      db.exec('ALTER TABLE stores ADD COLUMN pix_key_type TEXT');
      console.log('✅ Coluna pix_key_type adicionada');
    }

    if (!hasPixKeyValue) {
      db.exec('ALTER TABLE stores ADD COLUMN pix_key_value TEXT');
      console.log('✅ Coluna pix_key_value adicionada');
    }

    console.log('✅ Schema criado/atualizado com sucesso');

    // Prepare insert statements
    const insertStore = db.prepare(`
      INSERT OR IGNORE INTO stores (id, name, document, phone, email, address, pix_key_type, pix_key_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, color, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const insertSupplier = db.prepare(`
      INSERT OR IGNORE INTO suppliers (id, name, cnpj, contact_name, email, phone, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCustomer = db.prepare(`
      INSERT OR IGNORE INTO customers (id, first_name, last_name, email, phone, address, cpf, birth_date, sex, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const insertEmployee = db.prepare(`
      INSERT OR IGNORE INTO employees (id, employee_code, first_name, last_name, email, phone, address, cpf, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (id, sku, name, description, category_id, cost_price, sale_price, stock, brand, gender, color, size, supplier_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const insertSale = db.prepare(`
      INSERT OR IGNORE INTO sales (id, customer_id, status, payment_method, subtotal, discount, total, paid_amount, observations, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSaleItem = db.prepare(`
      INSERT OR IGNORE INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, discount, total, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Insert demo data
    const now = getCurrentTimestamp();

    console.log('📦 Populando dados demo...');

    // Stores
    console.log('  • Inserindo dados da loja...');
    demoData.stores.forEach(store => {
      insertStore.run(store.id, store.name, store.document, store.phone, store.email, store.address, store.pixKeyType, store.pixKeyValue, now);
    });

    // Categories
    console.log('  • Inserindo categorias...');
    demoData.categories.forEach(category => {
      insertCategory.run(category.id, category.name, category.color, now);
    });

    // Suppliers
    console.log('  • Inserindo fornecedores...');
    demoData.suppliers.forEach(supplier => {
      insertSupplier.run(supplier.id, supplier.name, supplier.cnpj, supplier.contactName, supplier.email, supplier.phone, supplier.address, now, now);
    });

    // Customers
    console.log('  • Inserindo clientes...');
    demoData.customers.forEach(customer => {
      insertCustomer.run(
        customer.id,
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.address,
        customer.cpf,
        customer.birthDate,
        customer.sex,
        now,
        now
      );
    });

    // Employees
    console.log('  • Inserindo funcionários...');
    demoData.employees.forEach(employee => {
      insertEmployee.run(
        employee.id,
        employee.employeeCode,
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.phone,
        employee.address,
        employee.cpf,
        employee.role,
        now,
        now
      );
    });

    // Products
    console.log('  • Inserindo produtos...');
    demoData.products.forEach(product => {
      insertProduct.run(
        product.id,
        product.sku,
        product.name,
        product.description,
        product.categoryId,
        product.costPrice,
        product.salePrice,
        product.stock,
        product.brand,
        product.gender,
        product.color,
        product.size,
        product.supplierId,
        now,
        now
      );
    });

    // Sales
    console.log('  • Inserindo vendas...');
    demoData.sales.forEach(sale => {
      insertSale.run(
        sale.id,
        sale.customerId,
        sale.status,
        sale.paymentMethod,
        sale.subtotal,
        sale.discount,
        sale.total,
        sale.paidAmount,
        sale.observations,
        now,
        now
      );
    });

    // Sale Items
    console.log('  • Inserindo itens das vendas...');
    demoData.saleItems.forEach(item => {
      insertSaleItem.run(
        generateId(),
        item.saleId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.subtotal,
        item.discount,
        item.total,
        now
      );
    });

    // Verify data insertion
    const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
    const saleCount = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;

    console.log('✅ Dados demo populados:');
    console.log(`   - ${storeCount} loja(s)`);
    console.log(`   - ${productCount} produtos`);
    console.log(`   - ${customerCount} clientes`);
    console.log(`   - ${employeeCount} funcionários`);
    console.log(`   - ${supplierCount} fornecedores`);
    console.log(`   - ${saleCount} vendas`);

    // Run integrity check
    console.log('🔍 Verificando integridade do banco...');
    const integrityCheck = db.pragma('integrity_check');
    if (integrityCheck[0].integrity_check !== 'ok') {
      throw new Error('Falha na verificação de integridade do banco');
    }
    console.log('✅ Integridade verificada');

    console.log(`🎉 Banco de dados criado com sucesso em: ${DB_FILE}`);

  } catch (error) {
    console.error('❌ Erro durante inicialização do banco:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run the initialization
if (require.main === module) {
  try {
    initializeDatabase();
    console.log('\n🏆 Inicialização concluída! Banco pronto para uso.');
  } catch (error) {
    console.error('\n💥 Falha na inicialização:', error.message);
    process.exit(1);
  }
}

module.exports = { initializeDatabase };