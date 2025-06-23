import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PermissionController } from '../../src/permission/permission.controller';
import { PermissionService } from '../../src/permission/permission.service';
import { PermissionRepository } from '../../src/permission/repositories/permission.repository';
import { AuthService } from '../../src/auth/auth.service';
import { AuthRepository } from '../../src/auth/repositories/auth.repository';
import { UserSessionRepository } from '../../src/auth/repositories/user-session.repository';
import { ProfileService } from '../../src/profile/profile.service';
import { ProfileRepository } from '../../src/profile/repositories/profile.repository';
import { ProfileRelationshipRepository } from '../../src/profile/repositories/profile-relationship.repository';
import { OrganizationService } from '../../src/organization/organization.service';
import { OrganizationRepository } from '../../src/organization/repositories/organization.repository';
import { CacheModule } from '../../src/common/cache/cache.module';
import { TestDbModule } from '../test-db.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../src/db/schema';
import { JwtService } from '@nestjs/jwt';
import { TestCleanupHelper } from '../helpers/test-cleanup.helper';
import { Role } from '../../src/common/enums/role.enum';
import { OrganizationRole } from '../../src/common/enums/organization-role.enum';
import { CoursePermission } from '../../src/permission/enum/course-permission.enum';

describe('PermissionController (Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let permissionService: PermissionService;
  let organizationService: OrganizationService;
  let authService: AuthService;
  let profileService: ProfileService;
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
      controllers: [PermissionController],
      providers: [
        PermissionService,
        PermissionRepository,
        OrganizationService,
        OrganizationRepository,
        AuthService,
        AuthRepository,
        UserSessionRepository,
        ProfileService,
        ProfileRepository,
        ProfileRelationshipRepository,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    permissionService = moduleFixture.get<PermissionService>(PermissionService);
    organizationService =
      moduleFixture.get<OrganizationService>(OrganizationService);
    authService = moduleFixture.get<AuthService>(AuthService);
    profileService = moduleFixture.get<ProfileService>(ProfileService);
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

  const createUserAndProfile = async (email: string, role: Role) => {
    const userData = {
      email,
      password: 'password123',
    };
    const authResult = await authService.signup(userData);

    const decodedToken = jwtService.decode(authResult.token) as any;
    const user = {
      userId: decodedToken.userId,
      email: decodedToken.email,
    };

    await profileService.sendVerificationCode(user.email);
    const verificationCode = await cacheStore.get(`verification:${user.email}`);

    const createProfileData = {
      name: `Test ${role}`,
      role,
      birthDate: new Date('1990-01-01'),
      verificationCode,
    };

    const profile = await profileService.createProfile(user, createProfileData);
    return { user, profile, token: authResult.token };
  };

  const createOrganization = async (adminProfile: any) => {
    const createOrganizationData = {
      name: 'Test Organization',
      type: 'school',
      mainAdminRole: OrganizationRole.MAIN_ADMIN,
    };

    return await organizationService.createOrganization(
      createOrganizationData,
      adminProfile.id,
    );
  };

  describe('/permissions/organizations/:organizationId (POST)', () => {
    it('should grant permission successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 먼저 관리자에게 권한 관리 권한을 부여 (시스템에서 자동으로 부여되어야 함)
      // 실제로는 조직 생성 시 메인 관리자에게 모든 권한이 자동으로 부여되어야 함
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id, // 자기 자신에게 권한 부여
      );

      const grantPermissionData = {
        organizationId: organization.id,
        profileId: memberProfile.id,
        permission: CoursePermission.CREATE_COURSE,
        expiresAt: '2024-12-31T23:59:59Z',
      };

      const result = await permissionService.grantPermission(
        grantPermissionData,
        adminProfile.id,
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('profileId');
      expect(result).toHaveProperty('permission');
      expect(result).toHaveProperty('grantedByProfileId');
      expect(result.organizationId).toBe(organization.id);
      expect(result.profileId).toBe(memberProfile.id);
      expect(result.permission).toBe(CoursePermission.CREATE_COURSE);
      expect(result.grantedByProfileId).toBe(adminProfile.id);
    });

    it('should return error when granting permission without manage permission', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      const grantPermissionData = {
        organizationId: organization.id,
        profileId: memberProfile.id,
        permission: CoursePermission.CREATE_COURSE,
      };

      await expect(
        permissionService.grantPermission(
          grantPermissionData,
          memberProfile.id,
        ),
      ).rejects.toThrow('권한 관리 권한이 없습니다.');
    });

    it('should return error when granting duplicate permission', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      const grantPermissionData = {
        organizationId: organization.id,
        profileId: memberProfile.id,
        permission: CoursePermission.CREATE_COURSE,
      };

      // 첫 번째 권한 부여
      await permissionService.grantPermission(
        grantPermissionData,
        adminProfile.id,
      );

      // 동일한 권한을 다시 부여하려고 시도
      await expect(
        permissionService.grantPermission(grantPermissionData, adminProfile.id),
      ).rejects.toThrow('이미 해당 권한이 부여되어 있습니다.');
    });
  });

  describe('/permissions/organizations/:organizationId/profiles/:profileId (DELETE)', () => {
    it('should revoke permission successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      // 권한 취소
      await permissionService.revokePermission(
        organization.id,
        memberProfile.id,
        CoursePermission.CREATE_COURSE,
        adminProfile.id,
      );

      // 권한이 취소되었는지 확인
      const hasPermission = await permissionService.checkPermission(
        memberProfile.id,
        organization.id,
        CoursePermission.CREATE_COURSE,
      );

      expect(hasPermission).toBe(false);
    });

    it('should return error when revoking permission without manage permission', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      await expect(
        permissionService.revokePermission(
          organization.id,
          memberProfile.id,
          CoursePermission.CREATE_COURSE,
          memberProfile.id, // 권한 관리 권한이 없는 사용자
        ),
      ).rejects.toThrow('권한 관리 권한이 없습니다.');
    });
  });

  describe('/permissions/organizations/:organizationId (GET)', () => {
    it('should get organization permissions successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      const result = await permissionService.getOrganizationPermissions(
        organization.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // 관리자 권한 + 멤버 권한
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('organizationId');
      expect(result[0]).toHaveProperty('profileId');
      expect(result[0]).toHaveProperty('permission');
      expect(result[0]).toHaveProperty('grantedByProfileId');
    });
  });

  describe('/permissions/profiles/:profileId (GET)', () => {
    it('should get profile permissions successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      const result = await permissionService.getProfilePermissions(
        memberProfile.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('organizationId');
      expect(result[0]).toHaveProperty('profileId');
      expect(result[0]).toHaveProperty('permission');
      expect(result[0].profileId).toBe(memberProfile.id);
      expect(result[0].permission).toBe(CoursePermission.CREATE_COURSE);
    });
  });

  describe('/permissions/check (GET)', () => {
    it('should check permission successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      // 권한 확인
      const hasPermission = await permissionService.checkPermission(
        memberProfile.id,
        organization.id,
        CoursePermission.CREATE_COURSE,
      );

      expect(hasPermission).toBe(true);

      // 권한이 없는 경우 확인
      const hasNoPermission = await permissionService.checkPermission(
        memberProfile.id,
        organization.id,
        CoursePermission.DELETE_COURSE,
      );

      expect(hasNoPermission).toBe(false);
    });
  });

  describe('/permissions/profiles/:profileId/organizations/:organizationId/active (GET)', () => {
    it('should get active permissions successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 여러 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.MANAGE_ENROLLMENTS,
          expiresAt: '2024-12-31T23:59:59Z',
        },
        adminProfile.id,
      );

      const result = await permissionService.getActivePermissions(
        memberProfile.id,
        organization.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('organizationId');
      expect(result[0]).toHaveProperty('profileId');
      expect(result[0]).toHaveProperty('permission');
    });
  });

  describe('Permission validation helpers', () => {
    it('should validate permission successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      // 권한 검증 (성공해야 함)
      await expect(
        permissionService.validatePermission(
          memberProfile.id,
          organization.id,
          CoursePermission.CREATE_COURSE,
        ),
      ).resolves.not.toThrow();

      // 권한 검증 (실패해야 함)
      await expect(
        permissionService.validatePermission(
          memberProfile.id,
          organization.id,
          CoursePermission.DELETE_COURSE,
        ),
      ).rejects.toThrow('해당 권한이 없습니다: course:delete');
    });

    it('should validate any permission successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      // 여러 권한 중 하나라도 있으면 통과
      await expect(
        permissionService.validateAnyPermission(
          memberProfile.id,
          organization.id,
          [CoursePermission.CREATE_COURSE, CoursePermission.DELETE_COURSE],
        ),
      ).resolves.not.toThrow();

      // 모든 권한이 없으면 실패
      await expect(
        permissionService.validateAnyPermission(
          memberProfile.id,
          organization.id,
          [CoursePermission.DELETE_COURSE, CoursePermission.MANAGE_ATTENDANCE],
        ),
      ).rejects.toThrow('필요한 권한이 없습니다.');
    });

    it('should validate all permissions successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await createOrganization(adminProfile);

      // 관리자에게 권한 관리 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: adminProfile.id,
          permission: CoursePermission.MANAGE_PERMISSIONS,
        },
        adminProfile.id,
      );

      // 멤버에게 여러 권한 부여
      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.CREATE_COURSE,
        },
        adminProfile.id,
      );

      await permissionService.grantPermission(
        {
          organizationId: organization.id,
          profileId: memberProfile.id,
          permission: CoursePermission.MANAGE_ENROLLMENTS,
        },
        adminProfile.id,
      );

      // 모든 권한이 있으면 통과
      await expect(
        permissionService.validateAllPermissions(
          memberProfile.id,
          organization.id,
          [CoursePermission.CREATE_COURSE, CoursePermission.MANAGE_ENROLLMENTS],
        ),
      ).resolves.not.toThrow();

      // 일부 권한이 없으면 실패
      await expect(
        permissionService.validateAllPermissions(
          memberProfile.id,
          organization.id,
          [CoursePermission.CREATE_COURSE, CoursePermission.DELETE_COURSE],
        ),
      ).rejects.toThrow('필요한 권한이 없습니다: course:delete');
    });
  });
});
