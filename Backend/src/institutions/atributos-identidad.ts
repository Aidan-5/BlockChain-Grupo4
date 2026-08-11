import { AtributoIdentidad } from '@prisma/client';

export type TipoAtributo = 'STRING' | 'BOOLEAN';

export interface AtributoIdentidadCatalogo {
  clave: AtributoIdentidad;
  etiqueta: string;
  tipo: TipoAtributo;
}

// Catálogo fijo de los 15 atributos de identidad que las 8 instituciones
// reales del sistema (Registro Civil, SRI, ANT, Registro de la Propiedad,
// Policía Nacional, Fuerzas Armadas, SENESCYT, IESS) pueden poseer. El ADMIN
// selecciona (no crea) cuáles le corresponden a cada institución al editarla
// (ver InstitutionsService.update). El backend es la fuente de verdad de las
// etiquetas legibles para que el Frontend no las duplique/hardcodee.
export const ATRIBUTOS_IDENTIDAD_CATALOGO: AtributoIdentidadCatalogo[] = [
  { clave: 'ESTADO_CIVIL', etiqueta: 'Estado Civil', tipo: 'STRING' },
  {
    clave: 'PORCENTAJE_DISCAPACIDAD',
    etiqueta: 'Porcentaje de Discapacidad',
    tipo: 'STRING',
  },
  { clave: 'NUMERO_RUC', etiqueta: 'Número de RUC', tipo: 'STRING' },
  {
    clave: 'ESTADO_TRIBUTARIO_AL_DIA',
    etiqueta: 'Estado Tributario al Día',
    tipo: 'BOOLEAN',
  },
  {
    clave: 'LICENCIA_CATEGORIAS',
    etiqueta: 'Categorías de Licencia',
    tipo: 'STRING',
  },
  {
    clave: 'SALDO_PUNTOS_LICENCIA',
    etiqueta: 'Saldo de Puntos de Licencia',
    tipo: 'STRING',
  },
  {
    clave: 'TIENE_BIENES_INMUEBLES',
    etiqueta: 'Tiene Bienes Inmuebles',
    tipo: 'BOOLEAN',
  },
  {
    clave: 'BIENES_LIBRES_GRAVAMEN',
    etiqueta: 'Bienes Libres de Gravamen',
    tipo: 'BOOLEAN',
  },
  {
    clave: 'ANTECEDENTES_PENALES_LIMPIO',
    etiqueta: 'Antecedentes Penales Limpios',
    tipo: 'BOOLEAN',
  },
  {
    clave: 'ESTATUS_SERVICIO_MILITAR',
    etiqueta: 'Estatus de Servicio Militar',
    tipo: 'STRING',
  },
  {
    clave: 'PERMISO_ARMAS_ACTIVO',
    etiqueta: 'Permiso de Armas Activo',
    tipo: 'BOOLEAN',
  },
  { clave: 'TITULO_PRINCIPAL', etiqueta: 'Título Principal', tipo: 'STRING' },
  {
    clave: 'NUMERO_REGISTRO_SENESCYT',
    etiqueta: 'Número de Registro SENESCYT',
    tipo: 'STRING',
  },
  {
    clave: 'ESTADO_AFILIACION_IESS',
    etiqueta: 'Estado de Afiliación IESS',
    tipo: 'STRING',
  },
  {
    clave: 'DERECHO_ATENCION_MEDICA',
    etiqueta: 'Derecho a Atención Médica',
    tipo: 'BOOLEAN',
  },
];
