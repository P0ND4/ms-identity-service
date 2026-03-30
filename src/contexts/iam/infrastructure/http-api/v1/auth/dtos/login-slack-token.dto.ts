import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class LoginSlackTokenDto {
  @ApiProperty({
    example: 'xoxp-1234567890-1234567890-abcdefghijklmnop',
    description: 'Access token emitido por Slack.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1016.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1017.message })
  accessToken!: string;
}
