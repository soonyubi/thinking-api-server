import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ProfileModule } from 'src/profile/profile.module';
import { UserSessionRepository } from './repositories/user-session.repository';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ProfileModule,
  ],
  providers: [AuthService, AuthRepository, JwtStrategy, UserSessionRepository],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
