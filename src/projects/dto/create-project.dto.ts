import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsNotEmpty,
  IsHexColor,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Smart Portfolio' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'cly1234567890abcdef' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'A full-stack portfolio powered by AI.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: '["Next.js","OpenAI","NestJS"]',
    description: 'JSON-stringified array of tags',
  })
  @IsString()
  @IsNotEmpty()
  tags: string;

  @ApiPropertyOptional({ example: '#f5c142' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://myproject.com' })
  @IsOptional()
  @IsUrl()
  liveUrl?: string;

  @ApiPropertyOptional({ example: 'https://github.com/rahat/project' })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
