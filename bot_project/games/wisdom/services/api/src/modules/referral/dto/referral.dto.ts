import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GetReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  referredCount: number;

  @IsNumber()
  pendingBonus: number;
}

export class ClaimBonusDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

export class ClaimBonusResponseDto {
  @IsString()
  success: boolean;

  @IsNumber()
  bonus: number;

  @IsString()
  message: string;
}

export class ReferralInfoDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  referredCount: number;

  @IsNumber()
  totalBonusClaimed: number;

  @IsNumber()
  pendingBonus: number;

  @IsString()
  referralLink: string;
}
