import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import {
  AuthResponse,
  IAuthUseCase,
  OAuthProfile,
} from '../../domain/use-cases/auth/auth-use-case.interface';
import { ICollaboratorRepository } from 'src/contexts/shared/domain/repositories/collaborator.repository.interface';
import { IRefreshTokenRepository } from 'src/contexts/shared/domain/repositories/refresh-token.repository.interface';
import { TokenBlacklistService } from 'src/contexts/shared/infrastructure/token-blacklist.service';
import { RefreshToken } from 'src/contexts/shared/domain/entities/refresh-token.entity';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';
import {
  Collaborator,
  CollaboratorStatus,
  OAuthProvider,
} from 'src/contexts/shared/domain/entities';
import { IOAuthAccountRepository } from 'src/contexts/shared/domain/repositories/oauth-account.repository.interface';
import { verifyGoogleIdTokenAndBuildOAuthProfile } from './helpers/google-oauth.helper';
import { fetchMicrosoftOAuthProfile } from './helpers/microsoft-oauth.helper';
import { fetchSlackOAuthProfile } from './helpers/slack-oauth.helper';
import { fetchGithubOAuthProfile } from './helpers/github-oauth.helper';
import { verifyAppleIdTokenAndBuildOAuthProfile } from './helpers/apple-oauth.helper';
import { ApplePrivateKeyService } from './apple/apple-private-key.service';

@Injectable()
export class AuthService implements IAuthUseCase {
  private readonly googleOAuthClient = new OAuth2Client();

  constructor(
    private readonly collaboratorRepo: ICollaboratorRepository,
    private readonly oauthAccountRepo: IOAuthAccountRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly hashingService: IHashing,
    private readonly jwtService: JwtService,
    private readonly blacklistService: TokenBlacklistService,
    private readonly configService: ConfigService,
    private readonly applePrivateKeyService: ApplePrivateKeyService,
  ) {}

  async loginLocal(email: string, password: string): Promise<AuthResponse> {
    const user = await this.collaboratorRepo.findByEmailWithRoles(email);

    if (!user || !user.passwordHash) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1003,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await this.hashingService.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1003,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.collaboratorRepo.updateLastLogin(user.id);

    return this.generateAuthResponse(user);
  }

  async loginOAuth(profile: OAuthProfile): Promise<AuthResponse> {
    if (!profile.email || !profile.providerAccountId) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1003,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const oauthProvider = profile.provider as OAuthProvider;
    const existingOauthAccount =
      await this.oauthAccountRepo.findByProviderAccount(
        oauthProvider,
        profile.providerAccountId,
      );

    const collaborator = await this.resolveCollaboratorFromOAuth(profile);

    if (existingOauthAccount) {
      await this.oauthAccountRepo.update(existingOauthAccount.id, {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        metadata: profile.metadata,
      });
    } else {
      await this.oauthAccountRepo.save({
        provider: oauthProvider,
        providerAccountId: profile.providerAccountId,
        collaboratorId: collaborator.id,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        metadata: profile.metadata,
      });
    }

    const collaboratorWithRoles = await this.collaboratorRepo.findByIdWithRoles(
      collaborator.id,
    );
    if (!collaboratorWithRoles) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1008,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.collaboratorRepo.updateLastLogin(collaboratorWithRoles.id);
    return this.generateAuthResponse(collaboratorWithRoles);
  }

  async loginGoogleIdToken(idToken: string): Promise<AuthResponse> {
    const audience =
      this.configService.get<string>('GOOGLE_ONE_TAP_CLIENT_ID') ??
      this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!audience) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1012,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const profile = await verifyGoogleIdTokenAndBuildOAuthProfile({
      idToken,
      audience,
      googleOAuthClient: this.googleOAuthClient,
    });

