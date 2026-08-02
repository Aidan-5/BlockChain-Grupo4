import 'package:flutter/material.dart';

/// Institución autorizada para emitir credenciales, análoga al modelo
/// `Institucion` de Backend/prisma/schema.prisma.
class Institucion {
  const Institucion({
    required this.id,
    required this.nombre,
    required this.tipo,
    required this.icon,
  });

  final String id;
  final String nombre;
  final String tipo;
  final IconData icon;
}
