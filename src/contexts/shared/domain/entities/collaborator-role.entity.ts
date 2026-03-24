// collaborator-role.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Collaborator } from './collaborator.entity';
import { Role } from './role.entity';

@Entity('collaborator_roles')
export class CollaboratorRole {
  @PrimaryColumn({ name: 'collaborator_id' })
  collaboratorId!: string;

  @PrimaryColumn({ name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => Collaborator, (c) => c.collaboratorRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collaborator_id' })
  collaborator!: Collaborator;

  @ManyToOne(() => Role, (r) => r.collaboratorRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy!: string; // ID of the admin who assigned the role

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;
}
