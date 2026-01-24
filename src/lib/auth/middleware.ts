import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT Secret - em produção, deve vir de variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/logout'
];

// Middleware de autenticação
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota de API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Verificar se é uma rota pública
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar se há token de autenticação
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ||
                request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Token de autenticação não fornecido' },
      { status: 401 }
    );
  }

  try {
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      employeeCode: string;
      role: string;
      iat: number;
      exp: number;
    };

    // Verificar se o token não expirou
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      );
    }

    // Adicionar informações do usuário à requisição
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.id);
    requestHeaders.set('x-user-role', decoded.role);
    requestHeaders.set('x-employee-code', decoded.employeeCode);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}

// Função para gerar token JWT
export function generateToken(employee: {
  id: string;
  employeeCode: string;
  role: string;
}) {
  return jwt.sign(
    {
      id: employee.id,
      employeeCode: employee.employeeCode,
      role: employee.role,
    },
    JWT_SECRET,
    { expiresIn: '8h' } // Token válido por 8 horas
  );
}

// Função para verificar token (para uso interno das APIs)
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      employeeCode: string;
      role: string;
      iat: number;
      exp: number;
    };
  } catch (error) {
    return null;
  }
}

// Tipos para uso nas APIs
export interface AuthenticatedUser {
  id: string;
  employeeCode: string;
  role: string;
}