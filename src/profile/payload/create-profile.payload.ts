import { IsNotEmpty, IsString, IsEnum, IsDateString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfilePayload {
  @ApiProperty({
    description: '프로필 이름',
    example: '홍길동',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: Role,
    example: Role.STUDENT,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: '생년월일 (YYYY-MM-DD 형식)',
    example: '1990-01-01',
    type: String,
  })
  @IsDateString()
  birthDate: Date;

  @ApiProperty({
    description: '이메일 인증 코드',
    example: '123456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
