'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { useData } from '@/lib/data';
import type { Product, Category } from '@/lib/types';

interface ProductFilters {
  search: string;
  category: string;
  stockMin: boolean;
}

export function ProductsReport() {
  const { products, categories } = useData();
  const [filters, setFilters] = React.useState<ProductFilters>({
    search: '',
    category: 'all',
    stockMin: false,
  });

  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (filters.search && 
          !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !product.sku.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && product.categoryId !== filters.category) {
        return false;
      }

      // Minimum stock filter
      if (filters.stockMin && product.stock >= product.minStock) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  const totalValue = React.useMemo(() => {
    return filteredProducts.reduce((sum, product) => sum + (product.salePrice * product.stock), 0);
  }, [filteredProducts]);

  const lowStockProducts = React.useMemo(() => {
    return products.filter(product => product.stock <= product.minStock);
  }, [products]);

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Sem categoria';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Categoria não encontrada';
  };

  const getCategoryColor = (categoryId: string | undefined) => {
    if (!categoryId) return '#94a3b8';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#94a3b8';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleExportPDF = async (type: 'all' | 'lowStock' | 'byCategory') => {
    const dataToExport = type === 'lowStock' ? lowStockProducts : 
                        type === 'byCategory' ? filteredProducts : 
                        products;

    // Prepare data for PDF
    const reportData = {
      title: type === 'lowStock' ? 'Relatório de Estoque Mínimo' :
              type === 'byCategory' ? 'Relatório de Produtos por Categoria' :
              'Relatório Completo de Produtos',
      date: new Date().toLocaleDateString('pt-BR'),
      products: dataToExport.map(product => ({
        sku: product.sku,
        name: product.name,
        category: getCategoryName(product.categoryId),
        stock: product.stock,
        minStock: product.minStock,
        unitPrice: formatCurrency(product.salePrice),
        totalValue: formatCurrency(product.salePrice * product.stock),
        status: product.stock <= product.minStock ? 'Estoque Baixo' : 'Normal'
      })),
      summary: {
        totalProducts: dataToExport.length,
        totalValue: formatCurrency(
          dataToExport.reduce((sum, product) => sum + (product.salePrice * product.stock), 0)
        ),
        lowStockCount: dataToExport.filter(p => p.stock <= p.minStock).length
      }
    };

    try {
      // Generate HTML and open in print dialog
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Não foi possível abrir janela de impressão');
      }

      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${reportData.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .date { 
            font-size: 14px; 
            color: #666;
        }
        .summary { 
            margin: 20px 0; 
            padding: 15px; 
            background-color: #f5f5f5; 
            border-radius: 5px;
        }
        .summary-item {
            display: inline-block;
            margin-right: 30px;
            font-size: 14px;
        }
        .summary-label {
            font-weight: bold;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            font-size: 12px;
        }
        th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
        }
        .text-right { 
            text-align: right; 
        }
        .status-normal { 
            background-color: #d4edda; 
            color: #155724; 
            padding: 2px 6px; 
            border-radius: 3px;
            font-size: 10px;
        }
        .status-low { 
            background-color: #f8d7da; 
            color: #721c24; 
            padding: 2px 6px; 
            border-radius: 3px;
            font-size: 10px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .category-badge {
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
        }
        @media print {
            body { margin: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${reportData.title}</div>
        <div class="date">Data: ${reportData.date}</div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <span class="summary-label">Total de Produtos:</span> ${reportData.summary.totalProducts}
        </div>
        <div class="summary-item">
            <span class="summary-label">Valor Total:</span> ${reportData.summary.totalValue}
        </div>
        <div class="summary-item">
            <span class="summary-label">Estoque Baixo:</span> ${reportData.summary.lowStockCount}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>SKU</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th class="text-right">Estoque</th>
                <th class="text-right">Estoque Mín</th>
                <th class="text-right">Preço Unit.</th>
                <th class="text-right">Valor Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.products.map(product => `
                <tr>
                    <td>${product.sku}</td>
                    <td>${product.name}</td>
                    <td><span class="category-badge">${product.category}</span></td>
                    <td class="text-right">${product.stock}</td>
                    <td class="text-right">${product.minStock}</td>
                    <td class="text-right">${product.unitPrice}</td>
                    <td class="text-right">${product.totalValue}</td>
                    <td>
                        <span class="${product.status === 'Normal' ? 'status-normal' : 'status-low'}">
                            ${product.status}
                        </span>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        Relatório gerado em ${new Date().toLocaleString('pt-BR')}
    </div>
</body>
</html>`;

      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for the content to load before printing
      printWindow.onload = () => {
        printWindow.print();
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: generate CSV
      generateCSV(reportData);
    }
  };

  const generateCSV = (data: any) => {
    const headers = ['SKU', 'Nome', 'Categoria', 'Estoque', 'Estoque Mínimo', 'Preço Unitário', 'Valor Total', 'Status'];
    const rows = data.products.map((product: any) => [
      product.sku,
      product.name,
      product.category,
      product.stock,
      product.minStock,
      product.unitPrice,
      product.totalValue,
      product.status
    ]);

    const csvContent = [
      [data.title, '', '', '', '', '', '', ''],
      [`Data: ${data.date}`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      headers,
      ...rows,
      ['', '', '', '', '', '', '', ''],
      ['Resumo:', '', '', '', '', '', '', ''],
      [`Total de Produtos: ${data.summary.totalProducts}`, '', '', '', '', '', '', ''],
      [`Valor Total: ${data.summary.totalValue}`, '', '', '', '', '', '', ''],
      [`Produtos com Estoque Baixo: ${data.summary.lowStockCount}`, '', '', '', '', '', '', '']
    ].map(row => row.map((cell: string) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `relatorio-produtos-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredProducts.length} filtrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Produtos precisando de reposição
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor em estoque filtrado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Exportação</CardTitle>
          <CardDescription>
            Filtre os produtos e exporte relatórios em PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar por nome ou SKU</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Digite para buscar..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button
                    variant={filters.stockMin ? "default" : "outline"}
                    onClick={() => setFilters(prev => ({ ...prev, stockMin: !prev.stockMin }))}
                    className="flex-1"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Estoque Mínimo
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleExportPDF('all')} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar Todos (PDF)
              </Button>
              <Button onClick={() => handleExportPDF('byCategory')} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar Filtrados (PDF)
              </Button>
              <Button onClick={() => handleExportPDF('lowStock')} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Estoque Baixo (PDF)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            {filteredProducts.length} produtos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Estoque Mín</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      style={{ 
                        backgroundColor: getCategoryColor(product.categoryId) + '20',
                        color: getCategoryColor(product.categoryId)
                      }}
                    >
                      {getCategoryName(product.categoryId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell className="text-right">{product.minStock}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.salePrice)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.salePrice * product.stock)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock <= product.minStock ? "destructive" : "default"}>
                      {product.stock <= product.minStock ? 'Estoque Baixo' : 'Normal'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}