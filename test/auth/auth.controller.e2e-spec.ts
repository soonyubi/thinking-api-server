import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { AuthRepository } from '../../src/auth/repositories/auth.repository';
import { ProfileRepository } from '../../src/profile/repositories/profile.repository';
import { UserSessionRepository } from '../../src/auth/repositories/user-session.repository';
import { CacheModule } from '../../src/common/cache/cache.module';
import * as bcrypt from 'bcrypt';

// Mock repositories
const mockAuthRepository = {
  findByEmail: jest.fn(),
  createUser: jest.fn(),
  findById: jest.fn(),
};

const mockProfileRepository = {
  findByUserId: jest.fn(),
  findById: jest.fn(),
};

const mockUserSessionRepository = {
  findByUserId: jest.fn(),
  upsert: jest.fn(),
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(() => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async (pw, hash) => {
      // 비밀번호가 'password123'이면 true, 아니면 false 반환
      return pw === 'password123';
    });
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(async (pw, salt) => 'hashedPassword');
    jest.spyOn(bcrypt, 'genSalt').mockImplementation(async () => 'salt');
  });

  beforeEach(async () => {
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
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
        {
          provide: ProfileRepository,
          useValue: mockProfileRepository,
        },
        {
          provide: UserSessionRepository,
          useValue: mockUserSessionRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('/auth/signup (POST)', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockUser);

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user.email).toBe(signupData.email);
        });
    });

    it('should return 409 for existing email', async () => {
      const existingUser = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      mockAuthRepository.findByEmail.mockResolvedValue(existingUser);

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(409);
    });

    it('should return 400 for invalid email', () => {
      const signupData = {
        email: 'invalid-email',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(400);
    });

    it('should return 400 for password too short', () => {
      const signupData = {
        email: 'test@example.com',
        password: '123',
      };

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupData)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'login-test@example.com',
        passwordHash: '$2b$10$test.hash.value',
      };

      const mockProfile = {
        id: 1,
        userId: 1,
        name: 'Test Profile',
        role: 'STUDENT',
      };

      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockProfileRepository.findByUserId.mockResolvedValue(mockProfile);

      const loginData = {
        email: 'login-test@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user.email).toBe(loginData.email);
        });
    });

    it('should return 401 for invalid email', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: 1,
        email: 'login-test@example.com',
        passwordHash: '$2b$10$test.hash.value',
      };

      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);

      const loginData = {
        email: 'login-test@example.com',
        password: 'wrongpassword',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should return 400 for invalid email format', () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });
  });
});
