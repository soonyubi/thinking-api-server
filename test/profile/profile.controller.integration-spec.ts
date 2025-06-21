import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ProfileController } from '../../src/profile/profile.controller';
import { ProfileService } from '../../src/profile/profile.service';
import { ProfileRepository } from '../../src/profile/repositories/profile.repository';
import { ProfileRelationshipRepository } from '../../src/profile/repositories/profile-relationship.repository';
import { AuthService } from '../../src/auth/auth.service';
import { AuthRepository } from '../../src/auth/repositories/auth.repository';
import { UserSessionRepository } from '../../src/auth/repositories/user-session.repository';
import { CacheModule } from '../../src/common/cache/cache.module';
import { TestDbModule } from '../test-db.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../src/db/schema';
import { JwtService } from '@nestjs/jwt';
import { TestCleanupHelper } from '../helpers/test-cleanup.helper';
import { Role } from '../../src/common/enums/role.enum';

describe('ProfileController (Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let profileService: ProfileService;
  let authService: AuthService;
  let db: MySql2Database<typeof schema>;
  let jwtService: JwtService;
  let cleanupHelper: TestCleanupHelper;
  let cacheStore: any;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
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
      controllers: [ProfileController],
      providers: [
        ProfileService,
        ProfileRepository,
        ProfileRelationshipRepository,
        AuthService,
        AuthRepository,
        UserSessionRepository,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    profileService = moduleFixture.get<ProfileService>(ProfileService);
    authService = moduleFixture.get<AuthService>(AuthService);
    db = moduleFixture.get<MySql2Database<typeof schema>>('DB_TEST');
    jwtService = moduleFixture.get<JwtService>(JwtService);
    cleanupHelper = new TestCleanupHelper(db);
    cacheStore = moduleFixture.get('CACHE_STORE');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(async () => {
    await cleanupHelper.cleanupAllTestData();
  });

  describe('/profiles (POST)', () => {
    it('should create a profile successfully', async () => {
      const timestamp = Date.now();
      const userData = {
        email: `profile-test-${timestamp}@example.com`,
        password: 'password123',
      };
      const authResult = await authService.signup(userData);

      const decodedToken = jwtService.decode(authResult.token) as any;
      const user = {
        userId: decodedToken.userId,
        email: decodedToken.email,
      };

      await profileService.sendVerificationCode(user.email);

      const verificationCode = await cacheStore.get(
        `verification:${user.email}`,
      );

      const createProfileData = {
        name: 'Test Profile',
        role: Role.STUDENT,
        birthDate: new Date('1990-01-01'),
        verificationCode: verificationCode,
      };

      const result = await profileService.createProfile(
        user,
        createProfileData,
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('role');
      expect(result.name).toBe(createProfileData.name);
      expect(result.role).toBe(createProfileData.role);
    });

    it('should return 400 for invalid verification code', async () => {
      const timestamp = Date.now();
      const userData = {
        email: `invalid-code-${timestamp}@example.com`,
        password: 'password123',
      };
      const authResult = await authService.signup(userData);

      const decodedToken = jwtService.decode(authResult.token) as any;
      const user = {
        userId: decodedToken.userId,
        email: decodedToken.email,
      };

      const createProfileData = {
        name: 'Test Profile',
        role: Role.STUDENT,
        birthDate: new Date('1990-01-01'),
        verificationCode: 'wrong-code',
      };

      await expect(
        profileService.createProfile(user, createProfileData),
      ).rejects.toThrow(
        'Verification code not found. Please request a new code.',
      );
    });
  });

  describe('/profiles (GET)', () => {
    it('should get profiles by user ID', async () => {
      const timestamp = Date.now();
      const userData = {
        email: `get-profiles-${timestamp}@example.com`,
        password: 'password123',
      };
      const authResult = await authService.signup(userData);

      const decodedToken = jwtService.decode(authResult.token) as any;
      const userId = decodedToken.userId;

      const result = await profileService.getProfiles(userId);

      expect(result).toBeFalsy();
    });
  });

  describe('/profiles/:id (GET)', () => {
    it('should get profile by ID', async () => {
      const timestamp = Date.now();
      const userData = {
        email: `get-profile-${timestamp}@example.com`,
        password: 'password123',
      };
      const authResult = await authService.signup(userData);

      const decodedToken = jwtService.decode(authResult.token) as any;
      const user = {
        userId: decodedToken.userId,
        email: decodedToken.email,
      };

      await profileService.sendVerificationCode(user.email);
      const verificationCode = await cacheStore.get(
        `verification:${user.email}`,
      );

      const createProfileData = {
        name: 'Test Profile',
        role: Role.STUDENT,
        birthDate: new Date('1990-01-01'),
        verificationCode: verificationCode,
      };

      const profile = await profileService.createProfile(
        user,
        createProfileData,
      );

      const result = await profileService.getProfile(profile.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('role');
      expect(result.id).toBe(profile.id);
      expect(result.name).toBe(createProfileData.name);
    });

    it('should return 404 for non-existent profile', async () => {
      await expect(profileService.getProfile(99999)).rejects.toThrow(
        'Profile not found',
      );
    });
  });

  describe('/profiles/relationships (POST)', () => {
    it('should register parent-child relationship successfully', async () => {
      const timestamp = Date.now();
      const parentUserData = {
        email: `parent-${timestamp}@example.com`,
        password: 'password123',
      };
      const parentAuthResult = await authService.signup(parentUserData);
      const parentDecodedToken = jwtService.decode(
        parentAuthResult.token,
      ) as any;
      const parentUser = {
        userId: parentDecodedToken.userId,
        email: parentDecodedToken.email,
      };

      const childUserData = {
        email: `child-${timestamp}@example.com`,
        password: 'password123',
      };
      const childAuthResult = await authService.signup(childUserData);
      const childDecodedToken = jwtService.decode(childAuthResult.token) as any;
      const childUser = {
        userId: childDecodedToken.userId,
        email: childDecodedToken.email,
      };

      await profileService.sendVerificationCode(parentUser.email);
      const parentVerificationCode = await cacheStore.get(
        `verification:${parentUser.email}`,
      );
      const parentProfileData = {
        name: 'Parent Profile',
        role: Role.PARENT,
        birthDate: new Date('1970-01-01'),
        verificationCode: parentVerificationCode,
      };
      const parentProfile = await profileService.createProfile(
        parentUser,
        parentProfileData,
      );

      await profileService.sendVerificationCode(childUser.email);
      const childVerificationCode = await cacheStore.get(
        `verification:${childUser.email}`,
      );
      const childProfileData = {
        name: 'Child Profile',
        role: Role.STUDENT,
        birthDate: new Date('2000-01-01'),
        verificationCode: childVerificationCode,
      };
      const childProfile = await profileService.createProfile(
        childUser,
        childProfileData,
      );

      await profileService.registerRelationship(
        parentProfile.id,
        Role.PARENT,
        childUserData.email,
      );

      const relatedProfiles = await profileService.getRelatedProfiles(
        parentProfile.id,
        Role.PARENT,
      );
      expect(relatedProfiles).toBeDefined();
      expect(relatedProfiles.length).toBeGreaterThan(0);
    });
  });
});
