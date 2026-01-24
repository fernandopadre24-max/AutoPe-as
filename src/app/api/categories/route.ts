import { NextRequest, NextResponse } from 'next/server';
import { categoriesService } from '@/lib/services/categories.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const options: any = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    let categories;
    if (query) {
      categories = await categoriesService.searchCategories(query);
    } else {
      categories = await categoriesService.getAllCategories(options);
    }

    return NextResponse.json({ data: categories, error: null });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const category = await categoriesService.createCategory({ name, color });

    return NextResponse.json({ data: category, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json(
      { data: null, error: message },
      { status: message.includes('já existe') ? 409 : 500 }
    );
  }
}