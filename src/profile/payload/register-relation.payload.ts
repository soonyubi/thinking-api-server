import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRelationshipPayload {
  @ApiProperty({
    description: '관계를 등록할 대상 사용자의 이메일',
    example: 'student@example.com',
    type: String,
  })
  @IsEmail()
  targetUserEmail: string;
}
