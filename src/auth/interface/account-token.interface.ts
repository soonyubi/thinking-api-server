import { Role } from 'src/common/enums/role.enum';

export interface AccountToken {
  id: number;
  email: string;
  role: Role;
}
