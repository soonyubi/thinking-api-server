import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  UnauthorizedException,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { OrganizationPermissionInterceptor } from '../../../src/organization/interceptors/organization-permission.interceptor';
import { OrganizationService } from '../../../src/organization/organization.service';
import { OrganizationRole } from '../../../src/common/enums/organization-role.enum';

describe('OrganizationPermissionInterceptor', () => {
  let interceptor: OrganizationPermissionInterceptor;
  let organizationService: jest.Mocked<OrganizationService>;

  const mockExecutionContext = (
    user: any,
    params: any = {},
    metadata?: any,
  ) => {
    const handler = {};
    if (metadata) {
      Reflect.defineMetadata('organizationPermission', metadata, handler);
    }

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
        }),
        getResponse: () => ({
          status: jest.fn(),
        }),
      }),
      getHandler: () => handler,
    } as ExecutionContext;
  };

  const mockCallHandler = (returnValue: any = 'success') => {
    return {
      handle: jest.fn().mockReturnValue(of(returnValue)),
    } as CallHandler;
  };

  beforeEach(async () => {
    const mockOrganizationService = {
      checkMemberPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationPermissionInterceptor,
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    }).compile();

    interceptor = module.get<OrganizationPermissionInterceptor>(
      OrganizationPermissionInterceptor,
    );
    organizationService = module.get(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept - 기본 동작', () => {
    it('should pass through when no metadata is present', async () => {
      const context = mockExecutionContext({ profileId: 1 });
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(next.handle).toHaveBeenCalled();
      expect(organizationService.checkMemberPermission).not.toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should pass through when metadata is empty', async () => {
      const context = mockExecutionContext({ profileId: 1 }, {}, {});
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(next.handle).toHaveBeenCalled();
      expect(organizationService.checkMemberPermission).not.toHaveBeenCalled();
      expect(result).toBe('success');
    });
  });

  describe('intercept - 사용자 검증', () => {
    it('should return unauthorized when user is null', async () => {
      const context = mockExecutionContext(
        null,
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Profile required for this operation',
        error: 'Unauthorized',
      });
    });

    it('should return unauthorized when user is undefined', async () => {
      const context = mockExecutionContext(
        undefined,
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Profile required for this operation',
        error: 'Unauthorized',
      });
    });

    it('should return unauthorized when user has no profileId', async () => {
      const context = mockExecutionContext(
        {},
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Profile required for this operation',
        error: 'Unauthorized',
      });
    });

    it('should return unauthorized when user profileId is null', async () => {
      const context = mockExecutionContext(
        { profileId: null },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Profile required for this operation',
        error: 'Unauthorized',
      });
    });

    it('should return unauthorized when user profileId is undefined', async () => {
      const context = mockExecutionContext(
        { profileId: undefined },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Profile required for this operation',
        error: 'Unauthorized',
      });
    });
  });

  describe('intercept - organizationId 검증', () => {
    it('should return bad request when organizationId is missing', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        {},
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Organization ID is required',
        error: 'Bad Request',
      });
    });

    it('should return bad request when organizationId is null', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: null },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Organization ID is required',
        error: 'Bad Request',
      });
    });

    it('should return bad request when organizationId is undefined', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: undefined },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Organization ID is required',
        error: 'Bad Request',
      });
    });

    it('should return bad request when organizationId is not a number', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: 'invalid' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Organization ID is required',
        error: 'Bad Request',
      });
    });

    it('should handle organizationId as string number', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        123,
        1,
        [OrganizationRole.MAIN_ADMIN],
      );
      expect(result).toBe('success');
    });
  });

  describe('intercept - 권한 검증', () => {
    it('should return forbidden when user has insufficient permissions', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(false);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Insufficient permissions for this organization',
        error: 'Forbidden',
      });
    });

    it('should allow access when user has sufficient permissions', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        123,
        1,
        [OrganizationRole.MAIN_ADMIN],
      );
      expect(next.handle).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should work with multiple required roles', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [
            OrganizationRole.MAIN_ADMIN,
            OrganizationRole.SUB_ADMIN,
          ],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        123,
        1,
        [OrganizationRole.MAIN_ADMIN, OrganizationRole.SUB_ADMIN],
      );
      expect(result).toBe('success');
    });

    it('should work with all organization roles', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [
            OrganizationRole.MAIN_ADMIN,
            OrganizationRole.SUB_ADMIN,
            OrganizationRole.STUDENT,
            OrganizationRole.PARENT,
          ],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        123,
        1,
        [
          OrganizationRole.MAIN_ADMIN,
          OrganizationRole.SUB_ADMIN,
          OrganizationRole.STUDENT,
          OrganizationRole.PARENT,
        ],
      );
      expect(result).toBe('success');
    });
  });

  describe('intercept - 커스텀 파라미터명', () => {
    it('should work with custom organizationId parameter name', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { organizationId: '456' },
        {
          requiredRoles: [OrganizationRole.SUB_ADMIN],
          organizationIdParam: 'organizationId',
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        456,
        1,
        [OrganizationRole.SUB_ADMIN],
      );
      expect(result).toBe('success');
    });

    it('should work with different parameter names', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { orgId: '789' },
        {
          requiredRoles: [OrganizationRole.STUDENT],
          organizationIdParam: 'orgId',
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        789,
        1,
        [OrganizationRole.STUDENT],
      );
      expect(result).toBe('success');
    });

    it('should return bad request when custom parameter is missing', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
          organizationIdParam: 'organizationId',
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Organization ID is required',
        error: 'Bad Request',
      });
    });
  });

  describe('intercept - 서비스 오류 처리', () => {
    it('should propagate service errors', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const serviceError = new Error('Database connection failed');
      organizationService.checkMemberPermission.mockRejectedValue(serviceError);

      await expect(
        interceptor.intercept(context, next).toPromise(),
      ).rejects.toThrow(serviceError);
    });

    it('should return forbidden when service returns false', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(false);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Insufficient permissions for this organization',
        error: 'Forbidden',
      });
    });
  });

  describe('intercept - 다양한 사용자 시나리오', () => {
    it('should work with different profile IDs', async () => {
      const context = mockExecutionContext(
        { profileId: 999 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        123,
        999,
        [OrganizationRole.MAIN_ADMIN],
      );
      expect(result).toBe('success');
    });

    it('should return unauthorized with zero profile ID', async () => {
      const context = mockExecutionContext(
        { profileId: 0 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Profile required for this operation',
        error: 'Unauthorized',
      });
    });

    it('should work with large organization ID', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '999999999' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        999999999,
        1,
        [OrganizationRole.MAIN_ADMIN],
      );
      expect(result).toBe('success');
    });
  });

  describe('intercept - 메타데이터 검증', () => {
    it('should handle metadata with only requiredRoles', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        123,
        1,
        [OrganizationRole.MAIN_ADMIN],
      );
      expect(result).toBe('success');
    });

    it('should handle metadata with both requiredRoles and organizationIdParam', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { customId: '456' },
        {
          requiredRoles: [OrganizationRole.SUB_ADMIN],
          organizationIdParam: 'customId',
        },
      );
      const next = mockCallHandler();

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).toHaveBeenCalledWith(
        456,
        1,
        [OrganizationRole.SUB_ADMIN],
      );
      expect(result).toBe('success');
    });

    it('should handle empty requiredRoles array', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [],
        },
      );
      const next = mockCallHandler();

      const result = await interceptor.intercept(context, next).toPromise();

      expect(organizationService.checkMemberPermission).not.toHaveBeenCalled();
      expect(result).toBe('success');
    });
  });

  describe('intercept - RxJS 스트림 처리', () => {
    it('should handle observable return value from next handler', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = {
        handle: jest.fn().mockReturnValue(of({ data: 'test' })),
      } as CallHandler;

      organizationService.checkMemberPermission.mockResolvedValue(true);

      const result = await interceptor.intercept(context, next).toPromise();

      expect(result).toEqual({ data: 'test' });
    });

    it('should handle error observable from next handler', async () => {
      const context = mockExecutionContext(
        { profileId: 1 },
        { id: '123' },
        {
          requiredRoles: [OrganizationRole.MAIN_ADMIN],
        },
      );
      const next = {
        handle: jest
          .fn()
          .mockReturnValue(throwError(() => new Error('Handler error'))),
      } as CallHandler;

      organizationService.checkMemberPermission.mockResolvedValue(true);

      await expect(
        interceptor.intercept(context, next).toPromise(),
      ).rejects.toThrow('Handler error');
    });
  });
});
