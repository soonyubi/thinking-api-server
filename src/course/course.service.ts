import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CourseRepository } from './repositories/course.repository';
import {
  CreateCoursePayload,
  UpdateCoursePayload,
  CourseResponse,
  CourseDetailResponse,
  CreateCourseSessionPayload,
  CourseSessionResponse,
  UpdateCourseSessionPayload,
  CreateCourseClassPayload,
  UpdateCourseClassPayload,
  CourseClassResponse,
} from './payload/course.payload';
import { PermissionService } from 'src/permission/permission.service';
import { CoursePermission } from 'src/permission/enum/course-permission.enum';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async createCourse(
    createCoursePayload: CreateCoursePayload,
    organizationId: number,
  ): Promise<CourseResponse> {
    return this.courseRepository.createCourse(
      createCoursePayload,
      organizationId,
    );
  }

  async getCourses(
    organizationId: number,
    profileId: number,
  ): Promise<CourseResponse[]> {
    const hasViewPermission = await this.checkViewPermission(
      profileId,
      organizationId,
    );

    if (hasViewPermission) {
      return this.courseRepository.findByOrganization(organizationId);
    } else {
      return this.courseRepository.findEnrolledCourses(
        organizationId,
        profileId,
      );
    }
  }

  async getCourseById(
    courseId: number,
    organizationId: number,
    profileId: number,
  ): Promise<CourseResponse> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('수업을 찾을 수 없습니다.');
    }

    if (course.organizationId !== organizationId) {
      throw new ForbiddenException('해당 조직의 수업이 아닙니다.');
    }

    const hasViewPermission = await this.checkViewPermission(
      profileId,
      organizationId,
    );

    if (!hasViewPermission) {
      const enrolledCourses = await this.courseRepository.findEnrolledCourses(
        organizationId,
        profileId,
      );
      const isEnrolled = enrolledCourses.some((c) => c.id === courseId);
      if (!isEnrolled) {
        throw new ForbiddenException('수강 신청한 수업이 아닙니다.');
      }
    }

    return course;
  }

  async updateCourse(
    courseId: number,
    updateCoursePayload: UpdateCoursePayload,
    organizationId: number,
  ): Promise<CourseResponse> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('수업을 찾을 수 없습니다.');
    }

    if (course.organizationId !== organizationId) {
      throw new ForbiddenException('해당 조직의 수업이 아닙니다.');
    }

    const updatedCourse = await this.courseRepository.updateCourse(
      courseId,
      updateCoursePayload,
    );
    if (!updatedCourse) {
      throw new NotFoundException('수업을 찾을 수 없습니다.');
    }

    return updatedCourse;
  }

  async deleteCourse(courseId: number, organizationId: number): Promise<void> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('수업을 찾을 수 없습니다.');
    }

    if (course.organizationId !== organizationId) {
      throw new ForbiddenException('해당 조직의 수업이 아닙니다.');
    }

    await this.courseRepository.deleteCourse(courseId);
  }

  async getCourseDetail(
    courseId: number,
    organizationId: number,
    profileId: number,
  ): Promise<CourseDetailResponse> {
    const course = await this.getCourseById(
      courseId,
      organizationId,
      profileId,
    );
    const enrollmentCount =
      await this.courseRepository.getEnrollmentCount(courseId);

    return {
      ...course,
      sessions: [],
      enrollmentCount,
    };
  }

  async createCourseSession(
    courseId: number,
    payload: CreateCourseSessionPayload,
  ): Promise<CourseSessionResponse> {
    return this.courseRepository.createSession(courseId, payload);
  }

  async getCourseSessions(courseId: number): Promise<CourseSessionResponse[]> {
    return this.courseRepository.findSessionsByCourseId(courseId);
  }

  async updateCourseSession(
    sessionId: number,
    payload: UpdateCourseSessionPayload,
  ): Promise<CourseSessionResponse> {
    return this.courseRepository.updateSession(sessionId, payload);
  }

  async deleteCourseSession(sessionId: number): Promise<{ message: string }> {
    await this.courseRepository.deleteSession(sessionId);
    return { message: '회차가 삭제되었습니다.' };
  }

  async createCourseClass(
    sessionId: number,
    payload: CreateCourseClassPayload,
  ): Promise<CourseClassResponse> {
    return this.courseRepository.createClass(sessionId, payload);
  }

  async getCourseClasses(sessionId: number): Promise<CourseClassResponse[]> {
    return this.courseRepository.findClassesBySessionId(sessionId);
  }

  async updateCourseClass(
    classId: number,
    payload: UpdateCourseClassPayload,
  ): Promise<CourseClassResponse> {
    return this.courseRepository.updateClass(classId, payload);
  }

  async deleteCourseClass(classId: number): Promise<{ message: string }> {
    await this.courseRepository.deleteClass(classId);
    return { message: '분반이 삭제되었습니다.' };
  }

  async createEnrollment(
    courseId: number,
    profileId: number,
  ): Promise<{ message: string }> {
    await this.courseRepository.createEnrollment(courseId, profileId);
    return { message: '수강신청이 완료되었습니다.' };
  }

  async getEnrollments(courseId: number): Promise<any[]> {
    return this.courseRepository.findEnrollmentsByCourseId(courseId);
  }

  async deleteEnrollment(
    courseId: number,
    profileId: number,
  ): Promise<{ message: string }> {
    await this.courseRepository.deleteEnrollment(courseId, profileId);
    return { message: '수강신청이 취소되었습니다.' };
  }

  private async checkViewPermission(
    profileId: number,
    organizationId: number,
  ): Promise<boolean> {
    return this.permissionService.checkPermission(
      profileId,
      organizationId,
      CoursePermission.VIEW_COURSE_DETAILS,
    );
  }
}
