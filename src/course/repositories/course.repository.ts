import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../db/schema';
import {
  CreateCoursePayload,
  UpdateCoursePayload,
  CourseResponse,
  CreateCourseSessionPayload,
  CourseSessionResponse,
  UpdateCourseSessionPayload,
  CreateCourseClassPayload,
  UpdateCourseClassPayload,
  CourseClassResponse,
} from '../payload/course.payload';
import {
  courseSessions,
  courseClasses,
  courseEnrollments,
} from '../../db/schema';

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

  async createSession(
    courseId: number,
    payload: CreateCourseSessionPayload,
  ): Promise<CourseSessionResponse> {
    const now = new Date();
    await this.db
      .insert(courseSessions)
      .values({
        courseId,
        sessionNumber: payload.sessionNumber,
        title: payload.title,
        description: payload.description,
        sessionDate: new Date(payload.sessionDate),
        startTime: payload.startTime,
        endTime: payload.endTime,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const [created] = await this.db
      .select()
      .from(courseSessions)
      .where(eq(courseSessions.courseId, courseId))
      .orderBy(desc(courseSessions.id))
      .limit(1);
    return {
      id: created.id,
      courseId: created.courseId,
      sessionNumber: created.sessionNumber,
      title: created.title,
      description: created.description,
      sessionDate:
        created.sessionDate instanceof Date
          ? created.sessionDate.toISOString().slice(0, 10)
          : created.sessionDate,
      startTime: created.startTime,
      endTime: created.endTime,
      createdAt:
        created.createdAt instanceof Date
          ? created.createdAt.toISOString()
          : created.createdAt,
      updatedAt:
        created.updatedAt instanceof Date
          ? created.updatedAt.toISOString()
          : created.updatedAt,
    };
  }

  async findSessionsByCourseId(
    courseId: number,
  ): Promise<CourseSessionResponse[]> {
    const sessions = await this.db
      .select()
      .from(courseSessions)
      .where(eq(courseSessions.courseId, courseId));
    return sessions.map((s) => ({
      id: s.id,
      courseId: s.courseId,
      sessionNumber: s.sessionNumber,
      title: s.title,
      description: s.description,
      sessionDate:
        s.sessionDate instanceof Date
          ? s.sessionDate.toISOString().slice(0, 10)
          : s.sessionDate,
      startTime: s.startTime,
      endTime: s.endTime,
      createdAt:
        s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      updatedAt:
        s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
    }));
  }

  async updateSession(
    sessionId: number,
    payload: UpdateCourseSessionPayload,
  ): Promise<CourseSessionResponse> {
    const now = new Date();
    await this.db
      .update(courseSessions)
      .set({
        ...payload,
        sessionDate: payload.sessionDate
          ? new Date(payload.sessionDate)
          : undefined,
        updatedAt: now,
      })
      .where(eq(courseSessions.id, sessionId));
    const [updated] = await this.db
      .select()
      .from(courseSessions)
      .where(eq(courseSessions.id, sessionId));
    return {
      id: updated.id,
      courseId: updated.courseId,
      sessionNumber: updated.sessionNumber,
      title: updated.title,
      description: updated.description,
      sessionDate:
        updated.sessionDate instanceof Date
          ? updated.sessionDate.toISOString().slice(0, 10)
          : updated.sessionDate,
      startTime: updated.startTime,
      endTime: updated.endTime,
      createdAt:
        updated.createdAt instanceof Date
          ? updated.createdAt.toISOString()
          : updated.createdAt,
      updatedAt:
        updated.updatedAt instanceof Date
          ? updated.updatedAt.toISOString()
          : updated.updatedAt,
    };
  }

  async deleteSession(sessionId: number): Promise<void> {
    await this.db
      .delete(courseSessions)
      .where(eq(courseSessions.id, sessionId));
  }

  async createClass(
    sessionId: number,
    payload: CreateCourseClassPayload,
  ): Promise<CourseClassResponse> {
    const now = new Date();
    await this.db
      .insert(courseClasses)
      .values({
        sessionId,
        className: payload.className,
        capacity: payload.capacity,
        location: payload.location,
        instructorProfileId: payload.instructorProfileId,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const [created] = await this.db
      .select()
      .from(courseClasses)
      .where(eq(courseClasses.sessionId, sessionId))
      .orderBy(desc(courseClasses.id))
      .limit(1);
    return {
      id: created.id,
      sessionId: created.sessionId,
      className: created.className,
      capacity: created.capacity,
      location: created.location,
      instructorProfileId: created.instructorProfileId,
      createdAt:
        created.createdAt instanceof Date
          ? created.createdAt.toISOString()
          : created.createdAt,
      updatedAt:
        created.updatedAt instanceof Date
          ? created.updatedAt.toISOString()
          : created.updatedAt,
    };
  }

  async findClassesBySessionId(
    sessionId: number,
  ): Promise<CourseClassResponse[]> {
    const classes = await this.db
      .select()
      .from(courseClasses)
      .where(eq(courseClasses.sessionId, sessionId));
    return classes.map((c) => ({
      id: c.id,
      sessionId: c.sessionId,
      className: c.className,
      capacity: c.capacity,
      location: c.location,
      instructorProfileId: c.instructorProfileId,
      createdAt:
        c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      updatedAt:
        c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    }));
  }

  async updateClass(
    classId: number,
    payload: UpdateCourseClassPayload,
  ): Promise<CourseClassResponse> {
    const now = new Date();
    await this.db
      .update(courseClasses)
      .set({
        ...payload,
        updatedAt: now,
      })
      .where(eq(courseClasses.id, classId));
    const [updated] = await this.db
      .select()
      .from(courseClasses)
      .where(eq(courseClasses.id, classId));
    return {
      id: updated.id,
      sessionId: updated.sessionId,
      className: updated.className,
      capacity: updated.capacity,
      location: updated.location,
      instructorProfileId: updated.instructorProfileId,
      createdAt:
        updated.createdAt instanceof Date
          ? updated.createdAt.toISOString()
          : updated.createdAt,
      updatedAt:
        updated.updatedAt instanceof Date
          ? updated.updatedAt.toISOString()
          : updated.updatedAt,
    };
  }

  async deleteClass(classId: number): Promise<void> {
    await this.db.delete(courseClasses).where(eq(courseClasses.id, classId));
  }

  async createEnrollment(courseId: number, profileId: number): Promise<void> {
    const now = new Date();
    await this.db
      .insert(courseEnrollments)
      .values({
        courseId,
        profileId,
        enrollmentDate: now,
        status: 'enrolled',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }

  async findEnrollmentsByCourseId(courseId: number): Promise<any[]> {
    const enrollments = await this.db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId));
    return enrollments.map((e) => ({
      id: e.id,
      courseId: e.courseId,
      profileId: e.profileId,
      enrollmentDate:
        e.enrollmentDate instanceof Date
          ? e.enrollmentDate.toISOString()
          : e.enrollmentDate,
      status: e.status,
      createdAt:
        e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
      updatedAt:
        e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
    }));
  }

  async deleteEnrollment(courseId: number, profileId: number): Promise<void> {
    await this.db
      .delete(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.profileId, profileId),
        ),
      );
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
