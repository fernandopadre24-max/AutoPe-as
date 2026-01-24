// Global database initialization
// This ensures the database is initialized once when the server starts

import { initializeDatabase } from './sqlite';

// Initialize database on module load
initializeDatabase().catch(error => {
  console.error('Failed to initialize database on startup:', error);
  process.exit(1);
});