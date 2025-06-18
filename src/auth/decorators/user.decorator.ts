import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload } from '../interface/jwt-payload.interface';

export const User = createParamDecorator(
  (
    data: { required?: boolean } = { required: true },
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data.required && !user) {
      throw new UnauthorizedException('Authentication required');
    }

    return user as JwtPayload;
  },
);
