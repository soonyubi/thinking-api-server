import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationPayload {
  @ApiProperty({
    description: '조직명',
    example: '테스트 학교',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '조직 유형',
    example: 'school',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: '주 관리자 역할',
    enum: OrganizationRole,
    example: OrganizationRole.MAIN_ADMIN,
  })
  @IsEnum(OrganizationRole)
  mainAdminRole: OrganizationRole;
}