    return await this.loginOAuth(profile);
  }

  async loginMicrosoftAccessToken(accessToken: string): Promise<AuthResponse> {
    const profile = await fetchMicrosoftOAuthProfile(accessToken);
    return await this.loginOAuth(profile);
  }

  async loginSlackAccessToken(accessToken: string): Promise<AuthResponse> {
    const profile = await fetchSlackOAuthProfile(accessToken);
    return await this.loginOAuth(profile);
  }

  async loginGithubAccessToken(accessToken: string): Promise<AuthResponse> {
    const profile = await fetchGithubOAuthProfile(accessToken);
    return await this.loginOAuth(profile);
  }

  async loginAppleIdToken(
    idToken: string,
    nonce?: string,
  ): Promise<AuthResponse> {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

    if (!clientId) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1097,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const profile = await verifyAppleIdTokenAndBuildOAuthProfile({
      idToken,
      audience: clientId,
      nonce,
    });

    return await this.loginOAuth(profile);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const [id, tokenPlain] = refreshToken.split('.');
    if (!id || !tokenPlain)
      throw new FoodaException(
        FoodaExceptionCodes.Ex1005,
        HttpStatus.UNAUTHORIZED,
      );

    const storedToken = await this.refreshTokenRepo.findById(id);
    if (!storedToken || storedToken.isRevoked())
      throw new FoodaException(
        FoodaExceptionCodes.Ex1006,
        HttpStatus.UNAUTHORIZED,
      );

    const isValid = await this.hashingService.compare(
      tokenPlain,
      storedToken.tokenHash,
    );
    if (!isValid)
      throw new FoodaException(
        FoodaExceptionCodes.Ex1007,
        HttpStatus.UNAUTHORIZED,
      );

    const user = await this.collaboratorRepo.findById(
      storedToken.collaboratorId,
    );
    if (!user)
      throw new FoodaException(
        FoodaExceptionCodes.Ex1008,
        HttpStatus.NOT_FOUND,
      );

    // Revoke old token
    await this.refreshTokenRepo.revoke(storedToken.id);

    // Get user with roles for the new response
    const userWithRoles = await this.collaboratorRepo.findByEmailWithRoles(
      user.email,
    );

    if (!userWithRoles) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1008,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.generateAuthResponse(userWithRoles);
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1009,
        HttpStatus.BAD_REQUEST,
      );
    }

    const [id, tokenPlain] = refreshToken.split('.');
    if (!id || !tokenPlain || !this.isUuid(id)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1005,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.refreshTokenRepo.revoke(id);

    if (accessToken) {
      const token = accessToken.replace('Bearer ', '');
      await this.blacklistService.addToBlacklist(token);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllByUser(userId);
  }

  async revokeAppleToken(token: string): Promise<void> {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    if (!clientId) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1097,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const clientSecret =
      await this.applePrivateKeyService.generateClientSecret();

    const response = await fetch('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok && response.status !== 200) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1106,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async generateAuthResponse(
    user: Collaborator,
  ): Promise<AuthResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const { refreshTokenPlain, refreshTokenHash } =
      await this.generateRefreshToken();

    const refreshTokenTtlSeconds =
      this.configService.get<number>('REFRESH_TOKEN_TTL_SECONDS') ?? 604800;
    const jwtExpiresInSeconds =
      this.configService.get<number>('JWT_EXPIRES_IN_SECONDS') ?? 3600;

    const refreshTokenEntity = await this.refreshTokenRepo.save({
      collaboratorId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + refreshTokenTtlSeconds * 1000),
    } as Partial<RefreshToken>);

    const refreshToken = `${refreshTokenEntity.id}.${refreshTokenPlain}`;

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtExpiresInSeconds,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private async resolveCollaboratorFromOAuth(
    profile: OAuthProfile,
  ): Promise<Collaborator> {
    const existingOauthAccount =
      await this.oauthAccountRepo.findByProviderAccount(
        profile.provider as OAuthProvider,
        profile.providerAccountId,
      );

    if (existingOauthAccount) {
      const collaborator = await this.collaboratorRepo.findByIdWithRoles(
        existingOauthAccount.collaboratorId,
      );
      if (collaborator) return collaborator;
    }

    const collaboratorByEmail =
      await this.collaboratorRepo.findByEmailWithRoles(profile.email);
    if (collaboratorByEmail) return collaboratorByEmail;

    const createdCollaborator = await this.collaboratorRepo.save({
      email: profile.email,
      firstName: profile.firstName || 'OAuth',
      lastName: profile.lastName || 'User',
      avatarUrl: profile.avatarUrl,
      emailVerified: true,
      status: CollaboratorStatus.ACTIVE,
    });

    return createdCollaborator;
  }

  private async generateRefreshToken(): Promise<{
    refreshTokenPlain: string;
    refreshTokenHash: string;
  }> {
    const refreshTokenPlain = randomUUID();
    const refreshTokenHash = await this.hashingService.hash(refreshTokenPlain);
    return { refreshTokenPlain, refreshTokenHash };
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
