// oauth-account.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Collaborator } from './collaborator.entity';

export enum OAuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  SLACK = 'slack',
}

@Entity('oauth_accounts')
@Unique(['provider', 'providerAccountId']) // A provider + unique external ID
export class OAuthAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider!: OAuthProvider;

  @Column({ name: 'provider_account_id' })
  @Index()
  providerAccountId!: string; // ID that Google/Microsoft gives us

  @Column({ name: 'collaborator_id' })
  collaboratorId!: string;

  @ManyToOne(() => Collaborator, (c) => c.oauthAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collaborator_id' })
  collaborator!: Collaborator;

  @Column({ name: 'access_token', nullable: true })
  accessToken!: string; // Encrypt before saving

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken!: string; // Encrypt before saving

  @Column({ name: 'expires_at', nullable: true })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>; // Extra data from OAuth profile
}
