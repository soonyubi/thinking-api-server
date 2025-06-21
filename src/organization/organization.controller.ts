import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationPayload } from './payload/create-organization.payload';
import { AddMemberPayload } from './payload/add-member.payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { JwtPayload } from 'src/auth/interface/jwt-payload.interface';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';
import { OrganizationPermissionInterceptor } from './interceptors/organization-permission.interceptor';
import { OrganizationPermission } from './decorators/organization-permission.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(OrganizationPermissionInterceptor)
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  async createOrganization(
    @User() user: JwtPayload,
    @Body() createDto: CreateOrganizationPayload,
  ) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.createOrganization(
      createDto,
      user.profileId,
    );
  }

  @Get(':id')
  @OrganizationPermission([
    OrganizationRole.MAIN_ADMIN,
    OrganizationRole.SUB_ADMIN,
    OrganizationRole.STUDENT,
    OrganizationRole.PARENT,
  ])
  async getOrganization(@Param('id', ParseIntPipe) organizationId: number) {
    return await this.organizationService.getOrganizationById(organizationId);
  }

  @Get(':id/members')
  @OrganizationPermission([
    OrganizationRole.MAIN_ADMIN,
    OrganizationRole.SUB_ADMIN,
  ])
  async getOrganizationMembers(
    @Param('id', ParseIntPipe) organizationId: number,
  ) {
    return await this.organizationService.getOrganizationMembers(
      organizationId,
    );
  }

  @Get(':id/members/:role')
  @OrganizationPermission([
    OrganizationRole.MAIN_ADMIN,
    OrganizationRole.SUB_ADMIN,
  ])
  async getOrganizationMembersByRole(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('role') role: OrganizationRole,
  ) {
    return await this.organizationService.getOrganizationMembersByRole(
      organizationId,
      role,
    );
  }

  @Post(':id/members')
  @OrganizationPermission([
    OrganizationRole.MAIN_ADMIN,
    OrganizationRole.SUB_ADMIN,
  ])
  async addMember(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() addMemberDto: AddMemberPayload,
    @User() user: JwtPayload,
  ) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.addMember(
      organizationId,
      addMemberDto,
      user.profileId,
    );
  }

  @Put(':id/members/:profileId/role')
  @OrganizationPermission([OrganizationRole.MAIN_ADMIN])
  async updateMemberRole(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
    @Body('role') newRole: OrganizationRole,
    @User() user: JwtPayload,
  ) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.updateMemberRole(
      organizationId,
      profileId,
      newRole,
      user.profileId,
    );
  }

  @Delete(':id/members/:profileId')
  @OrganizationPermission([OrganizationRole.MAIN_ADMIN])
  async removeMember(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
    @User() user: JwtPayload,
  ) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.removeMember(
      organizationId,
      profileId,
      user.profileId,
    );
  }

  @Get('my-organizations')
  async getMyOrganizations(@User() user: JwtPayload) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.getOrganizationsByProfile(
      user.profileId,
    );
  }

  @Get('my-admin-organizations')
  async getMyAdminOrganizations(@User() user: JwtPayload) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.getOrganizationsByMainAdmin(
      user.profileId,
    );
  }
}
