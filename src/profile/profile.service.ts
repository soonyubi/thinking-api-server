import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { CreateProfilePayload } from './payload/create-profile.payload';

@Injectable()
export class ProfileService {
  constructor(private profileRepository: ProfileRepository) {}

  async createProfile(createProfilePayload: CreateProfilePayload) {
    return await this.profileRepository.create(createProfilePayload);
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
}
