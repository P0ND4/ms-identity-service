import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/contexts/iam/application/auth/auth.use-case';
import { verifyGoogleIdTokenAndBuildOAuthProfile } from 'src/contexts/iam/application/auth/helpers/google-oauth.helper';
import { fetchMicrosoftOAuthProfile } from 'src/contexts/iam/application/auth/helpers/microsoft-oauth.helper';
import { fetchSlackOAuthProfile } from 'src/contexts/iam/application/auth/helpers/slack-oauth.helper';
import { fetchGithubOAuthProfile } from 'src/contexts/iam/application/auth/helpers/github-oauth.helper';
import { verifyAppleIdTokenAndBuildOAuthProfile } from 'src/contexts/iam/application/auth/helpers/apple-oauth.helper';
import { ApplePrivateKeyService } from 'src/contexts/iam/application/auth/apple/apple-private-key.service';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import { IOAuthAccountRepository } from 'src/contexts/shared/domain/repositories/oauth-account.repository.interface';
import { ICollaboratorRepository } from 'src/contexts/shared/domain/repositories/collaborator.repository.interface';
import { IRefreshTokenRepository } from 'src/contexts/shared/domain/repositories/refresh-token.repository.interface';
import { TokenBlacklistService } from 'src/contexts/shared/infrastructure/token-blacklist.service';

jest.mock(
  'src/contexts/iam/application/auth/helpers/google-oauth.helper',
  () => ({
    verifyGoogleIdTokenAndBuildOAuthProfile: jest.fn(),
  }),
);

jest.mock(
  'src/contexts/iam/application/auth/helpers/microsoft-oauth.helper',
  () => ({
    fetchMicrosoftOAuthProfile: jest.fn(),
  }),
);

jest.mock(
  'src/contexts/iam/application/auth/helpers/slack-oauth.helper',
  () => ({
    fetchSlackOAuthProfile: jest.fn(),
  }),
);

jest.mock(
  'src/contexts/iam/application/auth/helpers/github-oauth.helper',
  () => ({
    fetchGithubOAuthProfile: jest.fn(),
  }),
);

jest.mock(
  'src/contexts/iam/application/auth/helpers/apple-oauth.helper',
  () => ({
    verifyAppleIdTokenAndBuildOAuthProfile: jest.fn(),
  }),
);

jest.mock(
  'src/contexts/iam/application/auth/helpers/apple-private-key.service',
  () => ({
    ApplePrivateKeyService: jest.fn().mockImplementation(() => ({
      generateClientSecret: jest.fn().mockResolvedValue('mock-client-secret'),
    })),
  }),
);

