

export type Category = {
  id: string;
  name: string;
  color: string;
  created_at: Date;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
  salePrice: number;
  categoryId?: string;
  category?: string; // For backward compatibility
  size: string;
  color: string;
  gender: 'Masculino' | 'Feminino' | 'Unissex';
  supplierId?: string;
  description: string;
  // Campos fiscais para NF-e
  ncm?: string;
  cfop?: string;
  cest?: string;
  origem?: number; // 0= Nacional, 1=Importado, etc
  icmsCst?: string;
  icmsAliquota?: number;
  pisCst?: string;
  pisAliquota?: number;
  cofinsCst?: string;
  cofinsAliquota?: number;
};

export type RecentSale = {
  id: string;
  customerName: string;
  customerEmail: string;

  items: number;
  total: number;
  status: 'Pago' | 'Pendente' | 'Cancelado';
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  cpf?: string;
  birthDate?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro';
  createdAt: string;
  updatedAt: string;
};

export type Employee = {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    cpf?: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export type Supplier = {
    id: string;
    name: string;
    cnpj?: string;
    contactName?: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
};

export type SaleItem = {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
}

export type TermPaymentMethod = 'Boleto' | 'Transferencia' | 'Cheque' | 'Outro';

export type Sale = {
    id: string;
    employeeId: string;
    customerId?: string;
    items: SaleItem[];
    total: number;
    paymentMethod: 'Cartão' | 'PIX' | 'Dinheiro' | 'À Vista' | 'Prazo' | 'Parcelado' | 'Indefinido';
    installments: number;
    date: string;
    dueDate?: string;
    termPaymentMethod?: TermPaymentMethod;
    status: 'Pago' | 'Pendente' | 'Cancelado';
    customerCPF?: string;
    cardNumber?: string;
};

export type PixKeyType = 'email' | 'cpf' | 'cnpj' | 'telefone' | 'aleatoria';

export type StoreConfig = {
  storeName: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  pixKeyType?: PixKeyType;
  pixKeyValue?: string;
};
