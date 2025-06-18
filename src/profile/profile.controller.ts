import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfilePayload } from './payload/create-profile.payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { JwtPayload } from 'src/auth/interface/jwt-payload.interface';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post()
  async createProfile(
    @User() user: JwtPayload,
    @Body() createProfileDto: CreateProfilePayload,
  ) {
    return await this.profileService.createProfile(createProfileDto);
  }

  @Get()
  async getMyProfiles(@User() user: JwtPayload) {
    return await this.profileService.getProfiles(user.userId);
  }

  @Get(':id')
  async getProfile(@Param('id') id: number) {
    return await this.profileService.getProfile(id);
  }
}
