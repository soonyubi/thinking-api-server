import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ProfileController } from '../../src/profile/profile.controller';
import { ProfileService } from '../../src/profile/profile.service';
import { Role } from '../../src/common/enums/role.enum';
import { JwtPayload } from '../../src/auth/interface/jwt-payload.interface';

// Guard mock
jest.mock('../../src/auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => true),
}));
jest.mock('../../src/auth/guards/role.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => true),
}));

const mockProfileService = {
  sendVerificationCode: jest.fn().mockResolvedValue({
    message: 'Verification code has been sent to your email',
    expiresIn: '5 minutes',
  }),
  createProfile: jest.fn().mockResolvedValue({
    id: 1,
    name: '홍길동',
    role: Role.STUDENT,
    birthDate: new Date(),
    verificationCode: '123456',
  }),
  getProfiles: jest
    .fn()
    .mockResolvedValue([{ id: 1, name: '홍길동', role: Role.STUDENT }]),
  getProfile: jest
    .fn()
    .mockResolvedValue({ id: 1, name: '홍길동', role: Role.STUDENT }),
  registerRelationship: jest.fn().mockResolvedValue({ success: true }),
  getRelatedProfiles: jest
    .fn()
    .mockResolvedValue([{ id: 2, name: '부모', role: Role.PARENT }]),
};

describe('ProfileController (e2e)', () => {
  let profileController: ProfileController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: mockProfileService }],
    }).compile();

    profileController = moduleFixture.get<ProfileController>(ProfileController);
  });

  describe('/profiles/verify/send (POST)', () => {
    it('should send verification code', async () => {
      const user: JwtPayload = { userId: 1, email: 'test@example.com' };
      const result = await profileController.sendVerificationCode(user);
      expect(result).toHaveProperty('message');
      expect(result.message).toBe(
        'Verification code has been sent to your email',
      );
    });
  });

  describe('/profiles (POST)', () => {
    it('should create profile', async () => {
      const user: JwtPayload = { userId: 1, email: 'test@example.com' };
      const payload = {
        name: '홍길동',
        role: Role.STUDENT,
        birthDate: new Date(),
        verificationCode: '123456',
      };

      const result = await profileController.createProfile(user, payload);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('홍길동');
    });
  });

  describe('/profiles (GET)', () => {
    it('should get my profiles', async () => {
      const user: JwtPayload = { userId: 1, email: 'test@example.com' };
      const result = await profileController.getMyProfiles(user);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', '홍길동');
    });
  });

  describe('/profiles/:id (GET)', () => {
    it('should get profile by id', async () => {
      const result = await profileController.getProfile(1);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', '홍길동');
    });
  });

  describe('/profiles/relationships (POST)', () => {
    it('should register relationship', async () => {
      const user: JwtPayload = {
        userId: 1,
        email: 'test@example.com',
        profileId: 1,
        role: Role.STUDENT,
      };
      const payload = { targetUserEmail: 'parent@example.com' };
      const result = await profileController.registerRelationship(
        user,
        payload,
      );
      expect(result).toHaveProperty('success');
    });
  });

  describe('/profiles/relationships (GET)', () => {
    it('should get related profiles', async () => {
      const user: JwtPayload = {
        userId: 1,
        email: 'test@example.com',
        profileId: 1,
        role: Role.STUDENT,
      };
      const result = await profileController.getRelatedProfiles(user);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('role', Role.PARENT);
    });
  });
});
