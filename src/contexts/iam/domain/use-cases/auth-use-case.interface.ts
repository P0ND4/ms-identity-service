export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export abstract class IAuthUseCase {
  abstract loginLocal(email: string, password: string): Promise<AuthResponse>;
  abstract refreshToken(refreshToken: string): Promise<AuthResponse>;
  abstract logout(accessToken: string, refreshToken: string): Promise<void>;
  abstract logoutAllDevices(userId: string): Promise<void>;
}
