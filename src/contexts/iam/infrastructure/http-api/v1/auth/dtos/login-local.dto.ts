import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class LoginLocalDto {
  @IsEmail({}, { message: FoodaExceptionCodes.Ex1001.message })
  email!: string;

  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1002.message })
  @MinLength(6, { message: FoodaExceptionCodes.Ex1003.message })
  password!: string;
}
