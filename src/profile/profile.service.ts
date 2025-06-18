import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProfileRepository } from './repositories/profile.repository';
import { CreateProfilePayload } from './payload/create-profile.payload';
import { CacheStore } from 'src/common/cache/interfaces/cache.interface';
import { JwtPayload } from 'src/auth/interface/jwt-payload.interface';
import { ProfileRelationshipRepository } from './repositories/profile-relationship.repository';
import { RelationType } from 'src/common/enums/relation-type.enum';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    @Inject('CACHE_STORE') private cacheStore: CacheStore,
    private relationshipRepository: ProfileRelationshipRepository,
  ) {}

  async createProfile(
    user: JwtPayload,
    createProfilePayload: CreateProfilePayload,
  ) {
    const cachedCode = await this.cacheStore.get(`verification:${user.email}`);

    if (cachedCode) {
      throw new BadRequestException('Verification code has already been sent');
    }

    if (cachedCode !== createProfilePayload.verificationCode) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.cacheStore.delete(`verification:${user.email}`);

    return await this.profileRepository.create({
      userId: user.userId,
      ...createProfilePayload,
    });
  }

  async getProfiles(userId: number) {
    return await this.profileRepository.findByUserId(userId);
  }

  async getProfile(profileId: number) {
    const profile = await this.profileRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationCode(email: string) {
    const code = this.generateVerificationCode();

    await this.cacheStore.set(`verification:${email}`, code, 300);

    // TODO: 실제 이메일 발송 로직 구현
    console.log(`Verification code for ${email}: ${code}`);

    return {
      message: 'Verification code has been sent to your email',
      expiresIn: '5 minutes',
    };
  }

  async registerRelationship(
    requestingProfileId: number,
    targetUserEmail: string,
    relationType: RelationType,
  ) {
    const targetUser =
      await this.profileRepository.findUserWithProfileByUserEmail(
        targetUserEmail,
      );
    if (!targetUser) {
      throw new BadRequestException('Target profile not found');
    }

    const requestingProfile =
      await this.profileRepository.findById(requestingProfileId);

    if (relationType === RelationType.PARENT) {
      if (
        requestingProfile.role !== Role.PARENT ||
        targetProfile.role !== Role.STUDENT
      ) {
        throw new BadRequestException(
          'Invalid role combination for parent-child relationship',
        );
      }
    } else {
      if (
        requestingProfile.role !== Role.STUDENT ||
        targetProfile.role !== Role.PARENT
      ) {
        throw new BadRequestException(
          'Invalid role combination for child-parent relationship',
        );
      }
    }

    const existingRelation =
      await this.relationshipRepository.findExistingRelation(
        relationType === RelationType.PARENT
          ? requestingProfileId
          : targetProfile.id,
        relationType === RelationType.PARENT
          ? targetProfile.id
          : requestingProfileId,
      );

    if (existingRelation) {
      throw new ConflictException('Relationship already exists');
    }

    await this.relationshipRepository.create({
      parentProfileId:
        relationType === RelationType.PARENT
          ? requestingProfileId
          : targetProfile.id,
      childProfileId:
        relationType === RelationType.PARENT
          ? targetProfile.id
          : requestingProfileId,
      relationType: relationType,
    });

    return { message: 'Relationship registered successfully' };
  }

  async getRelatedProfiles(profileId: number, role: Role) {
    if (role === Role.PARENT) {
      return await this.relationshipRepository.getChildProfiles(profileId);
    } else {
      return await this.relationshipRepository.getParentProfiles(profileId);
    }
  }
}