describe('AuthService', () => {
  let service: AuthService;

  const collaboratorRepo = {
    findByEmailWithRoles: jest.fn(),
    findByIdWithRoles: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    updateLastLogin: jest.fn(),
  } as unknown as jest.Mocked<ICollaboratorRepository>;

  const oauthAccountRepo = {
    findByProviderAccount: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<IOAuthAccountRepository>;

  const refreshTokenRepo = {
    findById: jest.fn(),
    revoke: jest.fn(),
    revokeAllByUser: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<IRefreshTokenRepository>;

  const hashingService = {
    compare: jest.fn(),
    hash: jest.fn(),
  } as unknown as jest.Mocked<IHashing>;

  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const blacklistService = {
    addToBlacklist: jest.fn(),
  } as unknown as jest.Mocked<TokenBlacklistService>;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  const applePrivateKeyService = {
    generateClientSecret: jest.fn().mockResolvedValue('mock-client-secret'),
  } as unknown as ApplePrivateKeyService;

  const baseUser = {
    id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
    email: 'user@company.com',
    firstName: 'Jane',
    lastName: 'Doe',
    passwordHash: 'hash',
    collaboratorRoles: [{ role: { key: 'admin' } }],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    configService.get.mockReturnValue(undefined);
    jwtService.signAsync.mockResolvedValue('access-token');
    hashingService.hash.mockResolvedValue('refresh-token-hash');
    refreshTokenRepo.save.mockResolvedValue({ id: 'rt-id' } as any);

    service = new AuthService(
      collaboratorRepo,
      oauthAccountRepo,
      refreshTokenRepo,
      hashingService,
      jwtService,
      blacklistService,
      configService,
      applePrivateKeyService,
    );
  });

  it('loginLocal: throws Ex1003 when user does not exist', async () => {
    collaboratorRepo.findByEmailWithRoles.mockResolvedValue(null as any);

    await expect(
      service.loginLocal('user@company.com', 'secret'),
    ).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1003' }),
      }),
    );
  });

  it('loginLocal: throws Ex1004 when password is invalid', async () => {
    collaboratorRepo.findByEmailWithRoles.mockResolvedValue(baseUser);
    hashingService.compare.mockResolvedValue(false);

    await expect(
      service.loginLocal('user@company.com', 'bad-pass'),
    ).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1004' }),
      }),
    );
  });

  it('loginLocal: returns auth response when credentials are valid', async () => {
    collaboratorRepo.findByEmailWithRoles.mockResolvedValue(baseUser);
    hashingService.compare.mockResolvedValue(true);

    const result = await service.loginLocal('user@company.com', 'secret');

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        expiresIn: 3600,
      }),
    );
    expect(result.refreshToken.startsWith('rt-id.')).toBe(true);
    expect(collaboratorRepo.updateLastLogin).toHaveBeenCalledWith(baseUser.id);
  });

  it('loginOAuth: throws Ex1003 when profile lacks required fields', async () => {
    await expect(
      service.loginOAuth({
        provider: 'google',
        providerAccountId: '',
        email: '',
        firstName: 'A',
        lastName: 'B',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1003' }),
      }),
    );
  });

  it('loginOAuth: creates collaborator and oauth account when first login', async () => {
    oauthAccountRepo.findByProviderAccount.mockResolvedValue(null as any);
    collaboratorRepo.findByEmailWithRoles.mockResolvedValueOnce(null as any);
    collaboratorRepo.save.mockResolvedValue({
      ...baseUser,
      status: CollaboratorStatus.ACTIVE,
    } as any);
    collaboratorRepo.findByIdWithRoles.mockResolvedValue(baseUser);

    const result = await service.loginOAuth({
      provider: 'google',
      providerAccountId: 'provider-id',
      email: 'user@company.com',
      firstName: 'Jane',
      lastName: 'Doe',
      accessToken: 'oauth-access',
      refreshToken: 'oauth-refresh',
      metadata: { source: 'oauth' },
    });

    expect(result.accessToken).toBe('access-token');
    expect(oauthAccountRepo.save).toHaveBeenCalled();
  });

  it('loginOAuth: updates existing oauth account when provider account already exists', async () => {
    oauthAccountRepo.findByProviderAccount.mockResolvedValue({
      id: 'oa-id',
      collaboratorId: baseUser.id,
    } as any);
    collaboratorRepo.findByIdWithRoles
      .mockResolvedValueOnce(baseUser)
      .mockResolvedValueOnce(baseUser);

    await service.loginOAuth({
      provider: 'google',
      providerAccountId: 'provider-id',
      email: 'user@company.com',
      firstName: 'Jane',
      lastName: 'Doe',
      accessToken: 'oauth-access',
      refreshToken: 'oauth-refresh',
      metadata: { source: 'oauth' },
    });

    expect(oauthAccountRepo.update).toHaveBeenCalledWith(
      'oa-id',
      expect.objectContaining({
        accessToken: 'oauth-access',
        refreshToken: 'oauth-refresh',
      }),
    );
    expect(oauthAccountRepo.save).not.toHaveBeenCalled();
  });

  it('loginOAuth: falls back to collaborator by email when oauth account exists but collaborator does not', async () => {
    oauthAccountRepo.findByProviderAccount.mockResolvedValue({
      id: 'oa-id',
      collaboratorId: baseUser.id,
    } as any);
    collaboratorRepo.findByIdWithRoles
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(baseUser);
    collaboratorRepo.findByEmailWithRoles.mockResolvedValue(baseUser);

    const result = await service.loginOAuth({
      provider: 'google',
      providerAccountId: 'provider-id',
      email: 'user@company.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(result.accessToken).toBe('access-token');
    expect(collaboratorRepo.findByEmailWithRoles).toHaveBeenCalledWith(
      'user@company.com',
    );
  });

  it('loginOAuth: throws Ex1008 when collaborator with roles cannot be loaded', async () => {
    oauthAccountRepo.findByProviderAccount.mockResolvedValue(null as any);
    collaboratorRepo.findByEmailWithRoles
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any);
    collaboratorRepo.save.mockResolvedValue(baseUser);
    collaboratorRepo.findByIdWithRoles.mockResolvedValue(null as any);

    await expect(
      service.loginOAuth({
        provider: 'google',
        providerAccountId: 'provider-id',
        email: 'user@company.com',
        firstName: 'Jane',
        lastName: 'Doe',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1008' }),
      }),
    );
  });

  it('loginGoogleIdToken: throws Ex1012 when audience config is missing', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.loginGoogleIdToken('id-token')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        response: expect.objectContaining({ code: 'ID-1012' }),
      }),
    );
  });

  it('loginGoogleIdToken: validates token and delegates to loginOAuth', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'GOOGLE_ONE_TAP_CLIENT_ID') return 'google-client-id';
      return undefined;
    });

    const profile = {
      provider: 'google',
      providerAccountId: 'provider-id',
      email: 'user@company.com',
      firstName: 'Jane',
      lastName: 'Doe',
    } as any;

    (verifyGoogleIdTokenAndBuildOAuthProfile as jest.Mock).mockResolvedValue(
      profile,
    );
    const loginOAuthSpy = jest
      .spyOn(service, 'loginOAuth')
      .mockResolvedValue({} as any);

    await service.loginGoogleIdToken('id-token');

    expect(verifyGoogleIdTokenAndBuildOAuthProfile).toHaveBeenCalled();
    expect(loginOAuthSpy).toHaveBeenCalledWith(profile);
  });

  it('loginMicrosoftAccessToken: fetches profile and delegates to loginOAuth', async () => {
    const profile = {
      provider: 'microsoft',
      providerAccountId: 'ms-id',
      email: 'ms@company.com',
      firstName: 'Ms',
      lastName: 'User',
    } as any;

    (fetchMicrosoftOAuthProfile as jest.Mock).mockResolvedValue(profile);
    const loginOAuthSpy = jest
      .spyOn(service, 'loginOAuth')
      .mockResolvedValue({} as any);

    await service.loginMicrosoftAccessToken('ms-access');

    expect(fetchMicrosoftOAuthProfile).toHaveBeenCalledWith('ms-access');
    expect(loginOAuthSpy).toHaveBeenCalledWith(profile);
  });

  it('loginSlackAccessToken: fetches profile and delegates to loginOAuth', async () => {
    const profile = {
      provider: 'slack',
      providerAccountId: 'slack-id',
      email: 'slack@company.com',
      firstName: 'Slack',
      lastName: 'User',
    } as any;

    (fetchSlackOAuthProfile as jest.Mock).mockResolvedValue(profile);
    const loginOAuthSpy = jest
      .spyOn(service, 'loginOAuth')
      .mockResolvedValue({} as any);

    await service.loginSlackAccessToken('slack-access');

    expect(fetchSlackOAuthProfile).toHaveBeenCalledWith('slack-access');
    expect(loginOAuthSpy).toHaveBeenCalledWith(profile);
  });

  it('loginGithubAccessToken: fetches profile and delegates to loginOAuth', async () => {
    const profile = {
      provider: 'github',
      providerAccountId: 'github-id',
      email: 'github@company.com',
      firstName: 'Github',
      lastName: 'User',
    } as any;

    (fetchGithubOAuthProfile as jest.Mock).mockResolvedValue(profile);
    const loginOAuthSpy = jest
      .spyOn(service, 'loginOAuth')
      .mockResolvedValue({} as any);

    await service.loginGithubAccessToken('github-access');

    expect(fetchGithubOAuthProfile).toHaveBeenCalledWith('github-access');
    expect(loginOAuthSpy).toHaveBeenCalledWith(profile);
  });

  it('loginGithubAccessToken: propagates errors from fetchGithubOAuthProfile', async () => {
    const error = new Error('GitHub API error');
    (fetchGithubOAuthProfile as jest.Mock).mockRejectedValue(error);

    await expect(
      service.loginGithubAccessToken('invalid-token'),
    ).rejects.toThrow('GitHub API error');
  });

  it('loginAppleIdToken: throws Ex1097 when clientId config is missing', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.loginAppleIdToken('apple-id-token')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        response: expect.objectContaining({ code: 'ID-1097' }),
      }),
    );
  });

  it('loginAppleIdToken: validates token and delegates to loginOAuth', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'APPLE_CLIENT_ID') return 'apple-client-id';
      return undefined;
    });

    const profile = {
      provider: 'apple',
      providerAccountId: 'apple-id',
      email: 'apple@company.com',
      firstName: 'Apple',
      lastName: 'User',
    } as any;

    (verifyAppleIdTokenAndBuildOAuthProfile as jest.Mock).mockResolvedValue(
      profile,
    );
    const loginOAuthSpy = jest
      .spyOn(service, 'loginOAuth')
      .mockResolvedValue({} as any);

    await service.loginAppleIdToken('apple-id-token');

    expect(verifyAppleIdTokenAndBuildOAuthProfile).toHaveBeenCalledWith({
      idToken: 'apple-id-token',
      audience: 'apple-client-id',
    });
    expect(loginOAuthSpy).toHaveBeenCalledWith(profile);
  });

  it('loginAppleIdToken: propagates errors from verifyAppleIdTokenAndBuildOAuthProfile', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'APPLE_CLIENT_ID') return 'apple-client-id';
      return undefined;
    });

    const error = new Error('Apple token validation failed');
    (verifyAppleIdTokenAndBuildOAuthProfile as jest.Mock).mockRejectedValue(
      error,
    );

    await expect(service.loginAppleIdToken('invalid-token')).rejects.toThrow(
      'Apple token validation failed',
    );
  });

  it('refreshToken: throws Ex1005 for invalid token format', async () => {
    await expect(service.refreshToken('bad-format')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1005' }),
      }),
    );
  });

  it('refreshToken: throws Ex1006 when stored token is missing', async () => {
    refreshTokenRepo.findById.mockResolvedValue(null as any);

    await expect(service.refreshToken('rt-id.plain')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1006' }),
      }),
    );
  });

  it('refreshToken: throws Ex1007 when hash comparison fails', async () => {
    refreshTokenRepo.findById.mockResolvedValue({
      id: 'rt-id',
      tokenHash: 'stored-hash',
      collaboratorId: baseUser.id,
      isRevoked: () => false,
    } as any);
    hashingService.compare.mockResolvedValue(false);

    await expect(service.refreshToken('rt-id.plain')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1007' }),
      }),
    );
  });

  it('refreshToken: throws Ex1008 when collaborator is not found by token', async () => {
    refreshTokenRepo.findById.mockResolvedValue({
      id: 'rt-id',
      tokenHash: 'stored-hash',
      collaboratorId: baseUser.id,
      isRevoked: () => false,
    } as any);
    hashingService.compare.mockResolvedValue(true);
    collaboratorRepo.findById.mockResolvedValue(null as any);

    await expect(service.refreshToken('rt-id.plain')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1008' }),
      }),
    );
  });

  it('refreshToken: throws Ex1008 when collaborator with roles is not found', async () => {
    refreshTokenRepo.findById.mockResolvedValue({
      id: 'rt-id',
      tokenHash: 'stored-hash',
      collaboratorId: baseUser.id,
      isRevoked: () => false,
    } as any);
    hashingService.compare.mockResolvedValue(true);
    collaboratorRepo.findById.mockResolvedValue(baseUser);
    collaboratorRepo.findByEmailWithRoles.mockResolvedValue(null as any);

    await expect(service.refreshToken('rt-id.plain')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1008' }),
      }),
    );
  });

  it('logout: throws Ex1009 when refresh token is missing', async () => {
    await expect(service.logout('Bearer token', '')).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.BAD_REQUEST,
        response: expect.objectContaining({ code: 'ID-1009' }),
      }),
    );
  });

  it('logout: throws Ex1005 when refresh token id is not uuid', async () => {
    await expect(
      service.logout('Bearer token', 'not-uuid.plain'),
    ).rejects.toEqual(
      expect.objectContaining({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1005' }),
      }),
    );
  });

  it('logout: revokes token and blacklists access token when provided', async () => {
    await service.logout(
      'Bearer access-token',
      '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a.plain',
    );

    expect(refreshTokenRepo.revoke).toHaveBeenCalledWith(
      '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
    );
    expect(blacklistService.addToBlacklist).toHaveBeenCalledWith(
      'access-token',
    );
  });

  it('logout: does not blacklist when access token is empty', async () => {
    await service.logout('', '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a.plain');

    expect(refreshTokenRepo.revoke).toHaveBeenCalledWith(
      '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
    );
    expect(blacklistService.addToBlacklist).not.toHaveBeenCalled();
  });

  it('logoutAllDevices: revokes all refresh tokens by user', async () => {
    await service.logoutAllDevices(baseUser.id);

    expect(refreshTokenRepo.revokeAllByUser).toHaveBeenCalledWith(baseUser.id);
  });

  it('refreshToken: issues new tokens when refresh token is valid', async () => {
    refreshTokenRepo.findById.mockResolvedValue({
      id: 'rt-id',
      tokenHash: 'stored-hash',
      collaboratorId: baseUser.id,
      isRevoked: () => false,
    } as any);
    hashingService.compare.mockResolvedValue(true);
    collaboratorRepo.findById.mockResolvedValue(baseUser);
    collaboratorRepo.findByEmailWithRoles.mockResolvedValue(baseUser);

    const result = await service.refreshToken(
      '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a.plain',
    );

    expect(refreshTokenRepo.revoke).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
      }),
    );
    expect(result.refreshToken.startsWith('rt-id.')).toBe(true);
  });

  it('loginLocal: returns empty roles when collaboratorRoles is undefined', async () => {
    collaboratorRepo.findByEmailWithRoles.mockResolvedValue({
      ...baseUser,
      collaboratorRoles: undefined,
    });
    hashingService.compare.mockResolvedValue(true);

    const result = await service.loginLocal('user@company.com', 'secret');

    expect(result.user.id).toBe(baseUser.id);
    expect(result.user.email).toBe(baseUser.email);
  });

  it('loginOAuth: uses fallback names when profile firstName/lastName are missing', async () => {
    oauthAccountRepo.findByProviderAccount.mockResolvedValue(null as any);
    collaboratorRepo.findByEmailWithRoles.mockResolvedValueOnce(null as any);
    collaboratorRepo.save.mockResolvedValue({
      ...baseUser,
      firstName: 'OAuth',
      lastName: 'User',
    } as any);
    collaboratorRepo.findByIdWithRoles.mockResolvedValue(baseUser);

    await service.loginOAuth({
      provider: 'google',
      providerAccountId: 'provider-id',
      email: 'user@company.com',
      firstName: '',
      lastName: '',
    });

    expect(collaboratorRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'OAuth',
        lastName: 'User',
      }),
    );
  });
});
