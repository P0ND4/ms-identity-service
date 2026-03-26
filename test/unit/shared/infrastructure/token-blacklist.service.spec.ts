import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { TokenBlacklistService } from 'src/contexts/shared/infrastructure/token-blacklist.service';

describe('TokenBlacklistService', () => {
  const redis = {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  } as unknown as jest.Mocked<Redis>;

  const configService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  let service: TokenBlacklistService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenBlacklistService(redis, configService);
  });

  it('addToBlacklist: uses explicit expiresIn when provided', async () => {
    await service.addToBlacklist('token-a', 120);

    expect(redis.setex).toHaveBeenCalledWith(
      'blacklist:token-a',
      120,
      'revoked',
    );
  });

  it('addToBlacklist: uses config ttl when expiresIn is undefined', async () => {
    configService.get.mockReturnValue(300);

    await service.addToBlacklist('token-b');

    expect(configService.get).toHaveBeenCalledWith('BLACKLIST_TTL_SECONDS');
    expect(redis.setex).toHaveBeenCalledWith(
      'blacklist:token-b',
      300,
      'revoked',
    );
  });

  it('addToBlacklist: uses default ttl when expiresIn and config are undefined', async () => {
    configService.get.mockReturnValue(undefined);

    await service.addToBlacklist('token-c');

    expect(redis.setex).toHaveBeenCalledWith(
      'blacklist:token-c',
      604800,
      'revoked',
    );
  });

  it('isBlacklisted: returns true when redis returns value', async () => {
    redis.get.mockResolvedValue('revoked' as any);

    await expect(service.isBlacklisted('token-a')).resolves.toBe(true);
  });

  it('isBlacklisted: returns false when redis returns null', async () => {
    redis.get.mockResolvedValue(null as any);

    await expect(service.isBlacklisted('token-a')).resolves.toBe(false);
  });

  it('removeFromBlacklist: deletes the blacklist key', async () => {
    await service.removeFromBlacklist('token-z');

    expect(redis.del).toHaveBeenCalledWith('blacklist:token-z');
  });

  it('clearAll: deletes keys when blacklist keys exist', async () => {
    redis.keys.mockResolvedValue(['blacklist:a', 'blacklist:b'] as any);

    await service.clearAll();

    expect(redis.keys).toHaveBeenCalledWith('blacklist:*');
    expect(redis.del).toHaveBeenCalledWith('blacklist:a', 'blacklist:b');
  });

  it('clearAll: does not call del when no keys exist', async () => {
    redis.keys.mockResolvedValue([] as any);

    await service.clearAll();

    expect(redis.del).not.toHaveBeenCalled();
  });
});
