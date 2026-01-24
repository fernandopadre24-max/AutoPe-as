import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database/sqlite';
import { employees } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { loginSchema } from '@/lib/schemas/validation';
import { generateToken } from '@/lib/auth/middleware';

// POST /api/auth/login - Autenticar funcionário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada com Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    const db = await initializeDatabase();

    // Buscar funcionário por email
    const employeeResult = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email.toLowerCase()))
      .limit(1);

    if (!employeeResult || employeeResult.length === 0) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    const employee = employeeResult[0];

    // TODO: Implementar verificação de senha hashada
    // Por enquanto, aceitar qualquer senha para funcionários ativos
    if (!employee.isActive) {
      return NextResponse.json(
        { error: 'Funcionário inativo' },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = generateToken({
      id: employee.id,
      employeeCode: employee.employeeCode,
      role: employee.role,
    });

    // Criar resposta com token
    const response = NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role,
        },
        token,
      },
      message: 'Login realizado com sucesso'
    });

    // Definir cookie com token (httpOnly para segurança)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 horas
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}