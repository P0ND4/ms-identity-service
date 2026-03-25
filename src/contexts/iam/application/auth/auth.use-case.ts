import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import {
  AuthResponse,
  IAuthUseCase,
} from '../../domain/use-cases/auth-use-case.interface';
import { ICollaboratorRepository } from 'src/contexts/shared/domain/repositories/collaborator.repository.interface';
import { IRefreshTokenRepository } from 'src/contexts/shared/domain/repositories/refresh-token.repository.interface';
import { TokenBlacklistService } from 'src/contexts/shared/infrastructure/token-blacklist.service';
import { RefreshToken } from 'src/contexts/shared/domain/entities/refresh-token.entity';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import environment from 'src/config/environment.config';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/fooda.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';
import { CollaboratorRole } from 'src/contexts/shared/domain/entities';

@Injectable()
export class AuthService implements IAuthUseCase {
  constructor(
    private readonly collaboratorRepo: ICollaboratorRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly hashingService: IHashing,
    private readonly jwtService: JwtService,
    private readonly blacklistService: TokenBlacklistService,
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
        FoodaExceptionCodes.Ex1004,
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.collaboratorRepo.updateLastLogin(user.id);

    return this.generateAuthResponse(user);
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

    return this.generateAuthResponse(userWithRoles);
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const [id] = refreshToken.split('.');
    if (id) await this.refreshTokenRepo.revoke(id);

    if (accessToken) {
      const token = accessToken.replace('Bearer ', '');
      await this.blacklistService.addToBlacklist(token);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllByUser(userId);
  }

  private async generateAuthResponse(user: any): Promise<AuthResponse> {
    const roles = user.collaboratorRoles.map(
      (cr: CollaboratorRole) => cr.role.key,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      roles: roles,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const { refreshTokenPlain, refreshTokenHash } =
      await this.generateRefreshToken();

    const env = await environment();

    const refreshTokenEntity = await this.refreshTokenRepo.save({
      collaboratorId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000),
    } as Partial<RefreshToken>);

    const refreshToken = `${refreshTokenEntity.id}.${refreshTokenPlain}`;

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles,
      },
    };
  }

  private async generateRefreshToken(): Promise<{
    refreshTokenPlain: string;
    refreshTokenHash: string;
  }> {
    const refreshTokenPlain = randomUUID();
    const refreshTokenHash = await this.hashingService.hash(refreshTokenPlain);
    return { refreshTokenPlain, refreshTokenHash };
  }
}
