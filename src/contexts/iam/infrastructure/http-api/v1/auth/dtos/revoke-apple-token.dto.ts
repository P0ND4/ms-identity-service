import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeAppleTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Token de Apple a revocar',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token!: string;
}
