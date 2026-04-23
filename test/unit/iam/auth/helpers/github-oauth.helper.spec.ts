import { HttpStatus } from '@nestjs/common';
import { fetchGithubOAuthProfile } from 'src/contexts/iam/application/auth/helpers/github-oauth.helper';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';

global.fetch = jest.fn() as jest.Mock;

describe('fetchGithubOAuthProfile', () => {
  const mockFetch = global.fetch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('error cases', () => {
    it('should throw Ex1090 when accessToken is empty', async () => {
      await expect(fetchGithubOAuthProfile('')).rejects.toThrow(FoodaException);
      await expect(fetchGithubOAuthProfile('')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        response: expect.objectContaining({ code: 'ID-1090' }),
      });
    });

    it('should throw Ex1090 when accessToken is null', async () => {
      await expect(fetchGithubOAuthProfile(null as any)).rejects.toThrow(
        FoodaException,
      );
    });

    it('should throw Ex1091 when user API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(fetchGithubOAuthProfile('invalid-token')).rejects.toThrow(
        FoodaException,
      );
      await expect(
        fetchGithubOAuthProfile('invalid-token'),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1091' }),
      });
    });

    it('should throw Ex1092 when no verified primary email found', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 12345,
              login: 'testuser',
              avatar_url: 'http://example.com/avatar.jpg',
              name: 'Test User',
              email: null,
              verified: false,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              { email: 'unverified@test.com', primary: true, verified: false },
            ]),
        });

      await expect(fetchGithubOAuthProfile('valid-token')).rejects.toThrow(
        FoodaException,
      );
    });

    it('should throw Ex1091 when user API throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchGithubOAuthProfile('valid-token')).rejects.toThrow(
        FoodaException,
      );
      await expect(
        fetchGithubOAuthProfile('valid-token'),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: expect.objectContaining({ code: 'ID-1091' }),
      });
    });
  });

  describe('success cases', () => {
    it('should return OAuthProfile when email is verified in user response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 12345,
            login: 'testuser',
            avatar_url: 'http://example.com/avatar.jpg',
            name: 'Test User',
            email: 'verified@test.com',
            verified: true,
          }),
      });

      const result = await fetchGithubOAuthProfile('valid-token');

      expect(result).toEqual({
        provider: 'github',
        providerAccountId: '12345',
        email: 'verified@test.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'http://example.com/avatar.jpg',
        accessToken: 'valid-token',
        metadata: {
          providerRawProfile: {
            id: 12345,
            login: 'testuser',
            avatar_url: 'http://example.com/avatar.jpg',
            name: 'Test User',
            email: 'verified@test.com',
            verified: true,
          },
        },
      });
    });

    it('should fetch emails when email is not verified in user response', async () => {
      const userResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 12345,
          login: 'testuser',
          avatar_url: 'http://example.com/avatar.jpg',
          name: 'Test User',
          email: null,
          verified: false,
        }),
      };

      const emailsResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          { email: 'unverified@test.com', primary: false, verified: false },
          { email: 'primary@test.com', primary: true, verified: true },
        ]),
      };

      mockFetch
        .mockResolvedValueOnce(userResponse)
        .mockResolvedValueOnce(emailsResponse);

      const result = await fetchGithubOAuthProfile('valid-token');

      expect(result.email).toBe('primary@test.com');
      expect(result.firstName).toBe('Test');
      expect(result.lastName).toBe('User');
    });

    it('should use login as name when name is null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 12345,
            login: 'testuser',
            avatar_url: 'http://example.com/avatar.jpg',
            name: null,
            email: 'verified@test.com',
            verified: true,
          }),
      });

      const result = await fetchGithubOAuthProfile('valid-token');

      expect(result.firstName).toBe('testuser');
      expect(result.lastName).toBe('User');
    });

    it('should handle name with multiple parts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 12345,
            login: 'testuser',
            avatar_url: 'http://example.com/avatar.jpg',
            name: 'John Paul Smith',
            email: 'verified@test.com',
            verified: true,
          }),
      });

      const result = await fetchGithubOAuthProfile('valid-token');

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Paul Smith');
    });
  });
});
