'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

type ProdutosTableProps = {
  data: Product[];
  viewMode: 'retro' | 'modern';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export function ProdutosTable({ data, viewMode }: ProdutosTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const router = useRouter();
  const { deleteProduct, categories } = useData();
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Sem categoria';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Categoria não encontrada';
  };

  const handleDuplicate = (productId: string) => {
    router.push(`/produtos/add?duplicateId=${productId}`);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      toast({
        title: 'Produto Excluído',
        description: `O produto "${productToDelete.name}" foi excluído com sucesso.`,
      });
      setProductToDelete(null);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
    },
    {
      accessorKey: 'categoryId',
      header: 'Categoria',
      cell: ({ row }) => {
        const categoryId = row.getValue('categoryId') as string;
        const category = categories.find(cat => cat.id === categoryId);
        return category ? (
          <Badge variant="secondary" style={{ 
            backgroundColor: category.color + '20',
            color: category.color 
          }}>
            {category.name}
          </Badge>
        ) : (
          <Badge variant="secondary">Sem categoria</Badge>
        );
      },
    },
    {
      accessorKey: 'size',
      header: 'Tamanho',
    },
    {
        accessorKey: 'color',
        header: 'Cor'
    },
    {
      accessorKey: 'stock',
      header: () => <div className="text-right">Estoque</div>,
      cell: ({ row }) => {
        const stock = parseFloat(row.getValue('stock'));
        return <div className="text-right font-medium">{stock}</div>;
      },
    },
    {
      accessorKey: 'salePrice',
      header: () => <div className="text-right">Preço de Venda</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('salePrice'));
        const formattedAmount = formatCurrency(amount);
        return <div className="text-right font-medium">{formattedAmount}</div>;
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Ações</div>,
      cell: ({ row }) => {
        const product = row.original;
        const isRetro = viewMode === 'retro';
        return (
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${isRetro ? 'hover:bg-yellow-200' : ''}`} onClick={() => handleDuplicate(product.id)}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Duplicar</span>
            </Button>
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${isRetro ? 'hover:bg-yellow-200' : ''}`} asChild>
              <Link href={`/produtos/${product.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className={`h-8 w-8 text-red-500 hover:text-red-600 ${isRetro ? 'hover:bg-yellow-200' : ''}`} onClick={() => handleDelete(product)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Excluir</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  React.useEffect(() => {
    const calculatePageSize = () => {
      const topOffset = 450; // Approximate height of elements above the table
      const rowHeight = viewMode === 'retro' ? 45 : 65; // Approximate height of a row in each mode
      const availableHeight = window.innerHeight - topOffset;
      const newPageSize = Math.max(5, Math.floor(availableHeight / rowHeight));
      table.setPageSize(newPageSize);
    };

    calculatePageSize();
    window.addEventListener('resize', calculatePageSize);
    return () => window.removeEventListener('resize', calculatePageSize);
  }, [table, viewMode]);


  const filterBackgroundColor = viewMode === 'retro' ? 'bg-blue-800 text-white' : 'bg-card';
  const filterInputColor = viewMode === 'retro' ? 'bg-white text-black' : '';


  const renderTable = () => {
    if (viewMode === 'retro') {
      return (
        <Card className="font-mono text-black bg-yellow-100 border-yellow-200 shadow-lg">
          <CardContent className="p-0">
              <Table>
              <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b-gray-400 border-dashed hover:bg-yellow-100/50">
                      {headerGroup.headers.map((header) => {
                      return (
                          <TableHead key={header.id} className="text-black">
                          {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                              )}
                          </TableHead>
                      );
                      })}
                  </TableRow>
                  ))}
              </TableHeader>
              <TableBody>
                  {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                      <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="text-xs border-b border-dashed border-gray-400/50 hover:bg-yellow-100/50"
                      >
                      {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                          {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                          )}
                          </TableCell>
                      ))}
                      </TableRow>
                  ))
                  ) : (
                  <TableRow>
                      <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                      >
                      Nenhum resultado.
                      </TableCell>
                  </TableRow>
                  )}
              </TableBody>
              </Table>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <>
    <DeleteConfirmationDialog
        isOpen={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        itemName={productToDelete?.name || ''}
        itemType="produto"
      />
    <div className="flex flex-col gap-4">
      <Card className={`${filterBackgroundColor} p-4`}>
        <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
            placeholder="Filtrar por nome..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className={filterInputColor}
            />
            <Input
            placeholder="Filtrar por cor..."
            value={(table.getColumn('color')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('color')?.setFilterValue(event.target.value)
            }
             className={filterInputColor}
            />
            <Input
            placeholder="Filtrar por tamanho..."
            value={(table.getColumn('size')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('size')?.setFilterValue(event.target.value)
            }
             className={filterInputColor}
            />
            <Select
                value={(table.getColumn('categoryId')?.getFilterValue() as string) ?? ''}
                onValueChange={(value) => table.getColumn('categoryId')?.setFilterValue(value === 'all' ? '' : value)}
            >
                <SelectTrigger className={filterInputColor}>
                    <SelectValue placeholder="Filtrar por Categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        </CardContent>
      </Card>
      
      {renderTable()}

       <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
    </>
  );
}
