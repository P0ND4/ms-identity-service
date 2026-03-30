import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class LoginMicrosoftTokenDto {
  @ApiProperty({
    example: 'EwB4A8l6BAAURSN5...microsoft-access-token',
    description: 'Access token emitido por Microsoft Graph.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1014.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1015.message })
  accessToken!: string;
}
