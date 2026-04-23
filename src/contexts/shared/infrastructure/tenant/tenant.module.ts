import { Module, Global } from '@nestjs/common';
import { TenantMiddleware } from './tenant-middleware';
import { TenantContext } from './tenant-context.service';
import { SchemaResolver } from './schema-resolver.service';

@Global()
@Module({
  providers: [TenantMiddleware, TenantContext, SchemaResolver],
  exports: [TenantMiddleware, TenantContext, SchemaResolver],
})
export class TenantModule {}
