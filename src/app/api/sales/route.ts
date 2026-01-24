import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database/sqlite';
import { sales, customers, products, saleItems } from '@/lib/database/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { createSaleSchema, saleSearchSchema } from '@/lib/schemas/validation';

// GET /api/sales - Listar vendas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await initializeDatabase();
    
    const result = await db
      .select({
        id: sales.id,
        customerId: sales.customerId,
        status: sales.status,
        paymentMethod: sales.paymentMethod,
        subtotal: sales.subtotal,
        discount: sales.discount,
        total: sales.total,
        paidAmount: sales.paidAmount,
        changeAmount: sales.changeAmount,
        observations: sales.observations,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          phone: customers.phone
        }
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.createdAt))
      .limit(limit)
      .offset(offset);

    // Obter itens para cada venda
    const salesWithItems = await Promise.all(
      result.map(async (sale: any) => {
        const items = await db
          .select({
            id: saleItems.id,
            productId: saleItems.productId,
            quantity: saleItems.quantity,
            unitPrice: saleItems.unitPrice,
            subtotal: saleItems.subtotal,
            discount: saleItems.discount,
            total: saleItems.total,
            product: {
              id: products.id,
              name: products.name,
              sku: products.sku,
              salePrice: products.salePrice
            }
          })
          .from(saleItems)
          .leftJoin(products, eq(saleItems.productId, products.id))
          .where(eq(saleItems.saleId, sale.id));

        return {
          ...sale,
          items
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: salesWithItems,
      pagination: {
        limit,
        offset,
        count: salesWithItems.length
      }
    });

  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar vendas' },
      { status: 500 }
    );
  }
}

// POST /api/sales - Criar nova venda
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar entrada com Zod
    const validationResult = createSaleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const db = await initializeDatabase();

    // Validar itens e calcular totais
    let subtotal = 0;
    const itemsToInsert = [];

    for (const item of validatedData.items) {
      // Verificar se produto existe
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || product.length === 0) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 400 }
        );
      }

      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTotal = itemSubtotal - (item.discount || 0);

      subtotal += itemTotal;

      itemsToInsert.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: itemSubtotal,
        discount: item.discount || 0,
        total: itemTotal
      });
    }

    if (!body.customerId) {
      return NextResponse.json(
        { error: 'Cliente é obrigatório' },
        { status: 400 }
      );
    }

    // Calcular totais da venda
    const discount = 0; // TODO: implementar desconto na venda
    const total = subtotal - discount;

    // Determinar status baseado no método de pagamento
    const status = ['Dinheiro', 'PIX', 'Cartão'].includes(validatedData.paymentMethod) ? 'Pago' : 'Pendente';

    // Inserir venda
    const newSale = await db.insert(sales).values({
      id: crypto.randomUUID(),
      customerId: validatedData.customerId,
      status,
      paymentMethod: validatedData.paymentMethod,
      subtotal,
      discount,
      total,
      paidAmount: total, // TODO: implementar valores pagos
      changeAmount: 0,   // TODO: implementar troco
      observations: '',  // TODO: implementar observações
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Inserir itens da venda
    const saleId = newSale[0].id;
    const saleItemsToInsert = itemsToInsert.map(item => ({
      id: crypto.randomUUID(),
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      discount: item.discount,
      total: item.total,
      createdAt: new Date()
    }));

    await db.insert(saleItems).values(saleItemsToInsert);

    // Atualizar estoque dos produtos
    for (const item of body.items) {
      const currentProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      
      if (currentProduct.length > 0) {
        const newStock = (currentProduct[0].stock || 0) - item.quantity;
        await db
          .update(products)
          .set({
            stock: Math.max(0, newStock),
            updatedAt: new Date()
          })
          .where(eq(products.id, item.productId));
      }
    }

    // Retornar venda completa
    const completeSale = await db
      .select({
        id: sales.id,
        customerId: sales.customerId,
        status: sales.status,
        paymentMethod: sales.paymentMethod,
        subtotal: sales.subtotal,
        discount: sales.discount,
        total: sales.total,
        paidAmount: sales.paidAmount,
        changeAmount: sales.changeAmount,
        observations: sales.observations,
        createdAt: sales.createdAt,
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName
        }
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.id, saleId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        ...completeSale[0],
        items: itemsToInsert
      },
      message: 'Venda criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar venda:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar venda' },
      { status: 500 }
    );
  }
}