import 'package:flutter/material.dart';

enum DocumentType { cedula, discapacidad, credencial }

/// Representa un documento/credencial dentro de la billetera del ciudadano.
///
/// `hashBlockchain` es el valor que se codifica en el QR al compartir la
/// identidad; en el flujo real corresponde a `Credencial.hashBlockchain`
/// del backend (ver Backend/prisma/schema.prisma).
class WalletDocument {
  const WalletDocument({
    required this.id,
    required this.type,
    required this.titulo,
    required this.institucion,
    required this.hashBlockchain,
    required this.emitidaEn,
    required this.icon,
    required this.color,
    this.institucionId,
    this.datosJSON,
  });

  final String id;
  final DocumentType type;
  final String titulo;
  final String institucion;
  final String hashBlockchain;
  final DateTime emitidaEn;
  final IconData icon;
  final Color color;

  /// Id de la institución emisora (`Credencial.institucionId`), usado para
  /// consultar sus trámites activos desde el detalle del documento. Null si
  /// el documento no vino del backend con esa relación (ej. mocks locales).
  final int? institucionId;

  /// Atributos de identidad que el ciudadano llenó al solicitar esta
  /// credencial (`Solicitud.datosJSON` ya parseado). Null si la credencial
  /// no tiene una solicitud asociada o no se pudo parsear.
  final Map<String, dynamic>? datosJSON;
}
