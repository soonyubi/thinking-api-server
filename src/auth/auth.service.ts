import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { SignupPayload } from './payload/signup.payload';
import { LoginPayload } from './payload/login.payload';
import * as bcrypt from 'bcrypt';
import { AccountToken } from './interface/account-token.interface';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
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

  async validateToken(token: string): Promise<AccountToken> {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.authRepository.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }
      return {
        id: user.id,
        email: user.email,
        role: Role.STUDENT, // TODO: PROFILE 기능 추가 후 수정
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
