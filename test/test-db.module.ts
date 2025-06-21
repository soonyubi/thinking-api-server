import { Module } from '@nestjs/common';
import { DrizzleMySqlModule } from '@knaadh/nestjs-drizzle-mysql2';
import { ConfigModule } from '@nestjs/config';
import * as schema from '../src/db/schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DrizzleMySqlModule.registerAsync({
      tag: 'DB_TEST',
      useFactory: () => ({
        mysql: {
          connection: 'client',
          config: {
            host: 'localhost',
            port: 3307,
            user: 'test_user',
            password: 'test_password',
            database: 'test_db',
          },
        },
        config: { schema: { ...schema }, mode: 'default' },
      }),
    }),
  ],
  exports: [DrizzleMySqlModule],
})
export class TestDbModule {}
