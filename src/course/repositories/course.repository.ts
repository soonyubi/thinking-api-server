import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../db/schema';
import {
  CreateCoursePayload,
  UpdateCoursePayload,
  CourseResponse,
} from '../payload/course.payload';

@Injectable()
export class CourseRepository {
  constructor(
    @Inject('DB_PROD') private readonly db: MySql2Database<typeof schema>,
  ) {}

  async createCourse(
    createCoursePayload: CreateCoursePayload,
    organizationId: number,
  ): Promise<CourseResponse> {
    const [result] = await this.db.insert(schema.courses).values({
      organizationId,
      name: createCoursePayload.name,
      description: createCoursePayload.description,
      startDate: new Date(createCoursePayload.startDate),
      endDate: new Date(createCoursePayload.endDate),
      status: createCoursePayload.status || 'active',
    });

    return this.findById(result.insertId);
  }

  async findById(id: number): Promise<CourseResponse | null> {
    const result = await this.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToResponse(result[0]);
  }

  async findByOrganization(organizationId: number): Promise<CourseResponse[]> {
    const result = await this.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.organizationId, organizationId))
      .orderBy(desc(schema.courses.createdAt));

    return result.map((course) => this.mapToResponse(course));
  }

  async findEnrolledCourses(
    organizationId: number,
    profileId: number,
  ): Promise<CourseResponse[]> {
    const result = await this.db
      .select({
        id: schema.courses.id,
        organizationId: schema.courses.organizationId,
        name: schema.courses.name,
        description: schema.courses.description,
        startDate: schema.courses.startDate,
        endDate: schema.courses.endDate,
        status: schema.courses.status,
        createdAt: schema.courses.createdAt,
        updatedAt: schema.courses.updatedAt,
      })
      .from(schema.courses)
      .innerJoin(
        schema.courseEnrollments,
        eq(schema.courses.id, schema.courseEnrollments.courseId),
      )
      .where(
        and(
          eq(schema.courses.organizationId, organizationId),
          eq(schema.courseEnrollments.profileId, profileId),
          eq(schema.courseEnrollments.status, 'enrolled'),
        ),
      )
      .orderBy(desc(schema.courses.createdAt));

    return result.map((course) => this.mapToResponse(course));
  }

  async updateCourse(
    id: number,
    updateCoursePayload: UpdateCoursePayload,
  ): Promise<CourseResponse | null> {
    const updateData: any = {};
    if (updateCoursePayload.name !== undefined) {
      updateData.name = updateCoursePayload.name;
    }
    if (updateCoursePayload.description !== undefined) {
      updateData.description = updateCoursePayload.description;
    }
    if (updateCoursePayload.startDate !== undefined) {
      updateData.startDate = new Date(updateCoursePayload.startDate);
    }
    if (updateCoursePayload.endDate !== undefined) {
      updateData.endDate = new Date(updateCoursePayload.endDate);
    }
    if (updateCoursePayload.status !== undefined) {
      updateData.status = updateCoursePayload.status;
    }

    await this.db
      .update(schema.courses)
      .set(updateData)
      .where(eq(schema.courses.id, id));

    return this.findById(id);
  }

  async deleteCourse(id: number): Promise<void> {
    await this.db.delete(schema.courses).where(eq(schema.courses.id, id));
  }

  async getEnrollmentCount(courseId: number): Promise<number> {
    const result = await this.db
      .select({ count: schema.courseEnrollments.id })
      .from(schema.courseEnrollments)
      .where(
        and(
          eq(schema.courseEnrollments.courseId, courseId),
          eq(schema.courseEnrollments.status, 'enrolled'),
        ),
      );

    return result.length;
  }

  private mapToResponse(course: any): CourseResponse {
    return {
      id: course.id,
      organizationId: course.organizationId,
      name: course.name,
      description: course.description,
      startDate: course.startDate.toISOString().split('T')[0],
      endDate: course.endDate.toISOString().split('T')[0],
      status: course.status,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }
}
