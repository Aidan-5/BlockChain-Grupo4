import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { AtributoIdentidad } from '@prisma/client';

export class UpdateInstitutionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'wallet debe ser una dirección Ethereum válida (0x...)',
  })
  wallet?: string;

  // Suspende (false) o reactiva (true) la institución. Sincroniza también el
  // Usuario (rol INSTITUCION) vinculado, para bloquear/permitir su login.
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  // Reemplaza el set completo de atributos de identidad que esta institución
  // posee (ver InstitucionAtributo). El ADMIN selecciona del catálogo fijo
  // de 15 valores (GET /institutions/atributos-catalogo), no crea nuevos.
  @IsOptional()
  @IsArray()
  @IsEnum(AtributoIdentidad, { each: true })
  atributos?: AtributoIdentidad[];
}
