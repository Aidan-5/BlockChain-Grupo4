import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTramiteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
