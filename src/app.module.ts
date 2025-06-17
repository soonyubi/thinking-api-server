import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleMySqlModule } from '@knaadh/nestjs-drizzle-mysql2';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as schema from './db/schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DrizzleMySqlModule.registerAsync({
      tag: 'DB_PROD',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        mysql: {
          connection: 'client',
          config: {
            host: configService.get<string>('DB_HOST'),
            user: configService.get<string>('DB_USER'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
          },
        },
        config: { schema: { ...schema }, mode: 'default' },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
