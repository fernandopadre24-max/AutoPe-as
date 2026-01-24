'use client';

import { useData } from '@/lib/data';
import { CategoriesTable } from './components/categories-table';
import { PageHeader } from '@/components/page-header';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function CategoriasPage() {
  const { categories, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorias"
        description="Gerencie as categorias de produtos da sua loja"
      />
      
      <CategoriesTable 
        categories={categories} 
        onCategoryUpdated={() => {
          // Categories will be automatically updated through the context
        }}
      />
    </div>
  );
}