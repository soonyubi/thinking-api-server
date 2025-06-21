import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';

export class CreateOrganizationPayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsEnum(OrganizationRole)
  mainAdminRole: OrganizationRole;
}
