// refresh-token.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Collaborator } from './collaborator.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'token_hash' })
  @Index()
  tokenHash!: string; // Hash of the token, never the plain token

  @Column({ name: 'collaborator_id' })
  collaboratorId!: string;

  @ManyToOne(() => Collaborator, (c) => c.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collaborator_id' })
  collaborator!: Collaborator;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt!: Date;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress!: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  isRevoked(): boolean {
    return !!this.revokedAt || new Date() > this.expiresAt;
  }
}
