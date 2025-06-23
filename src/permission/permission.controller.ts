import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  GrantPermissionPayload,
  UpdatePermissionPayload,
} from './payload/permission.payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursePermission } from './enum/course-permission.enum';
import { User } from 'src/auth/decorators/user.decorator';
import { JwtPayload } from 'src/auth/interface/jwt-payload.interface';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Post('organizations/:organizationId')
  async grantPermission(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() grantPermissionDto: GrantPermissionPayload,
    @User() user: JwtPayload,
  ) {
    grantPermissionDto.organizationId = organizationId;
    return this.permissionService.grantPermission(
      grantPermissionDto,
      user.profileId,
    );
  }

  @Delete('organizations/:organizationId/profiles/:profileId')
  async revokePermission(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
    @Query('permission') permission: CoursePermission,
    @User() user: JwtPayload,
  ) {
    return this.permissionService.revokePermission(
      organizationId,
      profileId,
      permission,
      user.profileId,
    );
  }

  @Put(':id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionPayload,
    @Request() req: any,
  ) {
    return this.permissionService.updatePermission(
      id,
      updatePermissionDto,
      req.user.profileId,
    );
  }

  @Get('organizations/:organizationId')
  async getOrganizationPermissions(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ) {
    return this.permissionService.getOrganizationPermissions(organizationId);
  }

  @Get('profiles/:profileId')
  async getProfilePermissions(
    @Param('profileId', ParseIntPipe) profileId: number,
  ) {
    return this.permissionService.getProfilePermissions(profileId);
  }

  @Get('profiles/:profileId/organizations/:organizationId/active')
  async getActivePermissions(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ) {
    return this.permissionService.getActivePermissions(
      profileId,
      organizationId,
    );
  }

  @Get('check')
  async checkPermission(
    @Query('profileId', ParseIntPipe) profileId: number,
    @Query('organizationId', ParseIntPipe) organizationId: number,
    @Query('permission') permission: CoursePermission,
  ) {
    const hasPermission = await this.permissionService.checkPermission(
      profileId,
      organizationId,
      permission,
    );
    return { hasPermission, permission, organizationId, profileId };
  }

  @Get('organizations/:organizationId/history')
  async getPermissionHistory(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Query('profileId') profileId?: string,
  ) {
    const profileIdNumber = profileId ? parseInt(profileId) : undefined;
    return this.permissionService.getPermissionHistory(
      organizationId,
      profileIdNumber,
    );
  }

  @Get('expired')
  async getExpiredPermissions() {
    return this.permissionService.getExpiredPermissions();
  }
}
