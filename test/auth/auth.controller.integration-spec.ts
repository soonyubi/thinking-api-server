import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { AuthRepository } from '../../src/auth/repositories/auth.repository';
import { ProfileRepository } from '../../src/profile/repositories/profile.repository';
import { UserSessionRepository } from '../../src/auth/repositories/user-session.repository';
import { CacheModule } from '../../src/common/cache/cache.module';
import { TestDbModule } from '../test-db.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let db: MySql2Database<typeof schema>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1d' },
        }),
        CacheModule.registerAsync({
          useFactory: () => ({
            provider: 'memory',
          }),
        }),
        TestDbModule,
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        AuthRepository,
        ProfileRepository,
        UserSessionRepository,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    db = moduleFixture.get<MySql2Database<typeof schema>>('DB_TEST');
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/auth/signup (POST)', () => {
    it('should create a new user successfully', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.signup(signupData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user.email).toBe(signupData.email);

      await db
        .delete(schema.users)
        .where(eq(schema.users.email, signupData.email));
    });

    it('should return 409 for existing email', async () => {
      const signupData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await authService.signup(signupData);

      await expect(authService.signup(signupData)).rejects.toThrow(
        '이미 존재하는 이메일입니다.',
      );

      await db
        .delete(schema.users)
        .where(eq(schema.users.email, signupData.email));
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'password123',
      };

      await authService.signup(loginData);

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user.email).toBe(loginData.email);

      await db
        .delete(schema.users)
        .where(eq(schema.users.email, loginData.email));
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(authService.login(loginData)).rejects.toThrow(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    });
  });
});
