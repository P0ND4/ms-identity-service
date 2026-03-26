import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Collaborator,
  RefreshToken,
  Role,
  Permission,
  CollaboratorRole,
  RolePermission,
  OAuthAccount,
} from './domain/entities';
import {
  TypeOrmCollaboratorRepository,
  TypeOrmOAuthAccountRepository,
  TypeOrmPermissionRepository,
  TypeOrmRefreshTokenRepository,
  TypeOrmRoleRepository,
} from './infrastructure/repositories';

import {
  ICollaboratorRepository,
  IOAuthAccountRepository,
  IRefreshTokenRepository,
  IRoleRepository,
  IPermissionRepository,
} from './domain/repositories';

const REPOSITORY_PROVIDERS = [
  {
    provide: ICollaboratorRepository,
    useClass: TypeOrmCollaboratorRepository,
  },
  {
    provide: IRefreshTokenRepository,
    useClass: TypeOrmRefreshTokenRepository,
  },
  {
    provide: IOAuthAccountRepository,
    useClass: TypeOrmOAuthAccountRepository,
  },
  {
    provide: IRoleRepository,
    useClass: TypeOrmRoleRepository,
  },
  {
    provide: IPermissionRepository,
    useClass: TypeOrmPermissionRepository,
  },
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Collaborator,
      Role,
      Permission,
      CollaboratorRole,
      RolePermission,
      OAuthAccount,
      RefreshToken,
    ]),
  ],
  providers: [...REPOSITORY_PROVIDERS],
  exports: [...REPOSITORY_PROVIDERS],
})
export class SharedModule {}
