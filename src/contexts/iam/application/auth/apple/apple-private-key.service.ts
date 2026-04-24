import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

@Injectable()
export class ApplePrivateKeyService {
  private key: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async getPrivateKey(): Promise<string> {
    if (this.key) return this.key;

    const secretName = this.configService.get<string>(
      'APPLE_PRIVATE_KEY_SECRET_NAME',
    );

    if (secretName) {
      this.key = await this.fetchFromSecretManager(secretName);
    } else {
      this.key = this.configService.get<string>('APPLE_PRIVATE_KEY') ?? '';
    }

    if (!this.key) {
      throw new Error('Apple private key is not configured');
    }

    return this.key;
  }

  async generateClientSecret(): Promise<string> {
    const privateKey = await this.getPrivateKey();
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    const teamId = this.configService.get<string>('APPLE_TEAM_ID');
    const keyId = this.configService.get<string>('APPLE_KEY_ID');

    if (!clientId || !teamId || !keyId) {
      throw new Error('Apple Sign-In configuration is incomplete');
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;

    const payload = {
      iss: teamId,
      aud: 'https://appleid.apple.com',
      sub: clientId,
      iat: now,
      exp,
    };

    const privateKeyJwt = await new jose.SignJWT(payload as jose.JWTPayload)
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(await this.importPrivateKey(privateKey));

    return privateKeyJwt;
  }

  private async importPrivateKey(pemKey: string): Promise<CryptoKey> {
    const pemContents = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');

    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return crypto.subtle.importKey(
      'pkcs8',
      bytes.buffer,
      { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  }

  private async fetchFromSecretManager(secretName: string): Promise<string> {
    // TODO: Implement AWS SSM fetching when @aws-sdk/client-ssm is installed
    // For now, fallback to env var
    console.warn(
      `AWS SSM secret '${secretName}' requested but AWS SDK not installed. Using APPLE_PRIVATE_KEY env var.`,
    );
    return this.configService.get<string>('APPLE_PRIVATE_KEY') ?? '';
  }

  clearCache(): void {
    this.key = null;
  }
}
