import { Controller, Get, Post } from '@nestjs/common';
import { V1_IAM } from '../../../route.constants';

@Controller(V1_IAM + '/auth')
export class AuthController {
  constructor() {}

  @Post('login/local')
  loginLocal() {}

  @Get('login/google')
  loginGoogle() {}

  @Get('login/microsoft')
  loginMicrosoft() {}

  @Get('login/slack')
  loginSlack() {}

  @Post('refresh')
  refresh() {}

  @Post('logout')
  logout() {}
}
