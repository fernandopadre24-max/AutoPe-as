import { NextRequest, NextResponse } from 'next/server';
import { getCustomersService } from '@/lib/services/customers.service';
import { createCustomerSchema, customerSearchSchema } from '@/lib/schemas/validation';

// GET /api/customers - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validar parâmetros de busca com Zod
    const validationResult = customerSearchSchema.safeParse({
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

    const customersService = getCustomersService();

    // Build filters for service
    const filters = search ? {
      query: search.trim()
    } : {};

    const { customers, total } = await customersService.search({
      filters,
      pagination: { limit, offset }
    });

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        limit,
        offset,
        count: customers.length,
        total
      }
    });

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar clientes' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Criar cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada com Zod
    const validationResult = createCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const customersService = getCustomersService();

    const result = await customersService.create({
      firstName: validatedData.firstName.trim(),
      lastName: validatedData.lastName.trim(),
      cpf: validatedData.cpf,
      phone: validatedData.phone,
      email: validatedData.email,
      address: validatedData.address,
      birthDate: validatedData.birthDate,
      sex: validatedData.sex
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cliente criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('DUPLICATE_DOCUMENT_ERROR')) {
        return NextResponse.json(
          { error: 'CPF já cadastrado' },
          { status: 409 }
        );
      }
      if (error.message.includes('INVALID_CPF_ERROR')) {
        return NextResponse.json(
          { error: 'CPF inválido' },
          { status: 400 }
        );
      }
      if (error.message.includes('INVALID_EMAIL_ERROR')) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar cliente' },
      { status: 500 }
    );
  }
}