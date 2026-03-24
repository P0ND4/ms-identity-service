// role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CollaboratorRole } from './collaborator-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string; // ej: "admin", "editor", "viewer"

  @Column()
  name!: string; // ej: "Administrator"

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean; // Rol asignado por defecto a nuevos usuarios

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => CollaboratorRole, (cr) => cr.role)
  collaboratorRoles!: CollaboratorRole[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions!: RolePermission[];
}
