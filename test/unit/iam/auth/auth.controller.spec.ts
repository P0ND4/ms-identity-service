import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthResponse,
  IAuthUseCase,
  OAuthProfile,
} from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { AuthController } from 'src/contexts/iam/infrastructure/http-api/v1/auth/controllers/auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  const authUseCase = {
    loginLocal: jest.fn(),
    loginOAuth: jest.fn(),
    loginGoogleIdToken: jest.fn(),
    loginMicrosoftAccessToken: jest.fn(),
    loginSlackAccessToken: jest.fn(),
    loginGithubAccessToken: jest.fn(),
    loginAppleIdToken: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  } as unknown as jest.Mocked<IAuthUseCase>;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  const authResponse: AuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
    user: {
      id: '1',
      email: 'user@company.com',
      firstName: 'Jane',
      lastName: 'Doe',
      roles: ['admin'],
    },
  };

  const oauthProfile: OAuthProfile = {
    provider: 'google',
    providerAccountId: 'provider-id',
    email: 'user@company.com',
    firstName: 'Jane',
    lastName: 'Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authUseCase, configService);
  });

  it('loginLocal: returns auth response', async () => {
    authUseCase.loginLocal.mockResolvedValue(authResponse);

    const result = await controller.loginLocal({
      email: 'user@company.com',
      password: 'secret123',
    });

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginLocal).toHaveBeenCalledWith(
      'user@company.com',
      'secret123',
    );
  });

  it('loginLocal: propagates use-case errors', async () => {
    const error = new Error('invalid credentials');
    authUseCase.loginLocal.mockRejectedValue(error);

    await expect(
      controller.loginLocal({ email: 'user@company.com', password: 'wrong' }),
    ).rejects.toThrow(error);
  });

  it('loginGoogle: returns undefined (guard handles redirect)', () => {
    expect(controller.loginGoogle()).toBeUndefined();
  });

  it('loginGoogleCallback: returns auth response', async () => {
    authUseCase.loginOAuth.mockResolvedValue(authResponse);

    const result = await controller.loginGoogleCallback({
      user: oauthProfile,
    } as any);

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginOAuth).toHaveBeenCalledWith(oauthProfile);
  });

  it('loginGoogleCallback: propagates use-case errors', async () => {
    const error = new Error('oauth failed');
    authUseCase.loginOAuth.mockRejectedValue(error);

    await expect(
      controller.loginGoogleCallback({ user: oauthProfile } as any),
    ).rejects.toThrow(error);
  });

  it('loginGoogleToken: exchanges token when enabled', async () => {
    configService.get.mockReturnValue(true);
    authUseCase.loginGoogleIdToken.mockResolvedValue(authResponse);

    const result = await controller.loginGoogleToken({ idToken: 'google-id' });

    expect(result).toEqual(authResponse);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_GOOGLE_TOKEN_EXCHANGE',
    );
    expect(authUseCase.loginGoogleIdToken).toHaveBeenCalledWith('google-id');
  });

  it('loginGoogleToken: exchanges token when config is undefined (fallback true)', async () => {
    configService.get.mockReturnValue(undefined);
    authUseCase.loginGoogleIdToken.mockResolvedValue(authResponse);

    const result = await controller.loginGoogleToken({ idToken: 'google-id' });

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginGoogleIdToken).toHaveBeenCalledWith('google-id');
  });

  it('loginGoogleToken: throws FoodaException when exchange is disabled', async () => {
    configService.get.mockReturnValue(false);

    await expect(
      controller.loginGoogleToken({ idToken: 'google-id' }),
    ).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      response: expect.objectContaining({ code: 'ID-1023' }),
    });
    expect(authUseCase.loginGoogleIdToken).not.toHaveBeenCalled();
  });

  it('loginMicrosoft: returns undefined (guard handles redirect)', () => {
    expect(controller.loginMicrosoft()).toBeUndefined();
  });

  it('loginMicrosoftCallback: returns auth response', async () => {
    authUseCase.loginOAuth.mockResolvedValue(authResponse);

    const result = await controller.loginMicrosoftCallback({
      user: oauthProfile,
    } as any);

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginOAuth).toHaveBeenCalledWith(oauthProfile);
  });

  it('loginMicrosoftCallback: propagates use-case errors', async () => {
    const error = new Error('oauth microsoft failed');
    authUseCase.loginOAuth.mockRejectedValue(error);

    await expect(
      controller.loginMicrosoftCallback({ user: oauthProfile } as any),
    ).rejects.toThrow(error);
  });

  it('loginMicrosoftToken: exchanges token when enabled', async () => {
    configService.get.mockReturnValue(true);
    authUseCase.loginMicrosoftAccessToken.mockResolvedValue(authResponse);

    const result = await controller.loginMicrosoftToken({
      accessToken: 'ms-access',
    });

    expect(result).toEqual(authResponse);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_MICROSOFT_TOKEN_EXCHANGE',
    );
    expect(authUseCase.loginMicrosoftAccessToken).toHaveBeenCalledWith(
      'ms-access',
    );
  });

  it('loginMicrosoftToken: exchanges token when config is undefined (fallback true)', async () => {
    configService.get.mockReturnValue(undefined);
    authUseCase.loginMicrosoftAccessToken.mockResolvedValue(authResponse);

    const result = await controller.loginMicrosoftToken({
      accessToken: 'ms-access',
    });

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginMicrosoftAccessToken).toHaveBeenCalledWith(
      'ms-access',
    );
  });

  it('loginMicrosoftToken: throws FoodaException when exchange is disabled', async () => {
    configService.get.mockReturnValue(false);

    await expect(
      controller.loginMicrosoftToken({ accessToken: 'ms-access' }),
    ).rejects.toBeInstanceOf(FoodaException);
    expect(authUseCase.loginMicrosoftAccessToken).not.toHaveBeenCalled();
  });

  it('loginSlack: returns undefined (guard handles redirect)', () => {
    expect(controller.loginSlack()).toBeUndefined();
  });

  it('loginSlackCallback: returns auth response', async () => {
    authUseCase.loginOAuth.mockResolvedValue(authResponse);

    const result = await controller.loginSlackCallback({
      user: oauthProfile,
    } as any);

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginOAuth).toHaveBeenCalledWith(oauthProfile);
  });

  it('loginSlackCallback: propagates use-case errors', async () => {
    const error = new Error('oauth slack failed');
    authUseCase.loginOAuth.mockRejectedValue(error);

    await expect(
      controller.loginSlackCallback({ user: oauthProfile } as any),
    ).rejects.toThrow(error);
  });

  it('loginSlackToken: exchanges token when enabled', async () => {
    configService.get.mockReturnValue(true);
    authUseCase.loginSlackAccessToken.mockResolvedValue(authResponse);

    const result = await controller.loginSlackToken({
      accessToken: 'slack-access',
    });

    expect(result).toEqual(authResponse);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_SLACK_TOKEN_EXCHANGE',
    );
    expect(authUseCase.loginSlackAccessToken).toHaveBeenCalledWith(
      'slack-access',
    );
  });

  it('loginSlackToken: exchanges token when config is undefined (fallback true)', async () => {
    configService.get.mockReturnValue(undefined);
    authUseCase.loginSlackAccessToken.mockResolvedValue(authResponse);

    const result = await controller.loginSlackToken({
      accessToken: 'slack-access',
    });

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginSlackAccessToken).toHaveBeenCalledWith(
      'slack-access',
    );
  });

  it('loginSlackToken: throws FoodaException when exchange is disabled', async () => {
    configService.get.mockReturnValue(false);

    await expect(
      controller.loginSlackToken({ accessToken: 'slack-access' }),
    ).rejects.toBeInstanceOf(FoodaException);
    expect(authUseCase.loginSlackAccessToken).not.toHaveBeenCalled();
  });

  it('loginGithub: returns undefined (guard handles redirect)', () => {
    expect(controller.loginGithub()).toBeUndefined();
  });

  it('loginGithubCallback: returns auth response', async () => {
    authUseCase.loginOAuth.mockResolvedValue(authResponse);

    const result = await controller.loginGithubCallback({
      user: oauthProfile,
    } as any);

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginOAuth).toHaveBeenCalledWith(oauthProfile);
  });

  it('loginGithubCallback: propagates use-case errors', async () => {
    const error = new Error('oauth github failed');
    authUseCase.loginOAuth.mockRejectedValue(error);

    await expect(
      controller.loginGithubCallback({ user: oauthProfile } as any),
    ).rejects.toThrow(error);
  });

  it('loginGithubToken: exchanges token when enabled', async () => {
    configService.get.mockReturnValue(true);
    authUseCase.loginGithubAccessToken.mockResolvedValue(authResponse);

    const result = await controller.loginGithubToken({
      accessToken: 'github-access',
    });

    expect(result).toEqual(authResponse);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_GITHUB_TOKEN_EXCHANGE',
    );
    expect(authUseCase.loginGithubAccessToken).toHaveBeenCalledWith(
      'github-access',
    );
  });

  it('loginGithubToken: exchanges token when config is undefined (fallback true)', async () => {
    configService.get.mockReturnValue(undefined);
    authUseCase.loginGithubAccessToken.mockResolvedValue(authResponse);

    const result = await controller.loginGithubToken({
      accessToken: 'github-access',
    });

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginGithubAccessToken).toHaveBeenCalledWith(
      'github-access',
    );
  });

  it('loginGithubToken: throws FoodaException when exchange is disabled', async () => {
    configService.get.mockReturnValue(false);

    await expect(
      controller.loginGithubToken({ accessToken: 'github-access' }),
    ).rejects.toBeInstanceOf(FoodaException);
    expect(authUseCase.loginGithubAccessToken).not.toHaveBeenCalled();
  });

  it('loginApple: returns undefined (guard handles redirect)', () => {
    expect(controller.loginApple()).toBeUndefined();
  });

  it('loginAppleCallback: returns auth response', async () => {
    authUseCase.loginOAuth.mockResolvedValue(authResponse);

    const result = await controller.loginAppleCallback({
      user: { ...oauthProfile, provider: 'apple' } as any,
    } as any);

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginOAuth).toHaveBeenCalledWith({
      ...oauthProfile,
      provider: 'apple',
    });
  });

  it('loginAppleCallback: propagates use-case errors', async () => {
    const error = new Error('oauth apple failed');
    authUseCase.loginOAuth.mockRejectedValue(error);

    await expect(
      controller.loginAppleCallback({ user: oauthProfile } as any),
    ).rejects.toThrow(error);
  });

  it('loginAppleToken: exchanges token when enabled', async () => {
    configService.get.mockReturnValue(true);
    authUseCase.loginAppleIdToken.mockResolvedValue(authResponse);

    const result = await controller.loginAppleToken({
      idToken: 'apple-id',
    });

    expect(result).toEqual(authResponse);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_APPLE_TOKEN_EXCHANGE',
    );
    expect(authUseCase.loginAppleIdToken).toHaveBeenCalledWith('apple-id');
  });

  it('loginAppleToken: exchanges token when config is undefined (fallback true)', async () => {
    configService.get.mockReturnValue(undefined);
    authUseCase.loginAppleIdToken.mockResolvedValue(authResponse);

    const result = await controller.loginAppleToken({
      idToken: 'apple-id',
    });

    expect(result).toEqual(authResponse);
    expect(authUseCase.loginAppleIdToken).toHaveBeenCalledWith('apple-id');
  });

  it('loginAppleToken: throws FoodaException when exchange is disabled', async () => {
    configService.get.mockReturnValue(false);

    await expect(
      controller.loginAppleToken({ idToken: 'apple-id' }),
    ).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      response: expect.objectContaining({ code: 'ID-1098' }),
    });
    expect(authUseCase.loginAppleIdToken).not.toHaveBeenCalled();
  });

  it('refresh: returns new tokens', async () => {
    authUseCase.refreshToken.mockResolvedValue(authResponse);

    const result = await controller.refresh({ refreshToken: 'refresh-token' });

    expect(result).toEqual(authResponse);
    expect(authUseCase.refreshToken).toHaveBeenCalledWith('refresh-token');
  });

  it('refresh: propagates use-case errors', async () => {
    const error = new Error('invalid refresh');
    authUseCase.refreshToken.mockRejectedValue(error);

    await expect(
      controller.refresh({ refreshToken: 'invalid' }),
    ).rejects.toThrow(error);
  });

  it('logout: delegates to use-case and returns void', async () => {
    authUseCase.logout.mockResolvedValue(undefined);

    const result = await controller.logout(
      'Bearer access-token',
      'refresh-token',
    );

    expect(result).toBeUndefined();
    expect(authUseCase.logout).toHaveBeenCalledWith(
      'Bearer access-token',
      'refresh-token',
    );
  });

  it('logout: propagates use-case errors', async () => {
    const error = new Error('logout failed');
    authUseCase.logout.mockRejectedValue(error);

    await expect(
      controller.logout('Bearer access-token', 'refresh-token'),
    ).rejects.toThrow(error);
  });
});
