import { PROVINCIAS_ECUADOR } from '../data/provincias';

export interface CedulaValidationResult {
  valida: boolean;
  mensaje: string;
  detalles?: {
    codigoProvincia: string;
    nombreProvincia?: string;
    tercerDigito: string;
    secuencial: string;
    digitoVerificadorCalculado: number;
    digitoVerificadorIngresado: number;
  };
}

/**
 * Calcula el dígito verificador para los primeros 9 dígitos de una cédula ecuatoriana.
 * Algoritmo oficial Módulo 10 con coeficientes [2, 1, 2, 1, 2, 1, 2, 1, 2].
 */
export function calcularDigitoVerificadorEcuador(primeros9Digitos: string): number {
  if (!/^\d{9}$/.test(primeros9Digitos)) return -1;
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(primeros9Digitos[i], 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const modulo = suma % 10;
  return modulo === 0 ? 0 : 10 - modulo;
}

/**
 * Valida si un número de cédula es válido según las reglas oficiales de Ecuador:
 * 1. Exactamente 10 dígitos numéricos consecutivos (sin guiones).
 * 2. Primeros 2 dígitos corresponden a un código de provincia válido (01 a 24 o 30).
 * 3. Tercer dígito es menor a 6 (persona natural: 0 a 5).
 * 4. El décimo dígito coincide con el algoritmo Módulo 10.
 */
export function validarCedulaEcuatoriana(cedula: string): CedulaValidationResult {
  const cedulaLimpia = cedula.trim();

  if (!cedulaLimpia) {
    return { valida: false, mensaje: 'Por favor ingresa un número de cédula.' };
  }

  if (!/^\d+$/.test(cedulaLimpia)) {
    return { valida: false, mensaje: 'La cédula debe contener solo números, sin guiones ni espacios.' };
  }

  if (cedulaLimpia.length !== 10) {
    return { valida: false, mensaje: `Tu cédula debe tener exactamente 10 dígitos consecutivos (actualmente tiene ${cedulaLimpia.length}).` };
  }

  const codigoProvincia = cedulaLimpia.substring(0, 2);
  const provObj = PROVINCIAS_ECUADOR.find(p => p.codigo === codigoProvincia);

  if (!provObj) {
    return {
      valida: false,
      mensaje: `Código de provincia "${codigoProvincia}" no válido. Debe ser entre 01-24 o 30 (Exterior).`
    };
  }

  const tercerDigito = parseInt(cedulaLimpia[2], 10);
  if (tercerDigito >= 6) {
    return {
      valida: false,
      mensaje: `El tercer dígito (${tercerDigito}) no corresponde a una persona natural (debe ser de 0 a 5).`
    };
  }

  const primeros9 = cedulaLimpia.substring(0, 9);
  const digitoVerificadorCalculado = calcularDigitoVerificadorEcuador(primeros9);
  const digitoVerificadorIngresado = parseInt(cedulaLimpia[9], 10);

  if (digitoVerificadorCalculado !== digitoVerificadorIngresado) {
    return {
      valida: false,
      mensaje: `El dígito verificador es incorrecto (calculado: ${digitoVerificadorCalculado}, ingresado: ${digitoVerificadorIngresado}).`,
      detalles: {
        codigoProvincia,
        nombreProvincia: provObj.nombre,
        tercerDigito: tercerDigito.toString(),
        secuencial: cedulaLimpia.substring(3, 9),
        digitoVerificadorCalculado,
        digitoVerificadorIngresado
      }
    };
  }

  return {
    valida: true,
    mensaje: `✓ Cédula ecuatoriana válida (${provObj.nombre})`,
    detalles: {
      codigoProvincia,
      nombreProvincia: provObj.nombre,
      tercerDigito: tercerDigito.toString(),
      secuencial: cedulaLimpia.substring(3, 9),
      digitoVerificadorCalculado,
      digitoVerificadorIngresado
    }
  };
}

/**
 * Genera una cédula ecuatoriana 100% válida basada en el código de provincia seleccionado.
 */
export function generarCedulaValida(codigoProvincia: string): {
  cedula: string;
  desglose: {
    provinciaCodigo: string;
    provinciaNombre: string;
    tercerDigito: string;
    secuencial: string;
    digitoVerificador: string;
  };
} {
  const provObj = PROVINCIAS_ECUADOR.find(p => p.codigo === codigoProvincia) || PROVINCIAS_ECUADOR[16]; // Pichincha por defecto
  const provCode = provObj.codigo;

  // Tercer dígito para persona natural (0..5)
  const tercerDigito = Math.floor(Math.random() * 6).toString();

  // Secuencial de 6 dígitos
  let secuencial = '';
  for (let i = 0; i < 6; i++) {
    secuencial += Math.floor(Math.random() * 10).toString();
  }

  const primeros9 = provCode + tercerDigito + secuencial;
  const digitoVerificador = calcularDigitoVerificadorEcuador(primeros9).toString();
  const cedulaFinal = primeros9 + digitoVerificador;

  return {
    cedula: cedulaFinal,
    desglose: {
      provinciaCodigo: provCode,
      provinciaNombre: provObj.nombre,
      tercerDigito,
      secuencial,
      digitoVerificador
    }
  };
}
