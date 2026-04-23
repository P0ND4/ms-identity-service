import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GithubOAuthGuard } from 'src/contexts/iam/infrastructure/http-api/v1/auth/guards/github-oauth.guard';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';

describe('GithubOAuthGuard', () => {
  const context = {} as ExecutionContext;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call parent canActivate when enabled', () => {
    const baseCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(GithubOAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    configService.get.mockReturnValue(true);
    const guard = new GithubOAuthGuard(configService);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(configService.get).toHaveBeenCalledWith(
      'ENABLE_GITHUB_OAUTH_REDIRECT',
    );
    expect(baseCanActivateSpy).toHaveBeenCalledWith(context);
    baseCanActivateSpy.mockRestore();
  });

  it('should throw FoodaException when disabled (false config)', () => {
    configService.get.mockReturnValue(false);
    const guard = new GithubOAuthGuard(configService);

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
        response: expect.objectContaining({ code: 'ID-1090' }),
      }),
    );
  });

  it('should throw FoodaException when config is undefined', () => {
    configService.get.mockReturnValue(undefined);
    const guard = new GithubOAuthGuard(configService);

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
        response: expect.objectContaining({ code: 'ID-1090' }),
      }),
    );
  });

  it('should throw FoodaException when enabled config is explicitly false', () => {
    configService.get.mockReturnValue(false);
    const guard = new GithubOAuthGuard(configService);

    let error: unknown;
    try {
      guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FoodaException);
    const foodaError = error as FoodaException;
    expect(foodaError.getResponse()).toEqual(
      expect.objectContaining({
        code: 'ID-1090',
      }),
    );
  });
});
