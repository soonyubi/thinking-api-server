import { IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberPayload {
  @ApiProperty({
    description: '추가할 멤버의 프로필 ID',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  profileId: number;

  @ApiProperty({
    description: '조직 내 역할',
    enum: OrganizationRole,
    example: OrganizationRole.STUDENT,
  })
  @IsEnum(OrganizationRole)
  roleInOrg: OrganizationRole;
}
