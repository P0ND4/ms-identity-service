export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface OAuthProfile {
  provider: 'google' | 'microsoft' | 'slack' | 'github' | 'apple';
  providerAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  metadata?: Record<string, unknown>;
}

export abstract class IAuthUseCase {
  abstract loginLocal(email: string, password: string): Promise<AuthResponse>;
  abstract loginOAuth(profile: OAuthProfile): Promise<AuthResponse>;
  abstract loginGoogleIdToken(idToken: string): Promise<AuthResponse>;
  abstract loginMicrosoftAccessToken(
    accessToken: string,
  ): Promise<AuthResponse>;
  abstract loginSlackAccessToken(accessToken: string): Promise<AuthResponse>;
  abstract loginGithubAccessToken(accessToken: string): Promise<AuthResponse>;
  abstract loginAppleIdToken(
    idToken: string,
    nonce?: string,
  ): Promise<AuthResponse>;
  abstract refreshToken(refreshToken: string): Promise<AuthResponse>;
  abstract logout(accessToken: string, refreshToken: string): Promise<void>;
  abstract logoutAllDevices(userId: string): Promise<void>;
  abstract revokeAppleToken(token: string): Promise<void>;
}
