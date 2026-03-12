import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class UseItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;
}

export class SellItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}
