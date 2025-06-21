import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { OrganizationController } from '../../src/organization/organization.controller';
import { OrganizationService } from '../../src/organization/organization.service';
import { OrganizationRepository } from '../../src/organization/repositories/organization.repository';
import { AuthService } from '../../src/auth/auth.service';
import { AuthRepository } from '../../src/auth/repositories/auth.repository';
import { UserSessionRepository } from '../../src/auth/repositories/user-session.repository';
import { ProfileService } from '../../src/profile/profile.service';
import { ProfileRepository } from '../../src/profile/repositories/profile.repository';
import { ProfileRelationshipRepository } from '../../src/profile/repositories/profile-relationship.repository';
import { CacheModule } from '../../src/common/cache/cache.module';
import { TestDbModule } from '../test-db.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../src/db/schema';
import { JwtService } from '@nestjs/jwt';
import { TestCleanupHelper } from '../helpers/test-cleanup.helper';
import { Role } from '../../src/common/enums/role.enum';
import { OrganizationRole } from '../../src/common/enums/organization-role.enum';

describe('OrganizationController (Integration)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
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
      controllers: [OrganizationController],
      providers: [
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

  describe('/organizations (POST)', () => {
    it('should create an organization successfully', async () => {
      const timestamp = Date.now();
      const { profile } = await createUserAndProfile(
        `org-create-${timestamp}@example.com`,
        Role.PARENT,
      );

      const createOrganizationData = {
        name: 'Test Organization',
        type: 'school',
        mainAdminRole: OrganizationRole.MAIN_ADMIN,
      };

      const result = await organizationService.createOrganization(
        createOrganizationData,
        profile.id,
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('mainAdminProfileId');
      expect(result.name).toBe(createOrganizationData.name);
      expect(result.type).toBe(createOrganizationData.type);
      expect(result.mainAdminProfileId).toBe(profile.id);
    });

    it('should return error for non-existent main admin profile', async () => {
      const createOrganizationData = {
        name: 'Test Organization',
        type: 'school',
        mainAdminRole: OrganizationRole.MAIN_ADMIN,
      };

      await expect(
        organizationService.createOrganization(createOrganizationData, 99999),
      ).rejects.toThrow();
    });
  });

  describe('/organizations (GET)', () => {
    it('should get organizations by main admin', async () => {
      const timestamp = Date.now();
      const { profile } = await createUserAndProfile(
        `org-list-${timestamp}@example.com`,
        Role.PARENT,
      );

      const createOrganizationData = {
        name: 'Test Organization',
        type: 'school',
        mainAdminRole: OrganizationRole.MAIN_ADMIN,
      };

      await organizationService.createOrganization(
        createOrganizationData,
        profile.id,
      );

      const result = await organizationService.getOrganizationsByMainAdmin(
        profile.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
    });
  });

  describe('/organizations/:id (GET)', () => {
    it('should get organization by ID', async () => {
      const timestamp = Date.now();
      const { profile } = await createUserAndProfile(
        `org-get-${timestamp}@example.com`,
        Role.PARENT,
      );

      const createOrganizationData = {
        name: 'Test Organization',
        type: 'school',
        mainAdminRole: OrganizationRole.MAIN_ADMIN,
      };

      const organization = await organizationService.createOrganization(
        createOrganizationData,
        profile.id,
      );

      const result = await organizationService.getOrganizationById(
        organization.id,
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('mainAdminProfileId');
      expect(result.id).toBe(organization.id);
      expect(result.name).toBe(createOrganizationData.name);
    });

    it('should return error for non-existent organization', async () => {
      await expect(
        organizationService.getOrganizationById(99999),
      ).rejects.toThrow();
    });
  });

  describe('/organizations/:id/members (POST)', () => {
    it('should add member to organization successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      const addMemberData = {
        profileId: memberProfile.id,
        roleInOrg: OrganizationRole.STUDENT,
      };

      const result = await organizationService.addMember(
        organization.id,
        addMemberData,
        adminProfile.id,
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('profileId');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('roleInOrg');
      expect(result.profileId).toBe(memberProfile.id);
      expect(result.organizationId).toBe(organization.id);
      expect(result.roleInOrg).toBe(OrganizationRole.STUDENT);
    });

    it('should return error when adding member to non-existent organization', async () => {
      const timestamp = Date.now();
      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const addMemberData = {
        profileId: memberProfile.id,
        roleInOrg: OrganizationRole.STUDENT,
      };

      await expect(
        organizationService.addMember(99999, addMemberData, 1),
      ).rejects.toThrow();
    });

    it('should return error when adding non-existent profile', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      const addMemberData = {
        profileId: 99999,
        roleInOrg: OrganizationRole.STUDENT,
      };

      await expect(
        organizationService.addMember(
          organization.id,
          addMemberData,
          adminProfile.id,
        ),
      ).rejects.toThrow();
    });
  });

  describe('/organizations/:id/members (GET)', () => {
    it('should get organization members', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      await organizationService.addMember(
        organization.id,
        {
          profileId: memberProfile.id,
          roleInOrg: OrganizationRole.STUDENT,
        },
        adminProfile.id,
      );

      const result = await organizationService.getOrganizationMembers(
        organization.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('profileId');
      expect(result[0]).toHaveProperty('organizationId');
      expect(result[0]).toHaveProperty('roleInOrg');
    });

    it('should return empty array for organization with no members', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      const result = await organizationService.getOrganizationMembers(
        organization.id,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].profileId).toBe(adminProfile.id);
      expect(result[0].roleInOrg).toBe(OrganizationRole.MAIN_ADMIN);
    });
  });

  describe('/organizations/:id/members/:profileId (DELETE)', () => {
    it('should remove member from organization successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      await organizationService.addMember(
        organization.id,
        {
          profileId: memberProfile.id,
          roleInOrg: OrganizationRole.STUDENT,
        },
        adminProfile.id,
      );

      await organizationService.removeMember(
        organization.id,
        memberProfile.id,
        adminProfile.id,
      );

      const members = await organizationService.getOrganizationMembers(
        organization.id,
      );
      const removedMember = members.find(
        (member) => member.profileId === memberProfile.id,
      );
      expect(removedMember).toBeUndefined();
    });

    it('should return error when removing member from non-existent organization', async () => {
      const timestamp = Date.now();
      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      await expect(
        organizationService.removeMember(99999, memberProfile.id, 1),
      ).rejects.toThrow();
    });
  });

  describe('/organizations/:id/members/:profileId/role (PATCH)', () => {
    it('should update member role successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      await organizationService.addMember(
        organization.id,
        {
          profileId: memberProfile.id,
          roleInOrg: OrganizationRole.STUDENT,
        },
        adminProfile.id,
      );

      const result = await organizationService.updateMemberRole(
        organization.id,
        memberProfile.id,
        OrganizationRole.SUB_ADMIN,
        adminProfile.id,
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('roleInOrg');
      expect(result.roleInOrg).toBe(OrganizationRole.SUB_ADMIN);
    });

    it('should return error when updating role for non-existent member', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      await expect(
        organizationService.updateMemberRole(
          organization.id,
          99999,
          OrganizationRole.SUB_ADMIN,
          adminProfile.id,
        ),
      ).rejects.toThrow();
    });
  });

  describe('/organizations/:id/members/:profileId/permissions (GET)', () => {
    it('should check member permissions successfully', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      await organizationService.addMember(
        organization.id,
        {
          profileId: memberProfile.id,
          roleInOrg: OrganizationRole.STUDENT,
        },
        adminProfile.id,
      );

      const hasPermission = await organizationService.checkMemberPermission(
        organization.id,
        memberProfile.id,
        [OrganizationRole.STUDENT],
      );

      expect(hasPermission).toBe(true);
    });

    it('should return false for insufficient permissions', async () => {
      const timestamp = Date.now();
      const { profile: adminProfile } = await createUserAndProfile(
        `admin-${timestamp}@example.com`,
        Role.PARENT,
      );

      const { profile: memberProfile } = await createUserAndProfile(
        `member-${timestamp}@example.com`,
        Role.STUDENT,
      );

      const organization = await organizationService.createOrganization(
        {
          name: 'Test Organization',
          type: 'school',
          mainAdminRole: OrganizationRole.MAIN_ADMIN,
        },
        adminProfile.id,
      );

      await organizationService.addMember(
        organization.id,
        {
          profileId: memberProfile.id,
          roleInOrg: OrganizationRole.STUDENT,
        },
        adminProfile.id,
      );

      const hasPermission = await organizationService.checkMemberPermission(
        organization.id,
        memberProfile.id,
        [OrganizationRole.MAIN_ADMIN],
      );

      expect(hasPermission).toBe(false);
    });
  });
});
