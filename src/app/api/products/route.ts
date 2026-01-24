import { NextRequest, NextResponse } from 'next/server';
import { getProductsService } from '@/lib/services/products.service';
import { createProductSchema, productSearchSchema } from '@/lib/schemas/validation';

// Ensure database is initialized
import '@/lib/database/init';

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validar parâmetros de busca com Zod
    const validationResult = productSearchSchema.safeParse({
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { search, limit = 50, offset = 0 } = validationResult.data;

    const productsService = getProductsService();

    // Build filters for service
    const filters = search ? {
      query: search.trim()
    } : {};

    const { products, total } = await productsService.search({
      filters,
      pagination: { limit, offset }
    });

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        limit,
        offset,
        count: products.length,
        total
      }
    });

  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar produtos' },
      { status: 500 }
    );
  }
}

// POST /api/products - Criar produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada com Zod
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const productsService = getProductsService();

    const result = await productsService.create({
      name: validatedData.name,
      sku: validatedData.sku,
      description: validatedData.description,
      costPrice: validatedData.costPrice,
      salePrice: validatedData.salePrice,
      stock: validatedData.stock,
      minStock: validatedData.minStock,
      brand: validatedData.brand,
      gender: validatedData.gender,
      color: validatedData.color,
      size: validatedData.size,
      material: validatedData.material,
      barcode: validatedData.barcode,
      imageUrl: validatedData.imageUrl
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Produto criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar produto:', error);

    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('DUPLICATE_SKU_ERROR')) {
        return NextResponse.json(
          { error: 'SKU já existe' },
          { status: 409 }
        );
      }
      if (error.message.includes('DUPLICATE_BARCODE_ERROR')) {
        return NextResponse.json(
          { error: 'Código de barras já existe' },
          { status: 409 }
        );
      }
      if (error.message.includes('SUPPLIER_NOT_FOUND_ERROR')) {
        return NextResponse.json(
          { error: 'Fornecedor não encontrado' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar produto' },
      { status: 500 }
    );
  }
}