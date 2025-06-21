import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { organizations, profileOrganization } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';

@Injectable()
export class OrganizationRepository {
  constructor(
    @Inject(process.env.NODE_ENV === 'test' ? 'DB_TEST' : 'DB_PROD')
    private db: MySql2Database<typeof schema>,
  ) {}

  async create(data: {
    name: string;
    type: string;
    mainAdminProfileId: number;
  }) {
    const result = await this.db.insert(organizations).values(data);
    return result;
  }

  async findById(id: number) {
    return await this.db.query.organizations.findFirst({
      where: eq(organizations.id, id),
      with: {
        mainAdminProfile: true,
        members: {
          with: {
            profile: true,
          },
        },
      },
    });
  }

  async findByMainAdminProfileId(profileId: number) {
    return await this.db.query.organizations.findMany({
      where: eq(organizations.mainAdminProfileId, profileId),
      with: {
        mainAdminProfile: true,
        members: {
          with: {
            profile: true,
          },
        },
      },
    });
  }

  async findMembersByOrganizationId(organizationId: number) {
    return await this.db.query.profileOrganization.findMany({
      where: eq(profileOrganization.organizationId, organizationId),
      with: {
        profile: true,
      },
      orderBy: [desc(profileOrganization.createdAt)],
    });
  }

  async findMembersByRole(organizationId: number, role: OrganizationRole) {
    return await this.db.query.profileOrganization.findMany({
      where: and(
        eq(profileOrganization.organizationId, organizationId),
        eq(profileOrganization.roleInOrg, role),
      ),
      with: {
        profile: true,
      },
    });
  }

  async addMember(data: {
    profileId: number;
    organizationId: number;
    roleInOrg: OrganizationRole;
  }) {
    const result = await this.db.insert(profileOrganization).values(data);
    return result;
  }

  async findMemberByProfileAndOrg(profileId: number, organizationId: number) {
    return await this.db.query.profileOrganization.findFirst({
      where: and(
        eq(profileOrganization.profileId, profileId),
        eq(profileOrganization.organizationId, organizationId),
      ),
      with: {
        profile: true,
      },
    });
  }

  async updateMemberRole(
    profileId: number,
    organizationId: number,
    newRole: OrganizationRole,
  ) {
    const result = await this.db
      .update(profileOrganization)
      .set({ roleInOrg: newRole })
      .where(
        and(
          eq(profileOrganization.profileId, profileId),
          eq(profileOrganization.organizationId, organizationId),
        ),
      );
    return result;
  }

  async removeMember(profileId: number, organizationId: number) {
    const result = await this.db
      .delete(profileOrganization)
      .where(
        and(
          eq(profileOrganization.profileId, profileId),
          eq(profileOrganization.organizationId, organizationId),
        ),
      );
    return result;
  }

  async findOrganizationsByProfileId(profileId: number) {
    return await this.db.query.profileOrganization.findMany({
      where: eq(profileOrganization.profileId, profileId),
      with: {
        organization: {
          with: {
            mainAdminProfile: true,
          },
        },
      },
    });
  }
}
