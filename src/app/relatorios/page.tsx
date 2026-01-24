'use client';

import { PageHeader } from '@/components/page-header';
import { SalesReport } from './components/sales-report';
import { ProductsReport } from './components/products-report';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/lib/data';
import { BarChart3, Package } from 'lucide-react';

export default function RelatoriosPage() {
  const { sales, employees, products, customers, categories, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Relatórios" />
        <div className="space-y-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Relatórios" />
      
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReport 
            sales={sales} 
            employees={employees} 
            products={products} 
            customers={customers} 
          />
        </TabsContent>

        <TabsContent value="products">
          <ProductsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    