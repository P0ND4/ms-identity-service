import { IsNotEmpty, IsString } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class LoginMicrosoftTokenDto {
  @IsString({ message: FoodaExceptionCodes.Ex1014.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1015.message })
  accessToken!: string;
}
