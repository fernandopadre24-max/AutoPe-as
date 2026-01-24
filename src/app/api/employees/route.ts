import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database/sqlite';
import { employees } from '@/lib/database/schema';
import { eq, like, asc, or } from 'drizzle-orm';
import { createEmployeeSchema, employeeSearchSchema } from '@/lib/schemas/validation';

// GET /api/employees - Listar funcionários
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validar parâmetros de busca com Zod
    const validationResult = employeeSearchSchema.safeParse({
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
        .from(employees)
        .where(
          or(
            like(employees.firstName, `%${searchTerm}%`),
            like(employees.lastName, `%${searchTerm}%`),
            like(employees.email, `%${searchTerm}%`),
            like(employees.employeeCode, `%${searchTerm}%`)
          )
        )
        .orderBy(asc(employees.firstName))
        .limit(limit)
        .offset(offset);
    } else {
      result = await db
        .select()
        .from(employees)
        .orderBy(asc(employees.firstName))
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
    console.error('Erro ao listar funcionários:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar funcionários' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Criar funcionário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada com Zod
    const validationResult = createEmployeeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const db = await initializeDatabase();

    const result = await db.insert(employees).values({
      id: crypto.randomUUID(),
      employeeCode: validatedData.employeeCode || `EMP${Date.now().toString().slice(-6)}`,
      firstName: validatedData.firstName.trim(),
      lastName: validatedData.lastName.trim(),
      email: validatedData.email.trim().toLowerCase(),
      phone: validatedData.phone?.trim() || null,
      address: validatedData.address?.trim() || null,
      cpf: validatedData.cpf?.trim() || null,
      role: validatedData.role.trim(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Funcionário criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar funcionário' },
      { status: 500 }
    );
  }
}