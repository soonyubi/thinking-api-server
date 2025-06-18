import { IsNotEmpty, IsString, IsEnum, IsDate } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class CreateProfilePayload {
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsDate()
  birthDate: Date;
}
