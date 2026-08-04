import 'dart:convert';

enum EstadoSolicitud { pendiente, aprobada, rechazada }

EstadoSolicitud _parseEstado(String value) {
  switch (value) {
    case 'APROBADA':
      return EstadoSolicitud.aprobada;
    case 'RECHAZADA':
      return EstadoSolicitud.rechazada;
    default:
      return EstadoSolicitud.pendiente;
  }
}

/// Espejo de `Solicitud` en Backend/prisma/schema.prisma, tal como lo
/// devuelve `GET /solicitudes/usuario/:id`.
class Solicitud {
  Solicitud({
    required this.id,
    required this.tipoCredencial,
    required this.datosJSON,
    required this.estado,
    required this.hashTemporal,
    required this.createdAt,
  });

  factory Solicitud.fromJson(Map<String, dynamic> json) => Solicitud(
    id: json['id'] as int,
    tipoCredencial: json['tipoCredencial'] as String,
    datosJSON: json['datosJSON'] as String,
    estado: _parseEstado(json['estado'] as String),
    hashTemporal: json['hashTemporal'] as String?,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  final int id;
  final String tipoCredencial;
  final String datosJSON;
  final EstadoSolicitud estado;
  final String? hashTemporal;
  final DateTime createdAt;

  /// `datosJSON` es un blob de texto libre (ver CitizenRequest.tsx en el
  /// frontend web); se parsea de forma tolerante porque su forma no está
  /// validada por el backend.
  Map<String, dynamic> get datos {
    try {
      final decoded = jsonDecode(datosJSON);
      return decoded is Map<String, dynamic> ? decoded : {};
    } catch (_) {
      return {};
    }
  }

  String get nombreCompleto {
    final nombres = datos['nombres'] as String? ?? '';
    final apellidos = datos['apellidos'] as String? ?? '';
    return [nombres, apellidos].where((s) => s.isNotEmpty).join(' ');
  }

  String? get cedula => datos['cedula'] as String?;
  String? get lugarNacimiento => datos['lugarNacimiento'] as String?;
  String? get fechaNacimiento => datos['fechaNacimiento'] as String?;
}
