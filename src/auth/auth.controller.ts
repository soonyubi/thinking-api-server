import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupPayload } from './payload/signup.payload';
import { LoginPayload } from './payload/login.payload';

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
}
