import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'AI/ML' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
