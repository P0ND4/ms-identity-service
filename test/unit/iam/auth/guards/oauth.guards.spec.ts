import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleOAuthGuard } from 'src/contexts/iam/infrastructure/http-api/v1/auth/guards/google-oauth.guard';
import { MicrosoftOAuthGuard } from 'src/contexts/iam/infrastructure/http-api/v1/auth/guards/microsoft-oauth.guard';
import { SlackOAuthGuard } from 'src/contexts/iam/infrastructure/http-api/v1/auth/guards/slack-oauth.guard';
import { AppleOAuthGuard } from 'src/contexts/iam/infrastructure/http-api/v1/auth/guards/apple-oauth.guard';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';

describe('OAuth Guards', () => {
  const context = {} as ExecutionContext;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GoogleOAuthGuard: calls parent canActivate when enabled', () => {
    const baseCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(GoogleOAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    configService.get.mockReturnValue(true);
    const guard = new GoogleOAuthGuard(configService);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_GOOGLE_OAUTH_REDIRECT',
    );
    expect(baseCanActivateSpy).toHaveBeenCalledWith(context);
    baseCanActivateSpy.mockRestore();
  });

  it('GoogleOAuthGuard: throws FoodaException when disabled (undefined config)', () => {
    configService.get.mockReturnValue(undefined);
    const guard = new GoogleOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    expect(error).toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1020' }),
      }),
    );
  });

  it('MicrosoftOAuthGuard: calls parent canActivate when enabled', () => {
    const baseCanActivateSpy = jest
      .spyOn(
        Object.getPrototypeOf(MicrosoftOAuthGuard.prototype),
        'canActivate',
      )
      .mockReturnValue(true);
    configService.get.mockReturnValue(true);
    const guard = new MicrosoftOAuthGuard(configService);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_MICROSOFT_OAUTH_REDIRECT',
    );
    expect(baseCanActivateSpy).toHaveBeenCalledWith(context);
    baseCanActivateSpy.mockRestore();
  });

  it('MicrosoftOAuthGuard: throws FoodaException when disabled', () => {
    configService.get.mockReturnValue(false);
    const guard = new MicrosoftOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    expect(error).toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1021' }),
      }),
    );
  });

  it('MicrosoftOAuthGuard: throws FoodaException when config is undefined', () => {
    configService.get.mockReturnValue(undefined);
    const guard = new MicrosoftOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    expect(error).toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1021' }),
      }),
    );
  });

  it('SlackOAuthGuard: calls parent canActivate when enabled', () => {
    const baseCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(SlackOAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    configService.get.mockReturnValue(true);
    const guard = new SlackOAuthGuard(configService);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_SLACK_OAUTH_REDIRECT',
    );
    expect(baseCanActivateSpy).toHaveBeenCalledWith(context);
    baseCanActivateSpy.mockRestore();
  });

  it('SlackOAuthGuard: throws FoodaException when disabled', () => {
    configService.get.mockReturnValue(false);
    const guard = new SlackOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    expect(error).toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1022' }),
      }),
    );
  });

  it('SlackOAuthGuard: throws FoodaException when config is undefined', () => {
    configService.get.mockReturnValue(undefined);
    const guard = new SlackOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    expect(error).toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1022' }),
      }),
    );
  });

  it('AppleOAuthGuard: calls parent canActivate when enabled', () => {
    const baseCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(AppleOAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    configService.get.mockReturnValue(true);
    const guard = new AppleOAuthGuard(configService);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_APPLE_OAUTH_REDIRECT',
    );
    expect(baseCanActivateSpy).toHaveBeenCalledWith(context);
    baseCanActivateSpy.mockRestore();
  });

  it('AppleOAuthGuard: throws FoodaException when disabled', () => {
    configService.get.mockReturnValue(false);
    const guard = new AppleOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    expect(error).toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1096' }),
      }),
    );
  });

  it('AppleOAuthGuard: throws FoodaException when config is undefined', () => {
    configService.get.mockReturnValue(undefined);
    const guard = new AppleOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    expect(error).toEqual(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        response: expect.objectContaining({ code: 'ID-1096' }),
      }),
    );
  });
});
