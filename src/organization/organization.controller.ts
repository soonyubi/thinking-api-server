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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(OrganizationPermissionInterceptor)
@ApiBearerAuth('JWT-auth')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({
    summary: '조직 생성',
    description: '새로운 조직을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '조직 생성 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: '테스트 학교',
        },
        type: {
          type: 'string',
          example: 'school',
        },
        mainAdminRole: {
          type: 'string',
          example: 'MAIN_ADMIN',
        },
        createdAt: {
          type: 'string',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
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
  @ApiOperation({
    summary: '조직 상세 조회',
    description: '특정 조직의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '조직 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: '테스트 학교',
        },
        type: {
          type: 'string',
          example: 'school',
        },
        mainAdminRole: {
          type: 'string',
          example: 'MAIN_ADMIN',
        },
        createdAt: {
          type: 'string',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '조직을 찾을 수 없음',
  })
  async getOrganization(@Param('id', ParseIntPipe) organizationId: number) {
    return await this.organizationService.getOrganizationById(organizationId);
  }

  @Get(':id/members')
  @OrganizationPermission([
    OrganizationRole.MAIN_ADMIN,
    OrganizationRole.SUB_ADMIN,
  ])
  @ApiOperation({
    summary: '조직 멤버 목록 조회',
    description: '조직의 모든 멤버를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '멤버 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          profileId: {
            type: 'number',
            example: 1,
          },
          roleInOrg: {
            type: 'string',
            example: 'STUDENT',
          },
          profile: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
              },
              name: {
                type: 'string',
                example: '홍길동',
              },
              role: {
                type: 'string',
                example: 'STUDENT',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
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
  @ApiOperation({
    summary: '역할별 조직 멤버 조회',
    description: '특정 역할을 가진 조직 멤버들을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'role',
    description: '조회할 역할',
    enum: OrganizationRole,
    example: OrganizationRole.STUDENT,
  })
  @ApiResponse({
    status: 200,
    description: '역할별 멤버 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          profileId: {
            type: 'number',
            example: 1,
          },
          roleInOrg: {
            type: 'string',
            example: 'STUDENT',
          },
          profile: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
              },
              name: {
                type: 'string',
                example: '홍길동',
              },
              role: {
                type: 'string',
                example: 'STUDENT',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
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
  @ApiOperation({
    summary: '조직 멤버 추가',
    description: '조직에 새로운 멤버를 추가합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: '멤버 추가 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '멤버가 성공적으로 추가되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '프로필을 찾을 수 없음',
  })
  @ApiResponse({
    status: 409,
    description: '이미 조직에 존재하는 멤버',
  })
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
  @ApiOperation({
    summary: '멤버 역할 변경',
    description: '조직 멤버의 역할을 변경합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'profileId',
    description: '프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '역할 변경 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '역할이 성공적으로 변경되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '멤버를 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '조직 멤버 제거',
    description: '조직에서 멤버를 제거합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'profileId',
    description: '프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '멤버 제거 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '멤버가 성공적으로 제거되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '멤버를 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '내 조직 목록 조회',
    description: '현재 사용자가 속한 모든 조직을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조직 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          name: {
            type: 'string',
            example: '테스트 학교',
          },
          type: {
            type: 'string',
            example: 'school',
          },
          roleInOrg: {
            type: 'string',
            example: 'STUDENT',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getMyOrganizations(@User() user: JwtPayload) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.getOrganizationsByProfile(
      user.profileId,
    );
  }

  @Get('my-admin-organizations')
  @ApiOperation({
    summary: '내 관리 조직 목록 조회',
    description: '현재 사용자가 주 관리자인 조직들을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '관리 조직 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          name: {
            type: 'string',
            example: '테스트 학교',
          },
          type: {
            type: 'string',
            example: 'school',
          },
          roleInOrg: {
            type: 'string',
            example: 'MAIN_ADMIN',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getMyAdminOrganizations(@User() user: JwtPayload) {
    if (!user.profileId) {
      throw new UnauthorizedException('Profile required for this operation');
    }

    return await this.organizationService.getOrganizationsByMainAdmin(
      user.profileId,
    );
  }
}
