import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDate,
  IsDateString,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class CreateProfilePayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsDateString()
  birthDate: Date;

  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
