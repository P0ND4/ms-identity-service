import { HttpStatus } from '@nestjs/common';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import * as jwt from 'jsonwebtoken';
import * as jose from 'jose';

jest.mock('jose', () => ({
  decodeProtectedHeader: jest.fn(),
  jwtVerify: jest.fn(),
}));

const mockJose = jose as jest.Mocked<typeof jose>;

import { verifyAppleIdTokenAndBuildOAuthProfile } from 'src/contexts/iam/application/auth/helpers/apple-oauth.helper';

describe('verifyAppleIdTokenAndBuildOAuthProfile', () => {
  const mockAudience = 'com.test.app';

  function createAppleIdToken(payload: object): string {
    return jwt.sign(payload, 'test-secret', { algorithm: 'HS256' });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('error cases', () => {
    it('should throw Ex1101 when idToken is empty', async () => {
      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: '',
          audience: mockAudience,
        }),
      ).rejects.toThrow(FoodaException);
      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: '',
          audience: mockAudience,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        response: expect.objectContaining({ code: 'ID-1101' }),
      });
    });

    it('should throw Ex1101 when idToken is null', async () => {
      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: null as any,
          audience: mockAudience,
        }),
      ).rejects.toThrow(FoodaException);
    });

    it('should throw Ex1101 when idToken is undefined', async () => {
      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: undefined as any,
          audience: mockAudience,
        }),
      ).rejects.toThrow(FoodaException);
    });

    it('should throw Ex1100 when idToken is not a string', async () => {
      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: 123 as any,
          audience: mockAudience,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        response: expect.objectContaining({ code: 'ID-1100' }),
      });
    });

    it('should throw Ex1103 when token header has no kid', async () => {
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: '12345',
        email: 'test@example.com',
      });

      mockJose.decodeProtectedHeader.mockReturnValue({} as any);

      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: token,
          audience: mockAudience,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1103' }),
      });
    });

    it('should throw Ex1102 when Apple keys fetch fails', async () => {
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: '12345',
        email: 'test@example.com',
      });

      mockJose.decodeProtectedHeader.mockReturnValue({
        kid: 'test-kid',
      } as any);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      } as any);

      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: token,
          audience: mockAudience,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        response: expect.objectContaining({ code: 'ID-1102' }),
      });
    });

    it('should throw Ex1104 when kid does not match any key', async () => {
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: '12345',
        email: 'test@example.com',
      });

      mockJose.decodeProtectedHeader.mockReturnValue({
        kid: 'unknown-kid',
      } as any);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          keys: [
            {
              kid: 'other-kid',
              kty: 'EC',
              use: 'sig',
              alg: 'ES256',
              n: 'test',
              e: 'AQAB',
            },
          ],
        }),
      } as any);

      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: token,
          audience: mockAudience,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1104' }),
      });
    });

    it('should throw Ex1105 when nonce does not match', async () => {
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: '12345',
        email: 'test@example.com',
        nonce: 'expected-nonce',
      });

      const mockKey = {
        kid: 'test-kid',
        kty: 'EC',
        use: 'sig',
        alg: 'ES256',
        n: 'test',
        e: 'AQAB',
      };

      mockJose.decodeProtectedHeader.mockReturnValue({
        kid: 'test-kid',
      } as any);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ keys: [mockKey] }),
      } as any);
      mockJose.jwtVerify.mockResolvedValue({
        payload: {
          iss: 'https://appleid.apple.com',
          aud: mockAudience,
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
          sub: '12345',
          email: 'test@example.com',
          nonce: 'expected-nonce',
        },
      } as any);

      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: token,
          audience: mockAudience,
          nonce: 'different-nonce',
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1105' }),
      });
    });

    it('should throw Ex1099 when token verification fails', async () => {
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sub: '12345',
        email: 'test@example.com',
      });

      const mockKey = {
        kid: 'test-kid',
        kty: 'EC',
        use: 'sig',
        alg: 'ES256',
        n: 'test',
        e: 'AQAB',
      };

      mockJose.decodeProtectedHeader.mockReturnValue({
        kid: 'test-kid',
      } as any);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ keys: [mockKey] }),
      } as any);
      mockJose.jwtVerify.mockRejectedValue(new Error('invalid signature'));

      await expect(
        verifyAppleIdTokenAndBuildOAuthProfile({
          idToken: token,
          audience: mockAudience,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1099' }),
      });
    });
  });

  describe('success cases', () => {
    it('should return OAuthProfile with apple provider', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: now + 3600,
        iat: now,
        sub: '12345',
        email: 'test@example.com',
        email_verified: 'true',
      });

      const mockKey = {
        kid: 'test-kid',
        kty: 'EC',
        use: 'sig',
        alg: 'ES256',
        n: 'test',
        e: 'AQAB',
      };

      mockJose.decodeProtectedHeader.mockReturnValue({
        kid: 'test-kid',
      } as any);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ keys: [mockKey] }),
      } as any);
      mockJose.jwtVerify.mockResolvedValue({
        payload: {
          iss: 'https://appleid.apple.com',
          aud: mockAudience,
          exp: now + 3600,
          iat: now,
          sub: '12345',
          email: 'test@example.com',
          email_verified: 'true',
        },
      } as any);

      const result = await verifyAppleIdTokenAndBuildOAuthProfile({
        idToken: token,
        audience: mockAudience,
      });

      expect(result).toEqual({
        provider: 'apple',
        providerAccountId: '12345',
        email: 'test@example.com',
        firstName: 'Apple',
        lastName: 'User',
        avatarUrl: undefined,
        metadata: {
          providerRawProfile: expect.objectContaining({
            iss: 'https://appleid.apple.com',
            aud: mockAudience,
            sub: '12345',
            email: 'test@example.com',
          }),
          emailVerified: true,
          isAppleRelayEmail: false,
          hasEmail: true,
        },
      });
    });

    it('should set emailVerified to false when email_verified is not true', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: now + 3600,
        iat: now,
        sub: '12345',
        email: 'test@example.com',
        email_verified: 'false',
      });

      const mockKey = {
        kid: 'test-kid',
        kty: 'EC',
        use: 'sig',
        alg: 'ES256',
        n: 'test',
        e: 'AQAB',
      };

      mockJose.decodeProtectedHeader.mockReturnValue({
        kid: 'test-kid',
      } as any);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ keys: [mockKey] }),
      } as any);
      mockJose.jwtVerify.mockResolvedValue({
        payload: {
          iss: 'https://appleid.apple.com',
          aud: mockAudience,
          exp: now + 3600,
          iat: now,
          sub: '12345',
          email: 'test@example.com',
          email_verified: 'false',
        },
      } as any);

      const result = await verifyAppleIdTokenAndBuildOAuthProfile({
        idToken: token,
        audience: mockAudience,
      });

      expect(result.metadata!.emailVerified).toBe(false);
    });

    it('should detect Apple relay email', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = createAppleIdToken({
        iss: 'https://appleid.apple.com',
        aud: mockAudience,
        exp: now + 3600,
        iat: now,
        sub: '12345',
        email: 'user123@privatemail.com',
        email_verified: 'true',
      });

      const mockKey = {
        kid: 'test-kid',
        kty: 'EC',
        use: 'sig',
        alg: 'ES256',
        n: 'test',
        e: 'AQAB',
      };

      mockJose.decodeProtectedHeader.mockReturnValue({
        kid: 'test-kid',
      } as any);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ keys: [mockKey] }),
      } as any);
      mockJose.jwtVerify.mockResolvedValue({
        payload: {
          iss: 'https://appleid.apple.com',
          aud: mockAudience,
          exp: now + 3600,
          iat: now,
          sub: '12345',
          email: 'user123@privatemail.com',
          email_verified: 'true',
        },
      } as any);

      const result = await verifyAppleIdTokenAndBuildOAuthProfile({
        idToken: token,
        audience: mockAudience,
      });

      expect(result.metadata!.isAppleRelayEmail).toBe(true);
      expect(result.email).toBe('user123@privatemail.com');
    });
  });
});
