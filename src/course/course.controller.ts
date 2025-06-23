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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('courses')
@Controller('organizations/:organizationId/courses')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @RequirePermission(CoursePermission.CREATE_COURSE)
  @ApiOperation({
    summary: '수업 생성',
    description: '새로운 수업을 생성합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: '수업 생성 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: '수학 기초',
        },
        description: {
          type: 'string',
          example: '기초 수학 과정',
        },
        startDate: {
          type: 'string',
          example: '2024-01-01',
        },
        endDate: {
          type: 'string',
          example: '2024-12-31',
        },
        status: {
          type: 'string',
          example: 'active',
        },
        organizationId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async createCourse(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() createCoursePayload: CreateCoursePayload,
  ) {
    return this.courseService.createCourse(createCoursePayload, organizationId);
  }

  @Get()
  @ApiOperation({
    summary: '수업 목록 조회',
    description: '조직의 모든 수업을 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '수업 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          name: {
            type: 'string',
            example: '수학 기초',
          },
          description: {
            type: 'string',
            example: '기초 수학 과정',
          },
          startDate: {
            type: 'string',
            example: '2024-01-01',
          },
          endDate: {
            type: 'string',
            example: '2024-12-31',
          },
          status: {
            type: 'string',
            example: 'active',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getCourses(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @User() user: JwtPayload,
  ) {
    return this.courseService.getCourses(organizationId, user.profileId);
  }

  @Get(':courseId')
  @ApiOperation({
    summary: '수업 상세 조회',
    description: '특정 수업의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '수업 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: '수학 기초',
        },
        description: {
          type: 'string',
          example: '기초 수학 과정',
        },
        startDate: {
          type: 'string',
          example: '2024-01-01',
        },
        endDate: {
          type: 'string',
          example: '2024-12-31',
        },
        status: {
          type: 'string',
          example: 'active',
        },
        organizationId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '수업을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '수업 수정',
    description: '기존 수업 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '수업 수정 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: '수학 기초 (수정됨)',
        },
        description: {
          type: 'string',
          example: '기초 수학 과정 - 수정된 설명',
        },
        startDate: {
          type: 'string',
          example: '2024-01-01',
        },
        endDate: {
          type: 'string',
          example: '2024-12-31',
        },
        status: {
          type: 'string',
          example: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '수업을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '수업 삭제',
    description: '수업을 삭제합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '수업 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '수업이 삭제되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '수업을 찾을 수 없음',
  })
  async deleteCourse(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    await this.courseService.deleteCourse(courseId, organizationId);
    return { message: '수업이 삭제되었습니다.' };
  }

  @Get(':courseId/detail')
  @ApiOperation({
    summary: '수업 상세 정보 조회',
    description: '수업의 상세 정보와 회차, 수강생 수를 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '수업 상세 정보 조회 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: '수학 기초',
        },
        description: {
          type: 'string',
          example: '기초 수학 과정',
        },
        startDate: {
          type: 'string',
          example: '2024-01-01',
        },
        endDate: {
          type: 'string',
          example: '2024-12-31',
        },
        status: {
          type: 'string',
          example: 'active',
        },
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
              },
              sessionNumber: {
                type: 'number',
                example: 1,
              },
              title: {
                type: 'string',
                example: '1차시 - 수의 개념',
              },
            },
          },
        },
        enrollmentCount: {
          type: 'number',
          example: 15,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '수업을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '회차 생성',
    description: '수업에 새로운 회차를 생성합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: '회차 생성 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        sessionNumber: {
          type: 'number',
          example: 1,
        },
        title: {
          type: 'string',
          example: '1차시 - 수의 개념',
        },
        description: {
          type: 'string',
          example: '기본적인 수의 개념을 배웁니다',
        },
        sessionDate: {
          type: 'string',
          example: '2024-01-15',
        },
        startTime: {
          type: 'string',
          example: '09:00',
        },
        endTime: {
          type: 'string',
          example: '10:30',
        },
        courseId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '수업을 찾을 수 없음',
  })
  async createCourseSession(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() payload: CreateCourseSessionPayload,
  ) {
    return this.courseService.createCourseSession(courseId, payload);
  }

  @Get(':courseId/sessions')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  @ApiOperation({
    summary: '회차 목록 조회',
    description: '수업의 모든 회차를 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '회차 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          sessionNumber: {
            type: 'number',
            example: 1,
          },
          title: {
            type: 'string',
            example: '1차시 - 수의 개념',
          },
          description: {
            type: 'string',
            example: '기본적인 수의 개념을 배웁니다',
          },
          sessionDate: {
            type: 'string',
            example: '2024-01-15',
          },
          startTime: {
            type: 'string',
            example: '09:00',
          },
          endTime: {
            type: 'string',
            example: '10:30',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getCourseSessions(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.courseService.getCourseSessions(courseId);
  }

  @Put(':courseId/sessions/:sessionId')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  @ApiOperation({
    summary: '회차 수정',
    description: '기존 회차 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    description: '회차 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '회차 수정 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        sessionNumber: {
          type: 'number',
          example: 1,
        },
        title: {
          type: 'string',
          example: '1차시 - 수의 개념 (수정됨)',
        },
        description: {
          type: 'string',
          example: '기본적인 수의 개념을 배웁니다 - 수정됨',
        },
        sessionDate: {
          type: 'string',
          example: '2024-01-15',
        },
        startTime: {
          type: 'string',
          example: '09:00',
        },
        endTime: {
          type: 'string',
          example: '10:30',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '회차를 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '회차 삭제',
    description: '회차를 삭제합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    description: '회차 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '회차 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '회차가 삭제되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '회차를 찾을 수 없음',
  })
  async deleteCourseSession(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.courseService.deleteCourseSession(sessionId);
  }

  @Post(':courseId/sessions/:sessionId/classes')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  @ApiOperation({
    summary: '분반 생성',
    description: '회차에 새로운 분반을 생성합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    description: '회차 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: '분반 생성 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        className: {
          type: 'string',
          example: 'A반',
        },
        capacity: {
          type: 'number',
          example: 20,
        },
        location: {
          type: 'string',
          example: '101호',
        },
        instructorProfileId: {
          type: 'number',
          example: 1,
        },
        sessionId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '회차를 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '분반 목록 조회',
    description: '회차의 모든 분반을 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    description: '회차 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '분반 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          className: {
            type: 'string',
            example: 'A반',
          },
          capacity: {
            type: 'number',
            example: 20,
          },
          location: {
            type: 'string',
            example: '101호',
          },
          instructorProfileId: {
            type: 'number',
            example: 1,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getCourseClasses(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.courseService.getCourseClasses(sessionId);
  }

  @Put(':courseId/sessions/:sessionId/classes/:classId')
  @RequirePermission(CoursePermission.MANAGE_SESSIONS)
  @ApiOperation({
    summary: '분반 수정',
    description: '기존 분반 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    description: '회차 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'classId',
    description: '분반 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '분반 수정 성공',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        className: {
          type: 'string',
          example: 'A반 (수정됨)',
        },
        capacity: {
          type: 'number',
          example: 25,
        },
        location: {
          type: 'string',
          example: '102호',
        },
        instructorProfileId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '분반을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '분반 삭제',
    description: '분반을 삭제합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    description: '회차 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'classId',
    description: '분반 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '분반 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '분반이 삭제되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '분반을 찾을 수 없음',
  })
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
  @ApiOperation({
    summary: '수강신청',
    description: '수업에 수강신청합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: '수강신청 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '수강신청이 완료되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '수업 또는 프로필을 찾을 수 없음',
  })
  @ApiResponse({
    status: 409,
    description: '이미 수강신청된 수업',
  })
  async createEnrollment(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body('profileId', ParseIntPipe) profileId: number,
  ) {
    return this.courseService.createEnrollment(courseId, profileId);
  }

  @Get(':courseId/enrollments')
  @RequirePermission(CoursePermission.MANAGE_ENROLLMENTS)
  @ApiOperation({
    summary: '수강신청 목록 조회',
    description: '수업의 모든 수강신청을 조회합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '수강신청 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          courseId: {
            type: 'number',
            example: 1,
          },
          profileId: {
            type: 'number',
            example: 1,
          },
          enrolledAt: {
            type: 'string',
            example: '2024-01-01T00:00:00.000Z',
          },
          profile: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
              },
              name: {
                type: 'string',
                example: '홍길동',
              },
              role: {
                type: 'string',
                example: 'STUDENT',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getEnrollments(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.courseService.getEnrollments(courseId);
  }

  @Delete(':courseId/enrollments/:profileId')
  @RequirePermission(CoursePermission.MANAGE_ENROLLMENTS)
  @ApiOperation({
    summary: '수강신청 취소',
    description: '수강신청을 취소합니다.',
  })
  @ApiParam({
    name: 'organizationId',
    description: '조직 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'courseId',
    description: '수업 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'profileId',
    description: '프로필 ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '수강신청 취소 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '수강신청이 취소되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  @ApiResponse({
    status: 404,
    description: '수강신청을 찾을 수 없음',
  })
  async deleteEnrollment(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('profileId', ParseIntPipe) profileId: number,
  ) {
    return this.courseService.deleteEnrollment(courseId, profileId);
  }
}
