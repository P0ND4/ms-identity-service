import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { V1_IAM } from '../../../route.constants';
import { LoginLocalDto } from '../dtos/login-local.dto';
import {
  AuthResponse,
  IAuthUseCase,
  OAuthProfile,
} from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { LoginGoogleTokenDto } from '../dtos/login-google-token.dto';
import { LoginMicrosoftTokenDto } from '../dtos/login-microsoft-token.dto';
import { MicrosoftOAuthGuard } from '../guards/microsoft-oauth.guard';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { LoginSlackTokenDto } from '../dtos/login-slack-token.dto';
import { SlackOAuthGuard } from '../guards/slack-oauth.guard';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

type OAuthRequest = Request & { user: OAuthProfile };

// OAuth flow note:
// 1) Browser redirect flow (current routes): the frontend opens /login/google,
//    Passport redirects to Google, and Google returns to /login/google/callback.
//    The callback returns this service tokens (access/refresh) to the client.
// 2) One Tap / SDK flow (web or mobile): the provider may return an ID token
//    directly to the frontend and skip these redirect routes.
//    In that case, the frontend must call a dedicated backend "token exchange"
//    endpoint (e.g. POST /api/v1/iam/auth/login/google/token) so the backend validates the
//    provider token and then issues this service tokens.
// 3) The same pattern applies to any provider: if the frontend obtains a token
//    directly (without backend redirect), expose a backend exchange endpoint
//    (e.g. /login/{provider}/token), validate that provider token server-side,
//    map it to OAuthProfile, and finally issue this service tokens.
@ApiTags('IAM Autenticacion')
@Controller(V1_IAM + '/auth')
export class AuthController {
  constructor(
    private readonly authService: IAuthUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('login/local')
  @ApiOperation({
    summary: 'Iniciar sesion con correo y contraseña',
    description: 'Autentica un colaborador usando credenciales locales.',
  })
  @ApiBody({ type: LoginLocalDto })
  @ApiOkResponse({ description: 'Autenticacion exitosa.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas.' })
  async loginLocal(@Body() body: LoginLocalDto) {
    return await this.authService.loginLocal(body.email, body.password);
  }

  @Get('login/google')
  @ApiOperation({
    summary: 'Iniciar login OAuth con Google',
    description:
      'Redirige al usuario a la pantalla de consentimiento de Google OAuth.',
  })
  @ApiOkResponse({
    description: 'Redireccion al proveedor OAuth de Google.',
  })
  @UseGuards(GoogleOAuthGuard)
  loginGoogle() {}

  @Get('login/google/callback')
  @ApiOperation({
    summary: 'Callback OAuth de Google',
    description:
      'Procesa el callback de Google OAuth y retorna los tokens de acceso y refresh del servicio.',
  })
  @ApiOkResponse({ description: 'Autenticacion OAuth con Google exitosa.' })
  @ApiUnauthorizedResponse({
    description: 'Fallo la autenticacion OAuth con Google.',
  })
  @UseGuards(GoogleOAuthGuard)
  async loginGoogleCallback(@Req() req: OAuthRequest): Promise<AuthResponse> {
    return await this.authService.loginOAuth(req.user);
  }

  @Post('login/google/token')
  @ApiOperation({
    summary: 'Intercambiar ID token de Google por tokens del servicio',
    description:
      'Valida un ID token de Google obtenido por One Tap o SDK y retorna tokens del servicio.',
  })
  @ApiBody({ type: LoginGoogleTokenDto })
  @ApiOkResponse({ description: 'Intercambio de token exitoso.' })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  @ApiUnauthorizedResponse({ description: 'ID token de Google invalido.' })
  @ApiInternalServerErrorResponse({
    description: 'Falta configuracion de Google One Tap.',
  })
  async loginGoogleToken(
    @Body() body: LoginGoogleTokenDto,
  ): Promise<AuthResponse> {
    const enabled =
      this.configService.get<boolean>('ENABLE_GOOGLE_TOKEN_EXCHANGE') ?? true;

    if (!enabled) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1023,
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.authService.loginGoogleIdToken(body.idToken);
  }

  @Get('login/microsoft')
  @ApiOperation({
    summary: 'Iniciar login OAuth con Microsoft',
    description:
      'Redirige al usuario a la pantalla de consentimiento de Microsoft OAuth.',
  })
  @ApiOkResponse({
    description: 'Redireccion al proveedor OAuth de Microsoft.',
  })
  @UseGuards(MicrosoftOAuthGuard)
  loginMicrosoft() {}

  @Get('login/microsoft/callback')
  @ApiOperation({
    summary: 'Callback OAuth de Microsoft',
    description:
      'Procesa el callback de Microsoft OAuth y retorna los tokens de acceso y refresh del servicio.',
  })
  @ApiOkResponse({
    description: 'Autenticacion OAuth con Microsoft exitosa.',
  })
  @ApiUnauthorizedResponse({
    description: 'Fallo la autenticacion OAuth con Microsoft.',
  })
  @UseGuards(MicrosoftOAuthGuard)
  async loginMicrosoftCallback(
    @Req() req: OAuthRequest,
  ): Promise<AuthResponse> {
    return await this.authService.loginOAuth(req.user);
  }

  @Post('login/microsoft/token')
  @ApiOperation({
    summary: 'Intercambiar access token de Microsoft por tokens del servicio',
    description:
      'Valida un access token de Microsoft obtenido por SDK y retorna tokens del servicio.',
  })
  @ApiBody({ type: LoginMicrosoftTokenDto })
  @ApiOkResponse({ description: 'Intercambio de token exitoso.' })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  @ApiUnauthorizedResponse({
    description: 'Access token de Microsoft invalido.',
  })
  async loginMicrosoftToken(
    @Body() body: LoginMicrosoftTokenDto,
  ): Promise<AuthResponse> {
    const enabled =
      this.configService.get<boolean>('ENABLE_MICROSOFT_TOKEN_EXCHANGE') ??
      true;

    if (!enabled) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1024,
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.authService.loginMicrosoftAccessToken(body.accessToken);
  }

  @Get('login/slack')
  @ApiOperation({
    summary: 'Iniciar login OAuth con Slack',
    description:
      'Redirige al usuario a la pantalla de consentimiento de Slack OAuth.',
  })
  @ApiOkResponse({
    description: 'Redireccion al proveedor OAuth de Slack.',
  })
  @UseGuards(SlackOAuthGuard)
  loginSlack() {}

  @Get('login/slack/callback')
  @ApiOperation({
    summary: 'Callback OAuth de Slack',
    description:
      'Procesa el callback de Slack OAuth y retorna los tokens de acceso y refresh del servicio.',
  })
  @ApiOkResponse({ description: 'Autenticacion OAuth con Slack exitosa.' })
  @ApiUnauthorizedResponse({
    description: 'Fallo la autenticacion OAuth con Slack.',
  })
  @UseGuards(SlackOAuthGuard)
  async loginSlackCallback(@Req() req: OAuthRequest): Promise<AuthResponse> {
    return await this.authService.loginOAuth(req.user);
  }

  @Post('login/slack/token')
  @ApiOperation({
    summary: 'Intercambiar access token de Slack por tokens del servicio',
    description:
      'Valida un access token de Slack obtenido por SDK y retorna tokens del servicio.',
  })
  @ApiBody({ type: LoginSlackTokenDto })
  @ApiOkResponse({ description: 'Intercambio de token exitoso.' })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  @ApiUnauthorizedResponse({
    description: 'Access token de Slack invalido.',
  })
  async loginSlackToken(
    @Body() body: LoginSlackTokenDto,
  ): Promise<AuthResponse> {
    const enabled =
      this.configService.get<boolean>('ENABLE_SLACK_TOKEN_EXCHANGE') ?? true;

    if (!enabled) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1025,
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.authService.loginSlackAccessToken(body.accessToken);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refrescar access token',
    description: 'Genera un nuevo access token usando un refresh token valido.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: 'Refresh de token exitoso.' })
  @ApiUnauthorizedResponse({
    description: 'El refresh token es invalido o esta expirado.',
  })
  async refresh(@Body() body: RefreshTokenDto) {
    return await this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Cerrar sesion actual',
    description:
      'Revoca el refresh token enviado y agrega a blacklist el access token actual.',
  })
  @ApiHeader({
    name: 'authorization',
    required: false,
    description: 'Bearer access token a agregar a blacklist.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example:
            '5f85e7b0-2f8c-4f66-90f6-2f84609f3f22.ae4b65a8-9ab4-4efb-a9d3',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiOkResponse({ description: 'Logout exitoso.' })
  @ApiUnauthorizedResponse({
    description: 'El refresh token tiene formato invalido.',
  })
  async logout(
    @Headers('authorization') accessToken: string,
    @Body('refreshToken') refreshToken: string,
  ) {
    return await this.authService.logout(accessToken, refreshToken);
  }
}
