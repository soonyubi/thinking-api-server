import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const account = await this.authService.validateToken(token);
        (req as any).user = account;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    }
    next();
  }
}
