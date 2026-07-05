import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Tell me about your most impressive project.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
