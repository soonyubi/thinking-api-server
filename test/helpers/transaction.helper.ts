import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../src/db/schema';

export class TransactionHelper {
  private db: MySql2Database<typeof schema>;
  private transaction: any;

  constructor(db: MySql2Database<typeof schema>) {
    this.db = db;
  }

  async beginTransaction() {
    this.transaction = await this.db.transaction(async (tx) => {
      return tx;
    });
    return this.transaction;
  }

  async rollback() {
    if (this.transaction) {
      this.transaction = null;
    }
  }

  async commit() {
    if (this.transaction) {
      this.transaction = null;
    }
  }

  getTransaction() {
    return this.transaction;
  }
}

export async function withTransaction<T>(
  db: MySql2Database<typeof schema>,
  testFn: (transaction: MySql2Database<typeof schema>) => Promise<T>,
): Promise<T> {
  return await db
    .transaction(async (tx) => {
      const result = await testFn(tx);
      return Promise.reject({ type: 'ROLLBACK_FOR_TEST', result });
    })
    .catch((error) => {
      if (error.type === 'ROLLBACK_FOR_TEST') {
        return error.result;
      }
      throw error;
    });
}
