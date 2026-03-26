import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class RefreshTokenDto {
  @ApiProperty({
    example: '5f85e7b0-2f8c-4f66-90f6-2f84609f3f22.ae4b65a8-9ab4-4efb-a9d3',
    description: 'Refresh token emitido por el servicio IAM.',
  })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1009.message })
  refreshToken!: string;
}
