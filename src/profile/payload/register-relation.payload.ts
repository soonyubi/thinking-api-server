import { IsEmail, IsEnum } from 'class-validator';
import { RelationType } from 'src/common/enums/relation-type.enum';

export class RegisterRelationshipPayload {
  @IsEmail()
  targetUserEmail: string;

  @IsEnum(RelationType)
  relationType: RelationType;
}
