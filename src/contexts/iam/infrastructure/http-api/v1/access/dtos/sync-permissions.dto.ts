import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PermissionTreeNodeDto {
  @ApiProperty({
    example: 'users:manage',
    description: 'Key unica del permiso.',
  })
  @IsString({ message: 'Ex1030' })
  @IsNotEmpty({ message: 'Ex1031' })
  key!: string;

  @ApiPropertyOptional({
    example: 'Permite gestionar usuarios',
    description: 'Descripcion opcional del permiso.',
  })
  @IsOptional()
  @IsString({ message: 'Ex1032' })
  description?: string;

  @ApiPropertyOptional({
    type: () => [PermissionTreeNodeDto],
    description: 'Permisos hijos para construir jerarquia.',
  })
  @IsOptional()
  @IsArray({ message: 'Ex1033' })
  @ValidateNested({ each: true, message: 'Ex1026' })
  @Type(() => PermissionTreeNodeDto)
  children?: PermissionTreeNodeDto[];
}

export class SyncPermissionsDto {
  @ApiProperty({
    type: () => [PermissionTreeNodeDto],
    description: 'Raiz del arbol de permisos a sincronizar.',
  })
  @IsArray({ message: 'Ex1034' })
  @ArrayNotEmpty({ message: 'Ex1035' })
  @ValidateNested({ each: true, message: 'Ex1027' })
  @Type(() => PermissionTreeNodeDto)
  permissions!: PermissionTreeNodeDto[];
}
