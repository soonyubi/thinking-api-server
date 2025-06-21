import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { userSessions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';

@Injectable()
export class UserSessionRepository {
  constructor(
    @Inject(process.env.NODE_ENV === 'test' ? 'DB_TEST' : 'DB_PROD')
    private db: MySql2Database<typeof schema>,
  ) {}

  async findByUserId(userId: number) {
    return await this.db.query.userSessions.findFirst({
      where: eq(userSessions.userId, userId),
    });
  }

  async upsert(userId: number, profileId: number) {
    const existing = await this.findByUserId(userId);

    if (existing) {
      await this.db
        .update(userSessions)
        .set({
          lastProfileId: profileId,
          updatedAt: new Date(),
        })
        .where(eq(userSessions.userId, userId));
    } else {
      await this.db.insert(userSessions).values({
        userId,
        lastProfileId: profileId,
      });
    }
  }
}
