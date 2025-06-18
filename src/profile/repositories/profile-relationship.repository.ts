import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { profileRelationships } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';

@Injectable()
export class ProfileRelationshipRepository {
  constructor(@Inject('DB_PROD') private db: MySql2Database<typeof schema>) {}

  async create(data: {
    parentProfileId: number;
    childProfileId: number;
    relationType: string;
  }) {
    const result = await this.db.insert(profileRelationships).values(data);
    return result;
  }

  async findExistingRelation(parentProfileId: number, childProfileId: number) {
    return await this.db.query.profileRelationships.findFirst({
      where: and(
        eq(profileRelationships.parentProfileId, parentProfileId),
        eq(profileRelationships.childProfileId, childProfileId),
      ),
    });
  }

  async getChildProfiles(parentProfileId: number) {
    return await this.db.query.profileRelationships.findMany({
      where: eq(profileRelationships.parentProfileId, parentProfileId),
      with: {
        childProfile: true,
      },
    });
  }

  async getParentProfiles(childProfileId: number) {
    return await this.db.query.profileRelationships.findMany({
      where: eq(profileRelationships.childProfileId, childProfileId),
      with: {
        parentProfile: true,
      },
    });
  }
}
