import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateCredentialDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsInt()
  @IsPositive()
  usuarioId: number;

  @IsInt()
  @IsPositive()
  institucionId: number;
}
