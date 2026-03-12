import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSkinDto {
  @IsString()
  @IsNotEmpty()
  skinId: string;
}
