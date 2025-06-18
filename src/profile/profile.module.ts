import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './repositories/profile.repository';
import { ProfileRelationshipRepository } from './repositories/profile-relationship.repository';
import { RolesGuard } from 'src/auth/guards/role.guard';

@Module({
  controllers: [ProfileController],
  providers: [
    ProfileService,
    ProfileRepository,
    RolesGuard,
    ProfileRelationshipRepository,
  ],
  exports: [ProfileService, ProfileRepository],
})
export class ProfileModule {}
