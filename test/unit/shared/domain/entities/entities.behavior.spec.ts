import { Collaborator } from 'src/contexts/shared/domain/entities/collaborator.entity';
import { RefreshToken } from 'src/contexts/shared/domain/entities/refresh-token.entity';

describe('Entity behaviors', () => {
  describe('Collaborator.roles', () => {
    it('returns empty array when collaboratorRoles is undefined', () => {
      const collaborator = new Collaborator();

      expect(collaborator.roles).toEqual([]);
    });

    it('maps collaboratorRoles to role entities', () => {
      const collaborator = new Collaborator();
      const roleA = { id: 'r1', key: 'admin' } as any;
      const roleB = { id: 'r2', key: 'operator' } as any;

      collaborator.collaboratorRoles = [
        { role: roleA } as any,
        { role: roleB } as any,
      ];

      expect(collaborator.roles).toEqual([roleA, roleB]);
    });
  });

  describe('RefreshToken.isRevoked', () => {
    it('returns true when revokedAt is set', () => {
      const refreshToken = new RefreshToken();
      refreshToken.revokedAt = new Date();
      refreshToken.expiresAt = new Date(Date.now() + 60_000);

      expect(refreshToken.isRevoked()).toBe(true);
    });

    it('returns true when token is expired', () => {
      const refreshToken = new RefreshToken();
      refreshToken.revokedAt = null;
      refreshToken.expiresAt = new Date(Date.now() - 60_000);

      expect(refreshToken.isRevoked()).toBe(true);
    });

    it('returns false when token is active and not revoked', () => {
      const refreshToken = new RefreshToken();
      refreshToken.revokedAt = null;
      refreshToken.expiresAt = new Date(Date.now() + 60_000);

      expect(refreshToken.isRevoked()).toBe(false);
    });
  });
});
