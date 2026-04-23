import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class LoginGithubTokenDto {
  @ApiProperty({
    example: 'gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    description: 'Access token emitido por GitHub.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1090.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1090.message })
  accessToken!: string;
}
