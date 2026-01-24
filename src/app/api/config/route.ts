import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/sqlite';
import { stores } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import type { StoreConfig } from '@/lib/types';

export async function GET() {
  try {
    // Ensure database is initialized
    await import('@/lib/database/init');

    // Use raw SQL to avoid Drizzle issues
    const sqlite = require('@/lib/database/sqlite').getSqlite();
    const storeData = sqlite.prepare('SELECT * FROM stores LIMIT 1').get();

    if (!storeData) {
      // Return default config if no store is configured
      const defaultConfig: StoreConfig = {
        storeName: 'Fashion Store',
        cnpj: '12.345.678/0001-99',
        address: 'Rua da Moda, 123, Centro',
        phone: '(11) 98765-4321'
      };
      return NextResponse.json({ data: defaultConfig });
    }

    const config: StoreConfig = {
      storeName: storeData.name,
      cnpj: storeData.document || undefined,
      address: storeData.address || undefined,
      phone: storeData.phone || undefined,
      pixKeyType: storeData.pix_key_type || undefined,
      pixKeyValue: storeData.pix_key_value || undefined
    };

    return NextResponse.json({ data: config });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao carregar configurações' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDatabase();
    const config: StoreConfig = await request.json();

    // Check if store exists
    const existingStore = await db.select().from(stores).limit(1);

    if (existingStore.length === 0) {
      // Create new store
      await db.insert(stores).values({
        id: 'store-1',
        name: config.storeName,
        document: config.cnpj,
        address: config.address,
        phone: config.phone,
        pixKeyType: config.pixKeyType,
        pixKeyValue: config.pixKeyValue,
        createdAt: new Date()
      });
    } else {
      // Update existing store
      await db
        .update(stores)
        .set({
          name: config.storeName,
          document: config.cnpj,
          address: config.address,
          phone: config.phone,
          pixKeyType: config.pixKeyType,
          pixKeyValue: config.pixKeyValue
        })
        .where(eq(stores.id, existingStore[0].id));
    }

    return NextResponse.json({ message: 'Configurações salvas com sucesso' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}