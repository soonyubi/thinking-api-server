import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupPayload } from './payload/signup.payload';
import { LoginPayload } from './payload/login.payload';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './interface/jwt-payload.interface';
import { User } from './decorators/user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: '회원가입',
    description: '새로운 사용자 계정을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '회원가입이 완료되었습니다.',
        },
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 409,
    description: '이미 존재하는 이메일',
  })
  async signup(@Body() signupDto: SignupPayload) {
    return await this.authService.signup(signupDto);
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '사용자 인증을 통해 JWT 토큰을 발급받습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '로그인이 완료되었습니다.',
        },
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
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
  async login(@Body() loginDto: LoginPayload) {
    return await this.authService.login(loginDto);
  }

  @Post('select-profile/:profileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '프로필 선택',
    description:
      '사용자가 특정 프로필을 선택하여 해당 프로필의 토큰을 발급받습니다.',
  })
  @ApiParam({
    name: 'profileId',
    description: '선택할 프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '프로필 선택 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '프로필이 선택되었습니다.',
        },
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
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
    description: '프로필 접근 권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '프로필을 찾을 수 없음',
  })
  async selectProfile(
    @User() user: JwtPayload,
    @Param('profileId', ParseIntPipe) profileId: number,
  ) {
    if (user.profileId === profileId) {
      return;
    }
    return await this.authService.selectProfile(user.userId, profileId);
  }
}
