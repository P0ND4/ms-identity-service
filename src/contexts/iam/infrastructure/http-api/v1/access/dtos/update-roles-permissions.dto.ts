import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class UpdateRolePermissionsBulkItemDto {
  @ApiProperty({
    example: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
    description: 'Id del rol a actualizar.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1077.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1078.message })
  @IsUUID('4', { message: FoodaExceptionCodes.Ex1060.message })
  roleId!: string;

  @ApiProperty({
    type: [String],
    example: ['users:read', 'roles:update'],
    description: 'Lista final de permissionKeys para ese rol.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1042.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1044.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1028.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1043.message })
  permissionKeys!: string[];
}

export class UpdateRolesPermissionsDto {
  @ApiProperty({
    type: () => [UpdateRolePermissionsBulkItemDto],
    description: 'Listado de asignaciones de permisos por rol.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1082.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1083.message })
  @ValidateNested({ each: true, message: FoodaExceptionCodes.Ex1084.message })
  @Type(() => UpdateRolePermissionsBulkItemDto)
  updates!: UpdateRolePermissionsBulkItemDto[];
}
