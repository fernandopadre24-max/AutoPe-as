// Database exports
export { initializeDatabase, getDatabase, getSqlite, closeDatabase } from './sqlite';

// Schema exports
export * from './schema';

// Repository exports
export type { IBaseRepository, IDatabasePort, QueryOptions, RepositoryError, DatabaseConnectionError, ValidationError, NotFoundError, BaseEntity } from '../repositories/base.repository';
export { BaseSQLiteRepository } from '../repositories/sqlite.repository';
export { ProductsRepository, productsRepository } from '../repositories/products.repository';
export type { Product, ProductSearchFilters } from '../repositories/products.repository';
export { CustomersRepository, customersRepository } from '../repositories/customers.repository';
export type { Customer, CustomerSearchFilters } from '../repositories/customers.repository';
export { SalesRepository, salesRepository } from '../repositories/sales.repository';
export type { Sale, SaleItem, SaleWithItems, SaleSearchFilters } from '../repositories/sales.repository';

// Adapter exports
export { SQLiteAdapter, sqliteAdapter } from '../adapters/sqlite.adapter';