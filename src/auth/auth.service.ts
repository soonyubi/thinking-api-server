import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './repositories/auth.repository';
import { SignupPayload } from './payload/signup.payload';
import { LoginPayload } from './payload/login.payload';
import * as bcrypt from 'bcrypt';
import { AccountToken } from './interface/account-token.interface';
import { Role } from 'src/common/enums/role.enum';
import { ProfileRepository } from 'src/profile/repositories/profile.repository';
import { JwtPayload } from './interface/jwt-payload.interface';
import { UserSessionRepository } from './repositories/user-session.repository';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private profileRepository: ProfileRepository,
    private userSessionRepository: UserSessionRepository,
  ) {}

  async signup(signupDto: SignupPayload) {
    const { email, password } = signupDto;

    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.authRepository.createUser({
      email,
      passwordHash,
    });

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginPayload) {
    const { email, password } = loginDto;

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const profile = await this.profileRepository.findByUserId(user.id);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      profileId: profile?.id,
      role: profile?.role as Role,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: profile
          ? {
              id: profile.id,
              role: profile.role,
              name: profile.name,
            }
          : null,
      },
    };
  }

  async validateToken(token: string): Promise<AccountToken> {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.authRepository.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const userSession = await this.userSessionRepository.findByUserId(
        user.id,
      );
      let activeProfile = null;

      if (userSession?.lastProfileId) {
        activeProfile = await this.profileRepository.findById(
          userSession.lastProfileId,
        );
      }

      return {
        id: user.id,
        email: user.email,
        role: activeProfile?.role as Role,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  async selectProfile(userId: number, profileId: number) {
    const profile = await this.profileRepository.findById(profileId);
    if (!profile || profile.id !== profileId) {
      throw new NotFoundException('Profile not found');
    }

    await this.userSessionRepository.upsert(userId, profileId);

    const user = await this.authRepository.findById(userId);
    const newToken = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      profileId: profile.id,
      role: profile.role as Role,
    });

    return {
      token: newToken,
      profile: {
        id: profile.id,
        role: profile.role,
        name: profile.name,
      },
    };
  }
}
