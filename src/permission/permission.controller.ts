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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Post('organizations/:organizationId')
  @ApiOperation({
    summary: '권한 부여',
    description: '조직 내 특정 프로필에 권한을 부여합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: '권한 부여 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        organizationId: {
          type: 'number',
          example: 1,
        },
        profileId: {
          type: 'number',
          example: 1,
        },
        permission: {
          type: 'string',
          example: 'CREATE_COURSE',
        },
        grantedByProfileId: {
          type: 'number',
          example: 1,
        },
        createdAt: {
          type: 'string',
          example: '2024-01-01T00:00:00.000Z',
        },
        expiresAt: {
          type: 'string',
          example: '2024-12-31T00:00:00.000Z',
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
    description: '조직 또는 프로필을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '권한 취소',
    description: '조직 내 특정 프로필의 권한을 취소합니다.',
  })
  @ApiParam({
    name: 'organizationId',
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
  @ApiQuery({
    name: 'permission',
    description: '취소할 권한',
    enum: CoursePermission,
    example: CoursePermission.CREATE_COURSE,
  })
  @ApiResponse({
    status: 200,
    description: '권한 취소 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '권한이 성공적으로 취소되었습니다.',
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
    description: '권한을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '권한 수정',
    description: '기존 권한 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '권한 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '권한 수정 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        organizationId: {
          type: 'number',
          example: 1,
        },
        profileId: {
          type: 'number',
          example: 1,
        },
        permission: {
          type: 'string',
          example: 'CREATE_COURSE',
        },
        expiresAt: {
          type: 'string',
          example: '2024-12-31T00:00:00.000Z',
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
    description: '권한을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '조직 권한 목록 조회',
    description: '조직의 모든 권한을 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '조직 권한 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          organizationId: {
            type: 'number',
            example: 1,
          },
          profileId: {
            type: 'number',
            example: 1,
          },
          permission: {
            type: 'string',
            example: 'CREATE_COURSE',
          },
          grantedByProfileId: {
            type: 'number',
            example: 1,
          },
          createdAt: {
            type: 'string',
            example: '2024-01-01T00:00:00.000Z',
          },
          expiresAt: {
            type: 'string',
            example: '2024-12-31T00:00:00.000Z',
          },
          organization: {
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
            },
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
  async getOrganizationPermissions(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ) {
    return this.permissionService.getOrganizationPermissions(organizationId);
  }

  @Get('profiles/:profileId')
  @ApiOperation({
    summary: '프로필 권한 목록 조회',
    description: '특정 프로필의 모든 권한을 조회합니다.',
  })
  @ApiParam({
    name: 'profileId',
    description: '프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '프로필 권한 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          organizationId: {
            type: 'number',
            example: 1,
          },
          profileId: {
            type: 'number',
            example: 1,
          },
          permission: {
            type: 'string',
            example: 'CREATE_COURSE',
          },
          grantedByProfileId: {
            type: 'number',
            example: 1,
          },
          createdAt: {
            type: 'string',
            example: '2024-01-01T00:00:00.000Z',
          },
          expiresAt: {
            type: 'string',
            example: '2024-12-31T00:00:00.000Z',
          },
          organization: {
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
  async getProfilePermissions(
    @Param('profileId', ParseIntPipe) profileId: number,
  ) {
    return this.permissionService.getProfilePermissions(profileId);
  }

  @Get('profiles/:profileId/organizations/:organizationId/active')
  @ApiOperation({
    summary: '활성 권한 조회',
    description: '특정 프로필의 특정 조직에서 활성화된 권한을 조회합니다.',
  })
  @ApiParam({
    name: 'profileId',
    description: '프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '활성 권한 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          organizationId: {
            type: 'number',
            example: 1,
          },
          profileId: {
            type: 'number',
            example: 1,
          },
          permission: {
            type: 'string',
            example: 'CREATE_COURSE',
          },
          grantedByProfileId: {
            type: 'number',
            example: 1,
          },
          createdAt: {
            type: 'string',
            example: '2024-01-01T00:00:00.000Z',
          },
          expiresAt: {
            type: 'string',
            example: '2024-12-31T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
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
  @ApiOperation({
    summary: '권한 확인',
    description:
      '특정 프로필이 특정 조직에서 특정 권한을 가지고 있는지 확인합니다.',
  })
  @ApiQuery({
    name: 'profileId',
    description: '프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'permission',
    description: '확인할 권한',
    enum: CoursePermission,
    example: CoursePermission.CREATE_COURSE,
  })
  @ApiResponse({
    status: 200,
    description: '권한 확인 성공',
    schema: {
      type: 'object',
      properties: {
        hasPermission: {
          type: 'boolean',
          example: true,
        },
        permission: {
          type: 'string',
          example: 'CREATE_COURSE',
        },
        organizationId: {
          type: 'number',
          example: 1,
        },
        profileId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
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
  @ApiOperation({
    summary: '권한 이력 조회',
    description: '조직의 권한 부여 이력을 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'profileId',
    description: '프로필 ID (선택사항)',
    required: false,
    type: 'string',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: '권한 이력 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          organizationId: {
            type: 'number',
            example: 1,
          },
          profileId: {
            type: 'number',
            example: 1,
          },
          permission: {
            type: 'string',
            example: 'CREATE_COURSE',
          },
          grantedByProfileId: {
            type: 'number',
            example: 1,
          },
          createdAt: {
            type: 'string',
            example: '2024-01-01T00:00:00.000Z',
          },
          expiresAt: {
            type: 'string',
            example: '2024-12-31T00:00:00.000Z',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          organization: {
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
            },
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
            },
          },
          grantedBy: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
              },
              name: {
                type: 'string',
                example: '관리자',
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
  @ApiOperation({
    summary: '만료된 권한 조회',
    description: '만료된 모든 권한을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '만료된 권한 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          organizationId: {
            type: 'number',
            example: 1,
          },
          profileId: {
            type: 'number',
            example: 1,
          },
          permission: {
            type: 'string',
            example: 'CREATE_COURSE',
          },
          expiresAt: {
            type: 'string',
            example: '2023-12-31T00:00:00.000Z',
          },
          organization: {
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
            },
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
  async getExpiredPermissions() {
    return this.permissionService.getExpiredPermissions();
  }
}
