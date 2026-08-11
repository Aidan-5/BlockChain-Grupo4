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

  // institucionId NO se acepta del cliente: se deriva del JWT de la cuenta
  // INSTITUCION autenticada (ver CredentialsController.create).
}
