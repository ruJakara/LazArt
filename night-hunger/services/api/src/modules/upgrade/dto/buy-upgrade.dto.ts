import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator';

export class BuyUpgradeDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['strength', 'agility', 'hp'])
  stat: 'strength' | 'agility' | 'hp';
}
