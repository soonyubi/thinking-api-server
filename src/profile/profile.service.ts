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

    if (!cachedCode) {
      throw new BadRequestException(
        'Verification code not found. Please request a new code.',
      );
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
    requestingRole: Role,
    targetUserEmail: string,
  ) {
    if (requestingRole === Role.STUDENT) {
      return await this.registerChildParentRelationship(
        requestingProfileId,
        targetUserEmail,
      );
    } else if (requestingRole === Role.PARENT) {
      return await this.registerParentChildRelationship(
        requestingProfileId,
        targetUserEmail,
      );
    } else {
      throw new BadRequestException('Invalid role');
    }
  }

  async registerParentChildRelationship(
    requestingProfileId: number,
    targetUserEmail: string,
  ) {
    const studentUser =
      await this.profileRepository.findUserWithProfileByUserEmail(
        targetUserEmail,
      );

    if (!studentUser) {
      throw new NotFoundException('Target user not found');
    }

    const targetProfile = studentUser.profiles.find(
      (profile) => profile.role === Role.STUDENT,
    );

    if (!targetProfile) {
      throw new NotFoundException('Target profile not found');
    }

    const requestingProfile =
      await this.profileRepository.findById(requestingProfileId);

    if (!requestingProfile) {
      throw new NotFoundException('Requesting profile not found');
    }

    const existingRelation =
      await this.relationshipRepository.findExistingRelation(
        requestingProfileId,
        targetProfile.id,
      );

    if (existingRelation) {
      throw new ConflictException('Relation already exists');
    }

    await this.relationshipRepository.create({
      parentProfileId: requestingProfileId,
      childProfileId: targetProfile.id,
      relationType: RelationType.PARENT,
    });
  }

  async registerChildParentRelationship(
    childProfileId: number,
    parentUserEmail: string,
  ) {
    const parentUser =
      await this.profileRepository.findUserWithProfileByUserEmail(
        parentUserEmail,
      );

    if (!parentUser) {
      throw new NotFoundException('Target user not found');
    }

    const targetProfile = parentUser.profiles.find(
      (profile) => profile.role === Role.PARENT,
    );

    if (!targetProfile) {
      throw new NotFoundException('Target profile not found');
    }

    const requestingProfile =
      await this.profileRepository.findById(childProfileId);

    if (!requestingProfile) {
      throw new NotFoundException('Requesting profile not found');
    }

    const existingRelation =
      await this.relationshipRepository.findExistingRelation(
        targetProfile.id,
        childProfileId,
      );

    if (existingRelation) {
      throw new ConflictException('Relation already exists');
    }

    await this.relationshipRepository.create({
      parentProfileId: targetProfile.id,
      childProfileId: childProfileId,
      relationType: RelationType.CHILD,
    });
  }

  async getRelatedProfiles(profileId: number, role: Role) {
    if (role === Role.PARENT) {
      return await this.relationshipRepository.getChildProfiles(profileId);
    } else {
      return await this.relationshipRepository.getParentProfiles(profileId);
    }
  }
}
