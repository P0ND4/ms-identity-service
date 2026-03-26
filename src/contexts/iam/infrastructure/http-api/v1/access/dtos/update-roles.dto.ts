import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateRoleDto } from './update-role.dto';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class UpdateRoleBulkItemDto extends UpdateRoleDto {
  @ApiProperty({
    example: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
    description: 'Id del rol a actualizar.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1077.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1078.message })
  @IsUUID('4', { message: FoodaExceptionCodes.Ex1060.message })
  id!: string;
}

export class UpdateRolesDto {
  @ApiProperty({
    type: () => [UpdateRoleBulkItemDto],
    description: 'Listado de roles a actualizar.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1079.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1080.message })
  @ValidateNested({ each: true, message: FoodaExceptionCodes.Ex1081.message })
  @Type(() => UpdateRoleBulkItemDto)
  updates!: UpdateRoleBulkItemDto[];
}
