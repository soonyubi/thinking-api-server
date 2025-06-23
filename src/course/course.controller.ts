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
  CreateCourseSessionPayload,
  UpdateCourseSessionPayload,
  CreateCourseClassPayload,
  UpdateCourseClassPayload,
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

  @Post(':courseId/sessions')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async createCourseSession(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() payload: CreateCourseSessionPayload,
  ) {
    return this.courseService.createCourseSession(courseId, payload);
  }

  @Get(':courseId/sessions')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async getCourseSessions(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.courseService.getCourseSessions(courseId);
  }

  @Put(':courseId/sessions/:sessionId')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async updateCourseSession(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() payload: UpdateCourseSessionPayload,
  ) {
    return this.courseService.updateCourseSession(sessionId, payload);
  }

  @Delete(':courseId/sessions/:sessionId')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async deleteCourseSession(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.courseService.deleteCourseSession(sessionId);
  }

  @Post(':courseId/sessions/:sessionId/classes')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async createCourseClass(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() payload: CreateCourseClassPayload,
  ) {
    return this.courseService.createCourseClass(sessionId, payload);
  }

  @Get(':courseId/sessions/:sessionId/classes')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async getCourseClasses(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.courseService.getCourseClasses(sessionId);
  }

  @Put(':courseId/sessions/:sessionId/classes/:classId')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async updateCourseClass(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('classId', ParseIntPipe) classId: number,
    @Body() payload: UpdateCourseClassPayload,
  ) {
    return this.courseService.updateCourseClass(classId, payload);
  }

  @Delete(':courseId/sessions/:sessionId/classes/:classId')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  async deleteCourseClass(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('classId', ParseIntPipe) classId: number,
  ) {
    return this.courseService.deleteCourseClass(classId);
  }

  @Post(':courseId/enrollments')
  @RequirePermission(CoursePermission.MANAGE_ENROLLMENTS)
  async createEnrollment(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body('profileId', ParseIntPipe) profileId: number,
  ) {
    return this.courseService.createEnrollment(courseId, profileId);
  }

  @Get(':courseId/enrollments')
  @RequirePermission(CoursePermission.MANAGE_ENROLLMENTS)
  async getEnrollments(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.courseService.getEnrollments(courseId);
  }

  @Delete(':courseId/enrollments/:profileId')
  @RequirePermission(CoursePermission.MANAGE_ENROLLMENTS)
  async deleteEnrollment(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
  ) {
    return this.courseService.deleteEnrollment(courseId, profileId);
  }
}
