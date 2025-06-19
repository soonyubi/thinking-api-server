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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupPayload) {
    return await this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginPayload) {
    return await this.authService.login(loginDto);
  }

  @Post('select-profile/:profileId')
  @UseGuards(JwtAuthGuard)
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
