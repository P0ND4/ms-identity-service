import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginAppleTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Apple ID token (JWT) obtenido del SDK de Sign in with Apple',
    example:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FwcGxl',
  })
  idToken!: string;
}
