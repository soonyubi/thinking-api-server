import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleMySqlModule } from '@knaadh/nestjs-drizzle-mysql2';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { OrganizationModule } from './organization/organization.module';
import { PermissionModule } from './permission/permission.module';
import { CourseModule } from './course/course.module';
import { PermissionGuard } from './permission/guards/permission.guard';
import * as schema from './db/schema';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    AuthModule,
    ProfileModule,
    OrganizationModule,
    PermissionModule,
    CourseModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        provider: 'memory',
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
