import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { organizationPermissions } from '../../db/schema';
import { eq, and, desc, isNull, or, gte } from 'drizzle-orm';
import {
  GrantPermissionPayload,
  UpdatePermissionPayload,
  PermissionResponse,
  PermissionHistoryResponse,
} from '../payload/permission.payload';
import * as schema from '../../db/schema';
import { CoursePermission } from '../enum/course-permission.enum';

@Injectable()
export class PermissionRepository {
  constructor(
    @Inject(process.env.NODE_ENV === 'test' ? 'DB_TEST' : 'DB_PROD')
    private db: MySql2Database<typeof schema>,
  ) {}

  async grantPermission(
    grantPermissionDto: GrantPermissionPayload,
    grantedByProfileId: number,
  ): Promise<PermissionResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.db.insert(organizationPermissions).values({
      organizationId: grantPermissionDto.organizationId,
      profileId: grantPermissionDto.profileId,
      permission: grantPermissionDto.permission,
      grantedByProfileId: grantedByProfileId,
      expiresAt: grantPermissionDto.expiresAt
        ? new Date(grantPermissionDto.expiresAt)
        : null,
    });

    const permissions = await this.db.query.organizationPermissions.findMany({
      where: eq(
        organizationPermissions.profileId,
        grantPermissionDto.profileId,
      ),
      with: {
        organization: true,
        profile: true,
        grantedBy: true,
      },
      orderBy: [desc(organizationPermissions.createdAt)],
      limit: 1,
    });

    return permissions[0] ? this.mapToResponse(permissions[0]) : null;
  }

  async findById(id: number): Promise<PermissionResponse | null> {
    const result = await this.db.query.organizationPermissions.findFirst({
      where: eq(organizationPermissions.id, id),
      with: {
        organization: true,
        profile: true,
        grantedBy: true,
      },
    });

    return result ? this.mapToResponse(result) : null;
  }

  async findByOrganization(
    organizationId: number,
  ): Promise<PermissionResponse[]> {
    const results = await this.db.query.organizationPermissions.findMany({
      where: eq(organizationPermissions.organizationId, organizationId),
      with: {
        organization: true,
        profile: true,
        grantedBy: true,
      },
      orderBy: [desc(organizationPermissions.createdAt)],
    });

    return results.map(this.mapToResponse);
  }

  async findByProfile(profileId: number): Promise<PermissionResponse[]> {
    const results = await this.db.query.organizationPermissions.findMany({
      where: eq(organizationPermissions.profileId, profileId),
      with: {
        organization: true,
        profile: true,
        grantedBy: true,
      },
      orderBy: [desc(organizationPermissions.createdAt)],
    });

    return results.map(this.mapToResponse);
  }

  async checkPermission(
    profileId: number,
    organizationId: number,
    permission: CoursePermission,
  ): Promise<boolean> {
    const result = await this.db.query.organizationPermissions.findFirst({
      where: and(
        eq(organizationPermissions.profileId, profileId),
        eq(organizationPermissions.organizationId, organizationId),
        eq(organizationPermissions.permission, permission),
        or(
          isNull(organizationPermissions.expiresAt),
          gte(organizationPermissions.expiresAt, new Date()),
        ),
      ),
    });

    return !!result;
  }

  async findActivePermissions(
    profileId: number,
    organizationId: number,
  ): Promise<PermissionResponse[]> {
    const results = await this.db.query.organizationPermissions.findMany({
      where: and(
        eq(organizationPermissions.profileId, profileId),
        eq(organizationPermissions.organizationId, organizationId),
        or(
          isNull(organizationPermissions.expiresAt),
          gte(organizationPermissions.expiresAt, new Date()),
        ),
      ),
      with: {
        organization: true,
        profile: true,
        grantedBy: true,
      },
      orderBy: [desc(organizationPermissions.createdAt)],
    });

    return results.map(this.mapToResponse);
  }

  async revokePermission(
    organizationId: number,
    profileId: number,
    permission: CoursePermission,
  ): Promise<void> {
    await this.db
      .delete(organizationPermissions)
      .where(
        and(
          eq(organizationPermissions.organizationId, organizationId),
          eq(organizationPermissions.profileId, profileId),
          eq(organizationPermissions.permission, permission),
        ),
      );
  }

  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionPayload,
  ): Promise<PermissionResponse | null> {
    const updateData: any = {};

    if (updatePermissionDto.expiresAt !== undefined) {
      updateData.expiresAt = updatePermissionDto.expiresAt
        ? new Date(updatePermissionDto.expiresAt)
        : null;
    }

    await this.db
      .update(organizationPermissions)
      .set(updateData)
      .where(eq(organizationPermissions.id, id));

    return this.findById(id);
  }

  async findPermissionHistory(
    organizationId: number,
    profileId?: number,
  ): Promise<PermissionHistoryResponse[]> {
    let whereCondition = eq(
      organizationPermissions.organizationId,
      organizationId,
    );

    if (profileId) {
      whereCondition = and(
        eq(organizationPermissions.organizationId, organizationId),
        eq(organizationPermissions.profileId, profileId),
      );
    }

    const results = await this.db.query.organizationPermissions.findMany({
      where: whereCondition,
      with: {
        organization: true,
        profile: true,
        grantedBy: true,
      },
      orderBy: [desc(organizationPermissions.createdAt)],
    });

    return results.map(this.mapToHistoryResponse);
  }

  async findExpiredPermissions(): Promise<PermissionResponse[]> {
    const results = await this.db.query.organizationPermissions.findMany({
      where: and(
        isNull(organizationPermissions.expiresAt),
        gte(organizationPermissions.expiresAt, new Date()),
      ),
      with: {
        organization: true,
        profile: true,
        grantedBy: true,
      },
    });

    return results.map(this.mapToResponse);
  }

  private mapToResponse(result: any): PermissionResponse {
    return {
      id: result.id,
      organizationId: result.organizationId,
      profileId: result.profileId,
      permission: result.permission,
      grantedByProfileId: result.grantedByProfileId,
      createdAt: result.createdAt.toISOString(),
      expiresAt: result.expiresAt?.toISOString(),
      organization: result.organization,
      profile: result.profile,
      grantedBy: result.grantedBy,
    };
  }

  private mapToHistoryResponse(result: any): PermissionHistoryResponse {
    const now = new Date();
    const isActive = !result.expiresAt || result.expiresAt > now;

    return {
      id: result.id,
      organizationId: result.organizationId,
      profileId: result.profileId,
      permission: result.permission,
      grantedByProfileId: result.grantedByProfileId,
      createdAt: result.createdAt.toISOString(),
      expiresAt: result.expiresAt?.toISOString(),
      isActive,
      organization: result.organization,
      profile: result.profile,
      grantedBy: result.grantedBy,
    };
  }
}
