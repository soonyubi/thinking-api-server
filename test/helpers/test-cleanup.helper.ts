import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export class TestCleanupHelper {
  constructor(private db: MySql2Database<typeof schema>) {}

  /**
   * 사용자 데이터 정리
   */
  async cleanupUser(email: string): Promise<void> {
    await this.db.delete(schema.users).where(eq(schema.users.email, email));
  }

  /**
   * 여러 사용자 데이터 정리
   */
  async cleanupUsers(emails: string[]): Promise<void> {
    for (const email of emails) {
      await this.cleanupUser(email);
    }
  }

  /**
   * 모든 테스트 데이터 정리
   */
  async cleanupAllTestData(): Promise<void> {
    await this.db.delete(schema.profileRelationships);
    await this.db.delete(schema.userSessions);
    await this.db.delete(schema.profiles);
    await this.db.delete(schema.organizations);
    await this.db.delete(schema.users);
  }

  /**
   * 특정 조건으로 사용자 검색 후 정리
   */
  async cleanupUsersByCondition(condition: any): Promise<void> {
    await this.db.delete(schema.users).where(condition);
  }
}
