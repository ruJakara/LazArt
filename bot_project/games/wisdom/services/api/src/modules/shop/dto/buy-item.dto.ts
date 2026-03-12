import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class BuyItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsOptional()
  @IsIn(['default', 'premium', 'seasonal'])
  shopType?: string;
}
