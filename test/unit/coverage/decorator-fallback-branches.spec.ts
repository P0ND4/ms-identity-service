describe('Decorator Fallback Branches', () => {
  it('loads decorated modules when Reflect metadata helpers are unavailable', () => {
    jest.resetModules();

    jest.isolateModules(() => {
      const reflectObj = Reflect as unknown as {
        metadata?: (...args: unknown[]) => unknown;
        decorate?: (...args: unknown[]) => unknown;
      };

      const originalMetadata = reflectObj.metadata;
      const originalDecorate = reflectObj.decorate;

      reflectObj.metadata = undefined;
      reflectObj.decorate = undefined;

      const modules = [
        'src/contexts/iam/infrastructure/http-api/v1/access/controllers/access.controller',
        'src/contexts/iam/infrastructure/http-api/v1/auth/controllers/auth.controller',
        'src/contexts/iam/infrastructure/http-api/v1/collaborators/controllers/collaborators.controller',
        'src/contexts/iam/infrastructure/http-api/v1/auth/guards/google-oauth.guard',
        'src/contexts/iam/infrastructure/http-api/v1/auth/guards/microsoft-oauth.guard',
        'src/contexts/iam/infrastructure/http-api/v1/auth/guards/slack-oauth.guard',
        'src/contexts/shared/domain/entities/collaborator-role.entity',
        'src/contexts/shared/domain/entities/collaborator.entity',
        'src/contexts/shared/domain/entities/oauth-account.entity',
        'src/contexts/shared/domain/entities/permission.entity',
        'src/contexts/shared/domain/entities/refresh-token.entity',
        'src/contexts/shared/domain/entities/role-permission.entity',
        'src/contexts/shared/domain/entities/role.entity',
      ];

      try {
        for (const modulePath of modules) {
          expect(() => require(modulePath)).not.toThrow();
        }
      } finally {
        reflectObj.metadata = originalMetadata;
        reflectObj.decorate = originalDecorate;
      }
    });
  });
});
