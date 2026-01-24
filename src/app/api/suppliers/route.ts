import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database/sqlite';
import { suppliers } from '@/lib/database/schema';
import { eq, like, asc, or } from 'drizzle-orm';
import { createSupplierSchema, supplierSearchSchema } from '@/lib/schemas/validation';

// GET /api/suppliers - Listar fornecedores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validar parâmetros de busca com Zod
    const validationResult = supplierSearchSchema.safeParse({
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

    const { search, limit, offset } = validationResult.data;

    const db = await initializeDatabase();

    let result;

    // Aplicar busca se fornecida (agora seguro com validação)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      result = await db
        .select()
        .from(suppliers)
        .where(
          or(
            like(suppliers.name, `%${searchTerm}%`),
            like(suppliers.email, `%${searchTerm}%`)
          )
        )
        .orderBy(asc(suppliers.name))
        .limit(limit)
        .offset(offset);
    } else {
      result = await db
        .select()
        .from(suppliers)
        .orderBy(asc(suppliers.name))
        .limit(limit)
        .offset(offset);
    }

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        limit,
        offset,
        count: result.length
      }
    });

  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar fornecedores' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Criar fornecedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada com Zod
    const validationResult = createSupplierSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const db = await initializeDatabase();

    const result = await db.insert(suppliers).values({
      id: crypto.randomUUID(),
      name: validatedData.name.trim(),
      cnpj: validatedData.cnpj?.trim() || null,
      contactName: validatedData.contactName?.trim() || null,
      email: validatedData.email.trim().toLowerCase(),
      phone: validatedData.phone?.trim() || null,
      address: validatedData.address?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Fornecedor criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar fornecedor' },
      { status: 500 }
    );
  }
}