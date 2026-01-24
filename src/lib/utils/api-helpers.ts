import { initializeDatabase } from '@/lib/database/sqlite';

// Função para garantir que o banco de dados esteja inicializado
export async function ensureDatabaseInitialized() {
  try {
    await initializeDatabase();
    return true;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    return false;
  }
}

// Wrapper para endpoints API que garantem inicialização do DB
export async function withDatabase<T>(
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const initialized = await ensureDatabaseInitialized();
    if (!initialized) {
      return {
        success: false,
        error: 'Banco de dados não disponível'
      };
    }

    const result = await operation();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Erro na operação com banco de dados:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}