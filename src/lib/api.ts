// Funções para interagir com a API REST

// Produtos
export const productsApi = {
  async getAll(params?: { search?: string; limit?: number; offset?: number }) {
    const search = new URLSearchParams();
    if (params?.search) search.append('search', params.search);
    if (params?.limit) search.append('limit', params.limit.toString());
    if (params?.offset) search.append('offset', params.offset.toString());
    
    const response = await fetch(`/api/products?${search.toString()}`);
    if (!response.ok) throw new Error('Erro ao buscar produtos');
    const data = await response.json();
    return data.data || [];
  },

  async getById(id: string) {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar produto');
    const data = await response.json();
    return data.data;
  },

  async create(productData: any) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Erro ao criar produto');
    const data = await response.json();
    return data.data;
  },

  async update(id: string, productData: any) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Erro ao atualizar produto');
    const data = await response.json();
    return data.data;
  },

  async delete(id: string) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao excluir produto');
    return true;
  }
};

// Clientes
export const customersApi = {
  async getAll(params?: { search?: string; limit?: number; offset?: number }) {
    const search = new URLSearchParams();
    if (params?.search) search.append('search', params.search);
    if (params?.limit) search.append('limit', params.limit.toString());
    if (params?.offset) search.append('offset', params.offset.toString());
    
    const response = await fetch(`/api/customers?${search.toString()}`);
    if (!response.ok) throw new Error('Erro ao buscar clientes');
    const data = await response.json();
    return data.data || [];
  },

  async getById(id: string) {
    const response = await fetch(`/api/customers/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar cliente');
    const data = await response.json();
    return data.data;
  },

  async create(customerData: any) {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (!response.ok) throw new Error('Erro ao criar cliente');
    const data = await response.json();
    return data.data;
  }
};

// Vendas
export const salesApi = {
  async getAll(params?: { limit?: number; offset?: number }) {
    const search = new URLSearchParams();
    if (params?.limit) search.append('limit', params.limit.toString());
    if (params?.offset) search.append('offset', params.offset.toString());
    
    const response = await fetch(`/api/sales?${search.toString()}`);
    if (!response.ok) throw new Error('Erro ao buscar vendas');
    const data = await response.json();
    return data.data || [];
  },

  async create(saleData: any) {
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!response.ok) throw new Error('Erro ao criar venda');
    const data = await response.json();
    return data.data;
  }
};