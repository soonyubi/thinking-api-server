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
} from './payload/course.payload';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

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
    const hasViewPermission = await this.checkViewPermission();

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

    const hasViewPermission = await this.checkViewPermission();

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

  private async checkViewPermission(): Promise<boolean> {
    // 이 메서드는 나중에 PermissionService를 주입받아서 구현
    // 현재는 임시로 false 반환 (수강 신청한 수업만 조회 가능)
    return false;
  }
}
