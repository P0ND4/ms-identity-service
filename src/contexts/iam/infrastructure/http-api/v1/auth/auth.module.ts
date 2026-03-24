import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [],
  exports: [],
})
export class AuthModule {}
