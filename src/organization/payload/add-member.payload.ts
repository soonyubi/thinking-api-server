import { IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';

export class AddMemberPayload {
  @IsNumber()
  @IsNotEmpty()
  profileId: number;

  @IsEnum(OrganizationRole)
  roleInOrg: OrganizationRole;
}
