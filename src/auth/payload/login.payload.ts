import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginPayload {
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'password123',
    type: String,
  })
  @IsString()
  password: string;
}
