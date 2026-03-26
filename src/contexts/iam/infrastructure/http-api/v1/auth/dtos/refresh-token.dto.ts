import { IsNotEmpty } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class RefreshTokenDto {
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1009.message })
  refreshToken!: string;
}
