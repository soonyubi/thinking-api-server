import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CourseService } from './course.service';
import {
  CreateCoursePayload,
  UpdateCoursePayload,
} from './payload/course.payload';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../permission/decorators/permission.decorator';
import { CoursePermission } from '../permission/enum/course-permission.enum';
import { PermissionGuard } from '../permission/guards/permission.guard';
import { User } from '../auth/decorators/user.decorator';
import { JwtPayload } from '../auth/interface/jwt-payload.interface';

@Controller('organizations/:organizationId/courses')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @RequirePermission(CoursePermission.CREATE_COURSE)
  async createCourse(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() createCoursePayload: CreateCoursePayload,
  ) {
    return this.courseService.createCourse(createCoursePayload, organizationId);
  }

  @Get()
  async getCourses(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @User() user: JwtPayload,
  ) {
    return this.courseService.getCourses(organizationId, user.profileId);
  }

  @Get(':courseId')
  async getCourseById(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @User() user: JwtPayload,
  ) {
    return this.courseService.getCourseById(
      courseId,
      organizationId,
      user.profileId,
    );
  }

  @Put(':courseId')
  @RequirePermission(CoursePermission.UPDATE_COURSE)
  async updateCourse(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() updateCoursePayload: UpdateCoursePayload,
  ) {
    return this.courseService.updateCourse(
      courseId,
      updateCoursePayload,
      organizationId,
    );
  }

  @Delete(':courseId')
  @RequirePermission(CoursePermission.DELETE_COURSE)
  async deleteCourse(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    await this.courseService.deleteCourse(courseId, organizationId);
    return { message: '수업이 삭제되었습니다.' };
  }

  @Get(':courseId/detail')
  async getCourseDetail(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @User() user: JwtPayload,
  ) {
    return this.courseService.getCourseDetail(
      courseId,
      organizationId,
      user.profileId,
    );
  }
}
