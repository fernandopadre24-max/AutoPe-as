import { IDatabasePort, RepositoryError, DatabaseConnectionError } from '../repositories/base.repository';
import { getDatabase, getSqlite, initializeDatabase } from '../database/sqlite';

export class SQLiteAdapter implements IDatabasePort {
  private db = getDatabase();
  private sqlite = getSqlite();

  constructor() {
    // Ensure database is initialized
    if (!this.db) {
      initializeDatabase().then(() => {
        this.db = getDatabase();
        this.sqlite = getSqlite();
      }).catch(console.error);
    }
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    const sqlite = getSqlite();
    const transaction = sqlite.transaction(callback);
    return await transaction(this.db);
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      throw new RepositoryError(`Query failed: ${sql}`, 'QUERY_ERROR', error);
    }
  }

  async queryOne(sql: string, params: any[] = []): Promise<any> {
    try {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare(sql);
      return stmt.get(...params);
    } catch (error) {
      throw new RepositoryError(`Query failed: ${sql}`, 'QUERY_ERROR', error);
    }
  }

  prepare(sql: string): any {
    try {
      const sqlite = getSqlite();
      return sqlite.prepare(sql);
    } catch (error) {
      throw new RepositoryError(`Failed to prepare statement: ${sql}`, 'PREPARE_ERROR', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.queryOne('SELECT 1 as health');
      return result?.health === 1;
    } catch (error) {
      return false;
    }
  }

  async backup(path: string): Promise<void> {
    try {
      const sqlite = getSqlite();
      // This is a simplified backup - in production you might want more sophisticated backup logic
      const backupSql = `VACUUM INTO '${path}'`;
      sqlite.exec(backupSql);
    } catch (error) {
      throw new RepositoryError(`Backup failed to path: ${path}`, 'BACKUP_ERROR', error);
    }
  }

  async restore(path: string): Promise<void> {
    try {
      // This is a simplified restore - you'd need to implement proper file copying
      // and database reconnection logic
      throw new RepositoryError('Restore not implemented yet', 'NOT_IMPLEMENTED');
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Restore failed from path: ${path}`, 'RESTORE_ERROR', error);
    }
  }
}

// Export singleton instance
export const sqliteAdapter = new SQLiteAdapter();