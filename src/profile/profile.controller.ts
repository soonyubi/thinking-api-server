import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  ParseIntPipe,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('verify/send')
  @ApiOperation({
    summary: '이메일 인증 코드 발송',
    description: '사용자 이메일로 인증 코드를 발송합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '인증 코드 발송 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '인증 코드가 이메일로 발송되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async sendVerificationCode(@User() user: JwtPayload) {
    return await this.profileService.sendVerificationCode(user.email);
  }

  @Post()
  @ApiOperation({
    summary: '프로필 생성',
    description: '새로운 프로필을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '프로필 생성 성공',
    schema: {
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
        birthDate: {
          type: 'string',
          example: '1990-01-01',
        },
        userId: {
          type: 'number',
          example: 1,
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
    status: 409,
    description: '이미 존재하는 프로필',
  })
  async createProfile(
    @User() user: JwtPayload,
    @Body() createProfileDto: CreateProfilePayload,
  ) {
    return await this.profileService.createProfile(user, createProfileDto);
  }

  @Get()
  @ApiOperation({
    summary: '내 프로필 목록 조회',
    description: '현재 사용자의 모든 프로필을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 목록 조회 성공',
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
            example: '홍길동',
          },
          role: {
            type: 'string',
            example: 'STUDENT',
          },
          birthDate: {
            type: 'string',
            example: '1990-01-01',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getMyProfiles(@User() user: JwtPayload) {
    return await this.profileService.getProfiles(user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: '프로필 상세 조회',
    description: '특정 프로필의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    schema: {
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
        birthDate: {
          type: 'string',
          example: '1990-01-01',
        },
        userId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '프로필을 찾을 수 없음',
  })
  async getProfile(@Param('id', ParseIntPipe) id: number) {
    return await this.profileService.getProfile(id);
  }

  @Post('relationships')
  @Roles(Role.PARENT, Role.STUDENT)
  @ApiOperation({
    summary: '관계 등록',
    description: '학부모와 학생 간의 관계를 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '관계 등록 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '관계가 성공적으로 등록되었습니다.',
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
    description: '대상 사용자를 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '관련 프로필 조회',
    description:
      '학부모는 자녀들의 프로필을, 학생은 부모의 프로필을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '관련 프로필 조회 성공',
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
            example: '홍길동',
          },
          role: {
            type: 'string',
            example: 'STUDENT',
          },
          relationship: {
            type: 'string',
            example: 'CHILD',
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
