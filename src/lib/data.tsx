'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { Product, Customer, Employee, Sale, StoreConfig, Supplier, Category } from '@/lib/types';

interface DataContextProps {
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  suppliers: Supplier[];
  sales: Sale[];
  categories: Category[];
  config: StoreConfig;
  isLoading: boolean;
  authenticatedEmployee: Employee | null;
  setAuthenticatedEmployee: (employee: Employee | null) => void;
  saveConfig: (config: StoreConfig) => void;
  updateCustomer: (customer: Customer) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCustomer: (id: string) => void;
  updateEmployee: (employee: Employee) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeCode'>) => Promise<void>;
  deleteEmployee: (id: string) => void;
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteProduct: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  confirmPayment: (saleId: string) => void;
  getProductById: (id: string) => Product | undefined;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<StoreConfig>({
    storeName: 'Fashion Store',
    cnpj: '12.345.678/0001-99',
    address: 'Rua da Moda, 123, Centro',
    phone: '(11) 98765-4321'
  });
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<Employee | null>(null);

  // Carregar dados das APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Carregar produtos
        try {
          const productsResponse = await fetch('/api/products');
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            setProducts(productsData.data || []);
          }
        } catch (error) {
          // Error will be handled by components
        }

        // Carregar clientes
        try {
          const customersResponse = await fetch('/api/customers');
          if (customersResponse.ok) {
            const customersData = await customersResponse.json();
            setCustomers(customersData.data || []);
          }
        } catch (error) {
          // Error will be handled by components
        }

        // Carregar funcionários
        try {
          const employeesResponse = await fetch('/api/employees');
          if (employeesResponse.ok) {
            const employeesData = await employeesResponse.json();
            setEmployees(employeesData.data || []);
          }
        } catch (error) {
          // Error will be handled by components
        }

        // Carregar fornecedores
        try {
          const suppliersResponse = await fetch('/api/suppliers');
          if (suppliersResponse.ok) {
            const suppliersData = await suppliersResponse.json();
            setSuppliers(suppliersData.data || []);
          }
        } catch (error) {
          // Error will be handled by components
        }

        // Carregar vendas
        try {
          const salesResponse = await fetch('/api/sales');
          if (salesResponse.ok) {
            const salesData = await salesResponse.json();
            setSales(salesData.data || []);
          }
        } catch (error) {
          // Error will be handled by components
        }

        // Carregar categorias
        try {
          const categoriesResponse = await fetch('/api/categories');
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData.data || []);
          }
        } catch (error) {
          // Error will be handled by components
        }

        // Carregar configurações
        try {
          const configResponse = await fetch('/api/config');
          if (configResponse.ok) {
            const configData = await configResponse.json();
            setConfig(configData.data);
          }
        } catch (error) {
          // Config will remain with default values
        }

        // Carregar funcionário autenticado da sessão
        if (typeof window !== 'undefined') {
          const storedEmployee = sessionStorage.getItem('authenticatedEmployee');
          if (storedEmployee) {
            setAuthenticatedEmployee(JSON.parse(storedEmployee));
          }
        }

      } catch (error) {
        // Error will be handled by components
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveConfig = async (newConfig: StoreConfig) => {
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      if (!response.ok) throw new Error('Erro ao salvar configurações');

      setConfig(newConfig);
      if (newConfig.storeName) {
        document.title = newConfig.storeName;
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const addCustomer = async (newCustomerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData)
      });

      if (!response.ok) throw new Error('Erro ao criar cliente');

      const data = await response.json();
      setCustomers(prev => [data.data, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map(c =>
      c.id === updatedCustomer.id ? { ...c, ...updatedCustomer, updatedAt: new Date().toISOString() } : c
    ));
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers(customers.filter(c => c.id !== customerId));
  };

  const addEmployee = async (newEmployeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeCode'>): Promise<void> => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployeeData)
      });

      if (!response.ok) throw new Error('Erro ao criar funcionário');

      const data = await response.json();
      setEmployees(prev => [data.data, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const updateEmployee = (updatedEmployee: Employee) => {
    setEmployees(employees.map(e =>
      e.id === updatedEmployee.id ? { ...e, ...updatedEmployee, updatedAt: new Date().toISOString() } : e
    ));
  };

  const deleteEmployee = (employeeId: string) => {
    setEmployees(employees.filter(e => e.id !== employeeId));
  };

  const addProduct = async (newProductData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductData)
      });

      if (!response.ok) throw new Error('Erro ao criar produto');

      const data = await response.json();
      setProducts(prev => [data.data, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p =>
      p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
    ));
  };

  const deleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const addSale = async (newSaleData: Omit<Sale, 'id'>): Promise<void> => {
    try {
      // Mapear para formato da API
      const apiSaleData = {
        customerId: newSaleData.customerId,
        paymentMethod: newSaleData.paymentMethod,
        items: newSaleData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0
        }))
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiSaleData)
      });

      if (!response.ok) throw new Error('Erro ao criar venda');

      const data = await response.json();
      const newSale = data.data;

      setSales(prev => [newSale, ...prev]);

      // Atualizar estoque localmente
      setProducts(prev => prev.map(product => {
        const saleItem = newSaleData.items.find(item => item.productId === product.id);
        if (saleItem) {
          return {
            ...product,
            stock: Math.max(0, (product.stock || 0) - saleItem.quantity)
          };
        }
        return product;
      }));

    } catch (error) {
      throw error;
    }
  };

  const confirmPayment = (saleId: string) => {
    setSales(sales.map(sale =>
      sale.id === saleId ? { ...sale, status: 'Pago' as const } : sale
    ));
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const addSupplier = async (newSupplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplierData)
      });

      if (!response.ok) throw new Error('Erro ao criar fornecedor');

      const data = await response.json();
      setSuppliers(prev => [data.data, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(suppliers.map(s =>
      s.id === updatedSupplier.id ? { ...s, ...updatedSupplier, updatedAt: new Date().toISOString() } : s
    ));
  };

  const deleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter(s => s.id !== supplierId));
  };

  const addCategory = async (newCategoryData: Omit<Category, 'id'>): Promise<void> => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategoryData)
      });

      if (!response.ok) throw new Error('Erro ao criar categoria');

      const data = await response.json();
      setCategories(prev => [data.data, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(categories.map(c =>
      c.id === updatedCategory.id ? { ...c, ...updatedCategory } : c
    ));
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(categories.filter(c => c.id !== categoryId));
  };

  const value = {
    products,
    customers,
    employees,
    suppliers,
    sales,
    categories,
    config,
    isLoading,
    authenticatedEmployee,
    setAuthenticatedEmployee,
    saveConfig,
    updateCustomer,
    addCustomer,
    deleteCustomer,
    updateEmployee,
    addEmployee,
    deleteEmployee,
    updateProduct,
    addProduct,
    deleteProduct,
    addSale,
    confirmPayment,
    getProductById,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCategory,
    updateCategory,
    deleteCategory,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};