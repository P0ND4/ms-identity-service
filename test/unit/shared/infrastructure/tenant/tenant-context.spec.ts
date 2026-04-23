import { TenantContext } from 'src/contexts/shared/infrastructure/tenant/tenant-context.service';
import { TENANT_HEADER } from 'src/contexts/shared/infrastructure/tenant/tenant-middleware';

describe('TenantContext', () => {
  const createMockRequest = (tenantId: string | undefined) => {
    return {
      headers: tenantId ? { [TENANT_HEADER]: tenantId } : {},
    } as any;
  };

  describe('tenantId getter', () => {
    it('should return tenantId from request headers', () => {
      const request = createMockRequest('tenant_abc');
      const context = new TenantContext(request);

      expect(context.tenantId).toBe('tenant_abc');
    });

    it('should return undefined when header is missing', () => {
      const request = createMockRequest(undefined);
      const context = new TenantContext(request);

      expect(context.tenantId).toBeUndefined();
    });
  });

  describe('schema getter', () => {
    it('should return schema as tenant_{tenantId}', () => {
      const request = createMockRequest('abc');
      const context = new TenantContext(request);

      expect(context.schema).toBe('tenant_abc');
    });

    it('should return tenant_undefined when header is missing', () => {
      const request = createMockRequest(undefined);
      const context = new TenantContext(request);

      expect(context.schema).toBe('tenant_undefined');
    });

    it('should handle numeric tenant IDs', () => {
      const request = createMockRequest('123');
      const context = new TenantContext(request);

      expect(context.schema).toBe('tenant_123');
    });
  });

  describe('schemaQuoted getter', () => {
    it('should return schemaQuoted as "tenant_{tenantId}"', () => {
      const request = createMockRequest('abc');
      const context = new TenantContext(request);

      expect(context.schemaQuoted).toBe('"tenant_abc"');
    });

    it('should return "tenant_undefined" when header is missing', () => {
      const request = createMockRequest(undefined);
      const context = new TenantContext(request);

      expect(context.schemaQuoted).toBe('"tenant_undefined"');
    });

    it('should properly quote schema name for SQL', () => {
      const request = createMockRequest('my-tenant');
      const context = new TenantContext(request);

      expect(context.schemaQuoted).toBe('"tenant_my-tenant"');
    });
  });

  describe('edge cases', () => {
    it('should handle tenant-id with underscores', () => {
      const request = createMockRequest('tenant_abc_123');
      const context = new TenantContext(request);

      expect(context.schema).toBe('tenant_tenant_abc_123');
      expect(context.schemaQuoted).toBe('"tenant_tenant_abc_123"');
    });

    it('should handle tenant-id with special characters', () => {
      const request = createMockRequest('tenant-abc-123');
      const context = new TenantContext(request);

      expect(context.schema).toBe('tenant_tenant-abc-123');
      expect(context.schemaQuoted).toBe('"tenant_tenant-abc-123"');
    });
  });
});
