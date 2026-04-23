import { Request, Response, NextFunction } from 'express';
import {
  TenantMiddleware,
  TENANT_HEADER,
} from 'src/contexts/shared/infrastructure/tenant/tenant-middleware';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    middleware = new TenantMiddleware();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    nextFunction = jest.fn();
  });

  it('should call next() when x-tenant-id header is present', () => {
    mockRequest.headers = { [TENANT_HEADER]: 'tenant_abc' };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set tenantId on request object when header is present', () => {
    mockRequest.headers = { [TENANT_HEADER]: 'tenant_abc' };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect((mockRequest as any).tenantId).toBe('tenant_abc');
  });

  it('should return 400 when x-tenant-id header is missing', () => {
    mockRequest.headers = {};

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: 'Missing x-tenant-id header',
      code: 'Ex0002',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle empty string tenant-id as missing', () => {
    mockRequest.headers = { [TENANT_HEADER]: '' };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should pass non-string tenant-id through', () => {
    mockRequest.headers = { [TENANT_HEADER]: '12345' };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect((mockRequest as any).tenantId).toBe('12345');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle tenant-id with special characters', () => {
    mockRequest.headers = { [TENANT_HEADER]: 'tenant_abc-123' };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect((mockRequest as any).tenantId).toBe('tenant_abc-123');
    expect(nextFunction).toHaveBeenCalled();
  });
});
