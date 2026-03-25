import { Body, Controller, Get, Post, Headers } from '@nestjs/common';
import { V1_IAM } from '../../../route.constants';
import { LoginLocalDto } from '../dtos/login-local.dto';
import { IAuthUseCase } from 'src/contexts/iam/domain/use-cases/auth-use-case.interface';

@Controller(V1_IAM + '/auth')
export class AuthController {
  constructor(private readonly authService: IAuthUseCase) {}

  @Post('login/local')
  async loginLocal(@Body() body: LoginLocalDto) {
    return await this.authService.loginLocal(body.email, body.password);
  }

  @Get('login/google')
  loginGoogle() {}

  @Get('login/microsoft')
  loginMicrosoft() {}

  @Get('login/slack')
  loginSlack() {}

  @Post('refresh')
  refresh() {}

  @Post('logout')
  async logout(
    @Headers('authorization') accessToken: string,
    @Body('refreshToken') refreshToken: string,
  ) {
    return await this.authService.logout(accessToken, refreshToken);
  }
}
