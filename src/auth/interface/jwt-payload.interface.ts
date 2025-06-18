import { Role } from 'src/common/enums/role.enum';

export interface JwtPayload {
  userId: number;
  email: string;
  role?: Role;
  profileId?: number;
}
