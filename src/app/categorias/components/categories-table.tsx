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
import { Edit, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/lib/types';
import { CategoryDialog } from './category-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/lib/data';

interface CategoriesTableProps {
  categories: Category[];
  onCategoryUpdated: () => void;
}

export function CategoriesTable({ categories, onCategoryUpdated }: CategoriesTableProps) {
  const { addCategory, updateCategory, deleteCategory } = useData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      await addCategory({ name: '', color: '#6366f1', created_at: new Date() });
      toast({
        title: 'Categoria Criada',
        description: 'A categoria foi criada com sucesso.',
      });
      onCategoryUpdated();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar categoria',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (data: { name: string; color: string }) => {
    if (!editingCategory) return;

    setIsLoading(true);
    try {
      await updateCategory({
        ...editingCategory,
        name: data.name,
        color: data.color,
      });
      toast({
        title: 'Categoria Atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      });
      onCategoryUpdated();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar categoria',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsLoading(true);
    try {
      await deleteCategory(categoryToDelete.id);
      toast({
        title: 'Categoria Excluída',
        description: `A categoria "${categoryToDelete.name}" foi excluída com sucesso.`,
      });
      onCategoryUpdated();
      setCategoryToDelete(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir categoria',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorias</CardTitle>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <Badge variant="secondary">{category.color}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                          disabled={isLoading}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setCategoryToDelete(category)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhuma categoria encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CategoryDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingCategory ? handleEdit : handleCreate}
        editingCategory={editingCategory}
        isLoading={isLoading}
      />

      <DeleteConfirmationDialog
        isOpen={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        itemName={categoryToDelete?.name || ''}
        itemType="categoria"
      />
    </>
  );
}