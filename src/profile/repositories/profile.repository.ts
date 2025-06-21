import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { profiles, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';

@Injectable()
export class ProfileRepository {
  constructor(
    @Inject(process.env.NODE_ENV === 'test' ? 'DB_TEST' : 'DB_PROD')
    private db: MySql2Database<typeof schema>,
  ) {}

  async findById(id: number) {
    return await this.db.query.profiles.findFirst({
      where: (profiles) => eq(profiles.id, id),
    });
  }

  async findByUserId(userId: number) {
    return await this.db.query.profiles.findFirst({
      where: (profiles) => eq(profiles.userId, userId),
    });
  }

  async create(data: {
    userId: number;
    role: string;
    name: string;
    birthDate: Date;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.db.insert(profiles).values(data);
    const [insertedProfile] = await this.db.query.profiles.findMany({
      where: (profiles) => eq(profiles.userId, data.userId),
      limit: 1,
    });
    return insertedProfile;
  }

  async findUserWithProfileByUserEmail(email: string) {
    const result = await this.db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        profiles: true,
      },
    });

    return result;
  }
}
