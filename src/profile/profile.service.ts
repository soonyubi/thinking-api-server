import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { CreateProfilePayload } from './payload/create-profile.payload';
import { CacheStore } from 'src/common/cache/interfaces/cache.interface';
import { JwtPayload } from 'src/auth/interface/jwt-payload.interface';

@Injectable()
export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    @Inject('CACHE_STORE') private cacheStore: CacheStore,
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
}
