// permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string; // ej: "users:create", "reports:read"

  @Column()
  resource!: string; // ej: "users", "reports"

  @Column()
  action!: string; // ej: "create", "read", "update", "delete", "manage"

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions!: RolePermission[];

  @ManyToOne(() => Permission, (permission) => permission.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent!: Permission | null;

  @OneToMany(() => Permission, (permission) => permission.parent)
  children!: Permission[];
}
