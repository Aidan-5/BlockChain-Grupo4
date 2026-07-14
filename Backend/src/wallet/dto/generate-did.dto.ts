import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GenerateDidDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'wallet debe ser una dirección Ethereum válida (0x...)',
  })
  wallet: string;
}
