import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './repositories/organization.repository';
import { OrganizationPermissionInterceptor } from './interceptors/organization-permission.interceptor';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PermissionModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    OrganizationRepository,
    OrganizationPermissionInterceptor,
  ],
  exports: [OrganizationService, OrganizationRepository],
})
export class OrganizationModule {}
