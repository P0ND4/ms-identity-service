import { Controller, Get, Post, Put } from '@nestjs/common';
import { V1_IAM } from '../../../route.constants';

@Controller(V1_IAM + '/access')
export class AccessController {
  constructor() {}

  @Post('permissions/sync')
  syncPermissions() {}

  @Get('roles')
  getRoles() {}

  @Post('roles')
  createRole() {}

  @Put('roles/:id/permissions')
  updateRolePermissions() {}
}
