import { SetMetadata } from '@nestjs/common';
import { RequirePermission } from '../../src/permission/decorators/permission.decorator';
import { CoursePermission } from '../../src/permission/enum/course-permission.enum';
import { PERMISSIONS_KEY } from '../../src/permission/decorators/permission.decorator';

describe('Permission Decorator', () => {
  it('should set permissions metadata', () => {
    const permissions = [
      CoursePermission.CREATE_COURSE,
      CoursePermission.MANAGE_ENROLLMENTS,
    ];

    // 데코레이터를 클래스에 적용
    @RequirePermission(...permissions)
    class TestController {
      @RequirePermission(CoursePermission.DELETE_COURSE)
      testMethod() {}
    }

    // SetMetadata가 올바른 키와 값으로 호출되었는지 확인
    const testInstance = new TestController();

    // Reflector를 사용하여 메타데이터 확인
    const classMetadata = Reflect.getMetadata(PERMISSIONS_KEY, TestController);
    const methodMetadata = Reflect.getMetadata(
      PERMISSIONS_KEY,
      testInstance.testMethod,
    );

    expect(classMetadata).toEqual(permissions);
    expect(methodMetadata).toEqual([CoursePermission.DELETE_COURSE]);
  });

  it('should work with single permission', () => {
    const permission = CoursePermission.CREATE_COURSE;

    @RequirePermission(permission)
    class TestController {}

    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestController);
    expect(metadata).toEqual([permission]);
  });

  it('should work with multiple permissions', () => {
    const permissions = [
      CoursePermission.CREATE_COURSE,
      CoursePermission.UPDATE_COURSE,
      CoursePermission.DELETE_COURSE,
    ];

    @RequirePermission(...permissions)
    class TestController {}

    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestController);
    expect(metadata).toEqual(permissions);
  });

  it('should work with method decorator', () => {
    class TestController {
      @RequirePermission(CoursePermission.MANAGE_ATTENDANCE)
      testMethod() {}
    }

    const testInstance = new TestController();
    const metadata = Reflect.getMetadata(
      PERMISSIONS_KEY,
      testInstance.testMethod,
    );
    expect(metadata).toEqual([CoursePermission.MANAGE_ATTENDANCE]);
  });

  it('should work with method decorator and multiple permissions', () => {
    class TestController {
      @RequirePermission(
        CoursePermission.MANAGE_ATTENDANCE,
        CoursePermission.ASSIGN_INSTRUCTOR,
      )
      testMethod() {}
    }

    const testInstance = new TestController();
    const metadata = Reflect.getMetadata(
      PERMISSIONS_KEY,
      testInstance.testMethod,
    );
    expect(metadata).toEqual([
      CoursePermission.MANAGE_ATTENDANCE,
      CoursePermission.ASSIGN_INSTRUCTOR,
    ]);
  });

  it('should use correct metadata key', () => {
    expect(PERMISSIONS_KEY).toBe('permissions');
  });

  it('should work with all permission types', () => {
    const allPermissions = Object.values(CoursePermission);

    @RequirePermission(...allPermissions)
    class TestController {}

    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestController);
    expect(metadata).toEqual(allPermissions);
  });
});
