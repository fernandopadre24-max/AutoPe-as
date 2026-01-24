import { NextRequest, NextResponse } from 'next/server';
import { categoriesService } from '@/lib/services/categories.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const category = await categoriesService.getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { data: null, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: category, error: null });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const category = await categoriesService.updateCategory(id, { name, color });

    return NextResponse.json({ data: category, error: null });
  } catch (error) {
    console.error('Error updating category:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to update category';
    return NextResponse.json(
      { data: null, error: message },
      { status: message.includes('não encontrada') ? 404 : message.includes('já existe') ? 409 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await categoriesService.deleteCategory(id);

    return NextResponse.json({ data: null, error: null });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json(
      { data: null, error: message },
      { status: message.includes('não encontrada') ? 404 : message.includes('usada por') ? 409 : 500 }
    );
  }
}