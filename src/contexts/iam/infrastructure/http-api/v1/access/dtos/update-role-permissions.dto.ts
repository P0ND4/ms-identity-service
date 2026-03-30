import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    type: [String],
    example: ['users:read', 'users:update'],
    description: 'permissionKeys finales que tendra el rol.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1042.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1044.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1028.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1043.message })
  permissionKeys!: string[];
}
