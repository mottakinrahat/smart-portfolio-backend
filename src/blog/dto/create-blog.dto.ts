import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsNotEmpty,
  IsHexColor,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlogDto {
  @ApiProperty({ example: 'Building an AI-Powered Portfolio' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A short excerpt about the blog post.' })
  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @ApiProperty({ example: '# Full markdown content here...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'AI / ML' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: '5 min read' })
  @IsString()
  @IsNotEmpty()
  readTime: string;

  @ApiPropertyOptional({ example: '#f5c142' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.png' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
