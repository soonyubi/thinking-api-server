import { Module } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseRepository } from './repositories/course.repository';
import { PermissionModule } from '../permission/permission.module';
import { PermissionService } from '../permission/permission.service';

@Module({
  imports: [PermissionModule],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository, PermissionService],
  exports: [CourseService],
})
export class CourseModule {}
