'use client';

import { PageHeader } from '@/components/page-header';
import { SalesReport } from './components/sales-report';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/lib/data';


export default function RelatoriosPage() {
  const { sales, employees, parts, customers, isLoading } = useData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Relatórios de Vendas" />
       {isLoading ? (
        <div className="space-y-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <SalesReport sales={sales} employees={employees} parts={parts} customers={customers} />
      )}
    </div>
  );
}
