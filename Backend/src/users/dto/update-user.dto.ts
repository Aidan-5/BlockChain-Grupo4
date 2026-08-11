import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  identificacion?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'wallet debe ser una dirección Ethereum válida (0x...)',
  })
  wallet?: string;

  @IsOptional()
  @IsString()
  did?: string;

  // Suspende (false) o reactiva (true) la cuenta del ciudadano; bloquea el login.
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
