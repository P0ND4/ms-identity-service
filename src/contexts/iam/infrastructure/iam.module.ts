import { Module } from '@nestjs/common';
import { AuthModule } from './http-api/v1/auth/auth.module';
import { CollaboratorsModule } from './http-api/v1/collaborators/collaborators.module';
import { AccessModule } from './http-api/v1/access/access.module';

@Module({
  imports: [AuthModule, CollaboratorsModule, AccessModule],
})
export class IamContextModule {}
