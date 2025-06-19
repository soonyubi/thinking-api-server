import { IsEmail } from 'class-validator';

export class RegisterRelationshipPayload {
  @IsEmail()
  targetUserEmail: string;
}
