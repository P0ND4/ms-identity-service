import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class LoginGoogleTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...google-id-token',
    description: 'ID token emitido por Google One Tap o SDK.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1010.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1011.message })
  idToken!: string;
}
