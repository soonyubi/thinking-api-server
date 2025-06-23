import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupPayload {
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호 (최소 6자)',
    example: 'password123',
    minLength: 6,
    type: String,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
