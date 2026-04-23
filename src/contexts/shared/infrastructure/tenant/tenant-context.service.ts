import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get tenantId(): string {
    return this.request.headers['x-tenant-id'] as string;
  }

  get schema(): string {
    return `tenant_${this.tenantId}`;
  }

  get schemaQuoted(): string {
    return `"tenant_${this.tenantId}"`;
  }
}
