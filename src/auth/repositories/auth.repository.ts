import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(process.env.NODE_ENV === 'test' ? 'DB_TEST' : 'DB_PROD')
    private db: MySql2Database<typeof schema>,
  ) {}

  async findByEmail(email: string) {
    return await this.db.query.users.findFirst({
      where: (users) => eq(users.email, email),
    });
  }

  async createUser(data: { email: string; passwordHash: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.db.insert(users).values(data);
    const [insertedUser] = await this.db.query.users.findMany({
      where: (users) => eq(users.email, data.email),
      limit: 1,
    });
    return insertedUser;
  }

  async findById(id: number) {
    return await this.db.query.users.findFirst({
      where: (users) => eq(users.id, id),
    });
  }
}
