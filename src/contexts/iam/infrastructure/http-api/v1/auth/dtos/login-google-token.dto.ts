import { IsNotEmpty, IsString } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class LoginGoogleTokenDto {
  @IsString({ message: FoodaExceptionCodes.Ex1010.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1011.message })
  idToken!: string;
}
