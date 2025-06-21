import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfilePayload } from './payload/create-profile.payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { JwtPayload } from 'src/auth/interface/jwt-payload.interface';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RegisterRelationshipPayload } from './payload/register-relation.payload';

@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('verify/send')
  async sendVerificationCode(@User() user: JwtPayload) {
    return await this.profileService.sendVerificationCode(user.email);
  }

  @Post()
  async createProfile(
    @User() user: JwtPayload,
    @Body() createProfileDto: CreateProfilePayload,
  ) {
    return await this.profileService.createProfile(user, createProfileDto);
  }

  @Get()
  async getMyProfiles(@User() user: JwtPayload) {
    return await this.profileService.getProfiles(user.userId);
  }

  @Get(':id')
  async getProfile(@Param('id') id: number) {
    return await this.profileService.getProfile(id);
  }

  @Post('relationships')
  @Roles(Role.PARENT, Role.STUDENT)
  async registerRelationship(
    @User() user: JwtPayload,
    @Body() payload: RegisterRelationshipPayload,
  ) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.profileService.registerRelationship(
      user.profileId,
      user.role,
      payload.targetUserEmail,
    );
  }

  @Get('relationships')
  @Roles(Role.PARENT, Role.STUDENT)
  async getRelatedProfiles(@User() user: JwtPayload) {
    if (!user.profileId || !user.role) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.profileService.getRelatedProfiles(
      user.profileId,
      user.role,
    );
  }
}
