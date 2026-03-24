import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { OAuthAccount } from './oauth-account.entity';
import { CollaboratorRole } from './collaborator-role.entity';

export enum CollaboratorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  email!: string;

  @Column({ name: 'password_hash', nullable: true }) // nullable for OAuth-only users
  passwordHash!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl!: string;

  @Column({
    type: 'enum',
    enum: CollaboratorStatus,
    default: CollaboratorStatus.PENDING,
  })
  status!: CollaboratorStatus;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;

  // Relations
  @OneToMany(() => CollaboratorRole, (cr) => cr.collaborator)
  collaboratorRoles!: CollaboratorRole[];

  @OneToMany(() => RefreshToken, (rt) => rt.collaborator)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => OAuthAccount, (oa) => oa.collaborator)
  oauthAccounts!: OAuthAccount[];

  // Helper to get roles
  get roles() {
    return this.collaboratorRoles?.map((cr) => cr.role) || [];
  }
}
