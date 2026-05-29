import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export const TENANT_HEADER = 'x-tenant-id';

const ALLOWLISTED_PATHS = ['/health', '/api', '/api-json', '/api/internal/metrics'];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isAllowlisted = ALLOWLISTED_PATHS.some(
      (path) =>
        req.originalUrl === path || req.originalUrl.startsWith(`${path}?`),
    );

    if (isAllowlisted) {
      (req as any).tenantId = 'system';
      return next();
    }

    const tenantId = req.headers[TENANT_HEADER] as string;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Missing x-tenant-id header',
        code: 'Ex0002',
      });
      return;
    }

    (req as any).tenantId = tenantId;
    next();
  }
}
