import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database/sqlite';
import { products } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

// GET /api/products/[id] - Obter produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    const db = await initializeDatabase();
    const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar produto' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = await initializeDatabase();

    // Verificar se produto existe
    const existing = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Construir dados de atualização
    const updateData: any = {
      updatedAt: new Date()
    };

    // Adicionar campos fornecidos
    const allowedFields = [
      'name', 'sku', 'description', 'costPrice', 'salePrice', 
      'stock', 'minStock', 'brand', 'gender', 'color', 'size', 
      'material', 'categoryId', 'supplierId', 'barcode', 'imageUrl', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const result = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Produto atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar produto' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    const db = await initializeDatabase();

    // Verificar se produto existe
    const existing = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir produto' },
      { status: 500 }
    );
  }
}