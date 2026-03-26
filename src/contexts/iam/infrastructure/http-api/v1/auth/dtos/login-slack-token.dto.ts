import { IsNotEmpty, IsString } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class LoginSlackTokenDto {
  @IsString({ message: FoodaExceptionCodes.Ex1016.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1017.message })
  accessToken!: string;
}
