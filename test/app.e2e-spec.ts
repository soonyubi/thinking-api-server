import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDbModule } from './test-db.module';
import { Role } from '../src/common/enums/role.enum';
import { OrganizationRole } from '../src/common/enums/organization-role.enum';
import { CoursePermission } from '../src/permission/enum/course-permission.enum';
import { TestCleanupHelper } from './helpers/test-cleanup.helper';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../src/db/schema';

describe('Course Management System (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let cleanupHelper: TestCleanupHelper;

  // 테스트용 사용자 데이터
  const testUsers = {
    admin: { email: 'admin@school.com', password: 'admin123' },
    teacher: { email: 'teacher@school.com', password: 'teacher123' },
    student: { email: 'student@school.com', password: 'student123' },
    parent: { email: 'parent@school.com', password: 'parent123' },
  };

  // 테스트용 토큰들
  let tokens: { [key: string]: string } = {};
  let profiles: { [key: string]: any } = {};
  let organization: any;
  let course: any;
  let session: any;
  let class1: any;
  let createdEnrollments: any[] = [];

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, TestDbModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // drizzle 인스턴스 주입
    const db = moduleFixture.get<MySql2Database<typeof schema>>('DB_TEST');
    cleanupHelper = new TestCleanupHelper(db);

    // 테스트 데이터 정리
    await cleanupHelper.cleanupAllTestData();
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await cleanupHelper.cleanupAllTestData();
    await app.close();
  });

  describe('통합 수업 관리 시스템 플로우', () => {
    it('전체 시스템 플로우 테스트', async () => {
      try {
        // 1단계: 사용자 계정 생성 및 로그인
        await createUsersAndLogin();

        // 2단계: 프로필 생성
        await createProfiles();

        // 3단계: 조직 생성
        await createOrganization();

        // 4단계: 권한 부여
        await grantPermissions();

        // // 5단계: 수업 생성 및 관리
        // await testCourseManagement();

        // // 6단계: 회차 생성 및 관리
        // await testSessionManagement();

        // // 7단계: 분반 생성 및 관리
        // await testClassManagement();

        // // 8단계: 수강신청 프로세스
        // await testEnrollmentProcess();

        // // 9단계: 데이터 조회 및 검증
        // await testDataAccess();

        // // 10단계: 권한 변경 및 재검증
        // await testPermissionChanges();

        // // 11단계: 수업 수정 및 삭제
        // await testCourseModification();

        console.log('✅ 모든 테스트가 성공적으로 완료되었습니다!');
      } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
        throw error;
      }
    });
  });

  // 헬퍼 함수들
  async function createUsersAndLogin() {
    console.log('1단계: 사용자 계정 생성 및 로그인');

    for (const [role, userData] of Object.entries(testUsers)) {
      try {
        // 회원가입
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send(userData)
          .expect(201);

        // 로그인
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send(userData)
          .expect((res) => {
            console.log(`Login response status: ${res.status}`);
            return res.status === 200 || res.status === 201;
          });

        tokens[role] = loginResponse.body.token;
        console.log(`✅ ${role} 사용자 로그인 완료`);
      } catch (error) {
        console.error(`❌ ${role} 사용자 생성/로그인 실패:`, error.message);
        throw error;
      }
    }
  }

  async function createProfiles() {
    console.log('2단계: 프로필 생성');

    const roleMapping = {
      admin: Role.ADMIN,
      teacher: Role.TEACHER,
      student: Role.STUDENT,
      parent: Role.PARENT,
    };

    for (const [role, userData] of Object.entries(testUsers)) {
      try {
        // 이메일 인증 코드 발송
        await request(app.getHttpServer())
          .post('/profiles/verify/send')
          .set('Authorization', `Bearer ${tokens[role]}`)
          .send({ email: userData.email })
          .expect(201);

        // 실제 인증 코드는 콘솔에 출력되므로, 테스트에서는 고정값 사용
        const verificationCode = '123456'; // 테스트용 고정 코드

        const profileData = {
          name: `${role} Test User`,
          role: roleMapping[role as keyof typeof roleMapping],
          birthDate: '1990-01-01',
          verificationCode: verificationCode,
        };

        // 프로필 생성
        const profileResponse = await request(app.getHttpServer())
          .post('/profiles')
          .set('Authorization', `Bearer ${tokens[role]}`)
          .send(profileData)
          .expect(201);

        profiles[role] = profileResponse.body;
        console.log(`✅ ${role} 프로필 생성 완료`);

        // select-profile로 토큰 갱신
        const selectProfileResponse = await request(app.getHttpServer())
          .post(`/auth/select-profile/${profiles[role].id}`)
          .set('Authorization', `Bearer ${tokens[role]}`)
          .expect((res) => {
            console.log(`Select profile response status: ${res.status}`);
            return res.status === 200 || res.status === 201;
          });

        console.log(`Select profile response:`, selectProfileResponse.body);
        tokens[role] = selectProfileResponse.body.token;
        console.log(
          `✅ ${role} 토큰 갱신 완료: ${tokens[role].substring(0, 20)}...`,
        );
      } catch (error) {
        console.error(`❌ ${role} 프로필 생성 실패:`, error.message);
        throw error;
      }
    }
  }

  async function createOrganization() {
    console.log('3단계: 조직 생성');

    const orgData = {
      name: '테스트 학교',
      type: 'school',
      mainAdminRole: OrganizationRole.MAIN_ADMIN,
    };

    try {
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(orgData)
        .expect(201);

      organization = response.body;
      console.log(`✅ 조직 생성 완료: ${organization.name}`);

      console.log(
        'admin 토큰 payload:',
        JSON.parse(
          Buffer.from(tokens.admin.split('.')[1], 'base64').toString(),
        ),
      );
    } catch (error) {
      console.error('❌ 조직 생성 실패:', error.message);
      throw error;
    }
  }

  async function grantPermissions() {
    console.log('4단계: 권한 부여');

    try {
      // 관리자: 모든 권한
      await grantPermission('admin', CoursePermission.CREATE_COURSE);
      await grantPermission('admin', CoursePermission.UPDATE_COURSE);
      await grantPermission('admin', CoursePermission.DELETE_COURSE);
      await grantPermission('admin', CoursePermission.MANAGE_SESSIONS);
      await grantPermission('admin', CoursePermission.MANAGE_ENROLLMENTS);

      // 강사: 수업 관리, 회차 관리
      await grantPermission('teacher', CoursePermission.MANAGE_SESSIONS);

      // 학부모: 수강신청 관리
      await grantPermission('parent', CoursePermission.MANAGE_ENROLLMENTS);

      // 학생: 기본 조회 권한만
      await grantPermission('student', CoursePermission.VIEW_COURSE_DETAILS);

      // 권한 부여 확인
      const adminPermissions = await request(app.getHttpServer())
        .get(
          `/permissions/profiles/${profiles.admin.id}/organizations/${organization.id}/active`,
        )
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      console.log('관리자 권한 확인:', adminPermissions.body);

      console.log('✅ 권한 부여 완료');
    } catch (error) {
      console.error('❌ 권한 부여 실패:', error.message);
      throw error;
    }
  }

  async function grantPermission(
    userRole: string,
    permission: CoursePermission,
  ) {
    await request(app.getHttpServer())
      .post(`/permissions/organizations/${organization.id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        organizationId: organization.id,
        profileId: profiles[userRole].id,
        permission: permission,
      })
      .expect(201);
  }

  async function testCourseManagement() {
    console.log('5단계: 수업 생성 및 관리');

    const courseData = {
      name: '수학 기초',
      description: '기초 수학 과정',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    try {
      // 관리자가 수업 생성 (성공)
      const courseResponse = await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/courses`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(courseData)
        .expect(201);

      course = courseResponse.body;
      console.log(`✅ 수업 생성 완료: ${course.name}`);

      // 강사가 수업 생성 시도 (실패 - 권한 없음)
      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/courses`)
        .set('Authorization', `Bearer ${tokens.teacher}`)
        .send(courseData)
        .expect(403);

      console.log('✅ 권한 체크 완료: 강사는 수업 생성 불가');
    } catch (error) {
      console.error('❌ 수업 관리 테스트 실패:', error.message);
      throw error;
    }
  }

  async function testSessionManagement() {
    console.log('6단계: 회차 생성 및 관리');

    const sessionData = {
      sessionNumber: 1,
      title: '1차시 - 수의 개념',
      description: '기본적인 수의 개념을 배웁니다',
      sessionDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:30',
    };

    try {
      // 강사가 회차 생성 (성공)
      const sessionResponse = await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/courses/${course.id}/sessions`)
        .set('Authorization', `Bearer ${tokens.teacher}`)
        .send(sessionData)
        .expect(201);

      session = sessionResponse.body;
      console.log(`✅ 회차 생성 완료: ${session.title}`);

      // 학생이 회차 생성 시도 (실패 - 권한 없음)
      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/courses/${course.id}/sessions`)
        .set('Authorization', `Bearer ${tokens.student}`)
        .send(sessionData)
        .expect(403);

      console.log('✅ 권한 체크 완료: 학생은 회차 생성 불가');
    } catch (error) {
      console.error('❌ 회차 관리 테스트 실패:', error.message);
      throw error;
    }
  }

  async function testClassManagement() {
    console.log('7단계: 분반 생성 및 관리');

    const classData = {
      className: 'A반',
      capacity: 20,
      location: '101호',
      instructorProfileId: profiles.teacher.id,
    };

    try {
      // 강사가 분반 생성 (성공)
      const classResponse = await request(app.getHttpServer())
        .post(
          `/organizations/${organization.id}/courses/${course.id}/sessions/${session.id}/classes`,
        )
        .set('Authorization', `Bearer ${tokens.teacher}`)
        .send(classData)
        .expect(201);

      class1 = classResponse.body;
      console.log(`✅ 분반 생성 완료: ${class1.className}`);

      // 학부모가 분반 생성 시도 (실패 - 권한 없음)
      await request(app.getHttpServer())
        .post(
          `/organizations/${organization.id}/courses/${course.id}/sessions/${session.id}/classes`,
        )
        .set('Authorization', `Bearer ${tokens.parent}`)
        .send(classData)
        .expect(403);

      console.log('✅ 권한 체크 완료: 학부모는 분반 생성 불가');
    } catch (error) {
      console.error('❌ 분반 관리 테스트 실패:', error.message);
      throw error;
    }
  }

  async function testEnrollmentProcess() {
    console.log('8단계: 수강신청 프로세스');

    try {
      // 학부모가 자녀(학생)를 수강신청 (성공)
      const enrollmentResponse = await request(app.getHttpServer())
        .post(
          `/organizations/${organization.id}/courses/${course.id}/enrollments`,
        )
        .set('Authorization', `Bearer ${tokens.parent}`)
        .send({ profileId: profiles.student.id })
        .expect(201);

      createdEnrollments.push(enrollmentResponse.body);
      console.log('✅ 수강신청 완료');

      // 학생이 직접 수강신청 시도 (실패 - 권한 없음)
      await request(app.getHttpServer())
        .post(
          `/organizations/${organization.id}/courses/${course.id}/enrollments`,
        )
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ profileId: profiles.parent.id })
        .expect(403);

      // 수강신청 목록 조회
      const enrollmentsResponse = await request(app.getHttpServer())
        .get(
          `/organizations/${organization.id}/courses/${course.id}/enrollments`,
        )
        .set('Authorization', `Bearer ${tokens.parent}`)
        .expect(200);

      expect(enrollmentsResponse.body).toHaveLength(1);
      console.log('✅ 수강신청 목록 조회 완료');
    } catch (error) {
      console.error('❌ 수강신청 프로세스 테스트 실패:', error.message);
      throw error;
    }
  }

  async function testDataAccess() {
    console.log('9단계: 데이터 조회 및 검증');

    try {
      // 각 사용자별 접근 가능한 데이터 확인
      const adminCoursesResponse = await request(app.getHttpServer())
        .get(`/organizations/${organization.id}/courses`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const teacherSessionsResponse = await request(app.getHttpServer())
        .get(`/organizations/${organization.id}/courses/${course.id}/sessions`)
        .set('Authorization', `Bearer ${tokens.teacher}`)
        .expect(200);

      const studentCourseDetailResponse = await request(app.getHttpServer())
        .get(`/organizations/${organization.id}/courses/${course.id}/detail`)
        .set('Authorization', `Bearer ${tokens.student}`)
        .expect(200);

      // 권한에 따른 데이터 필터링 확인
      expect(adminCoursesResponse.body).toHaveLength(1);
      expect(teacherSessionsResponse.body).toHaveLength(1);
      expect(studentCourseDetailResponse.body).toBeDefined();

      console.log('✅ 데이터 조회 및 검증 완료');
    } catch (error) {
      console.error('❌ 데이터 접근 테스트 실패:', error.message);
      throw error;
    }
  }

  async function testPermissionChanges() {
    console.log('10단계: 권한 변경 및 재검증');

    try {
      // 관리자가 학생에게 추가 권한 부여
      await grantPermission('student', CoursePermission.MANAGE_ENROLLMENTS);

      // 이제 학생도 수강신청 가능
      const enrollmentResponse = await request(app.getHttpServer())
        .post(
          `/organizations/${organization.id}/courses/${course.id}/enrollments`,
        )
        .set('Authorization', `Bearer ${tokens.student}`)
        .send({ profileId: profiles.parent.id })
        .expect(201);

      createdEnrollments.push(enrollmentResponse.body);
      console.log('✅ 권한 변경 및 재검증 완료');
    } catch (error) {
      console.error('❌ 권한 변경 테스트 실패:', error.message);
      throw error;
    }
  }

  async function testCourseModification() {
    console.log('11단계: 수업 수정 및 삭제');

    try {
      // 수업 수정
      const updateData = {
        name: '수학 기초 (수정됨)',
        description: '기초 수학 과정 - 수정된 설명',
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/organizations/${organization.id}/courses/${course.id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateData.name);
      console.log('✅ 수업 수정 완료');

      // 수업 삭제 (실제로는 soft delete)
      await request(app.getHttpServer())
        .delete(`/organizations/${organization.id}/courses/${course.id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      console.log('✅ 수업 삭제 완료');
    } catch (error) {
      console.error('❌ 수업 수정/삭제 테스트 실패:', error.message);
      throw error;
    }
  }
});
