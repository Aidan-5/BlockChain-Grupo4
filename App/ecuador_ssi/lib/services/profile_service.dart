import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/citizen_profile.dart';

class ProfileService {
  // En emulador Android, 10.0.2.2 apunta al localhost del PC host
  static const String _baseUrl = 'http://10.0.2.2:3000';

  static Future<CitizenProfile?> fetchProfile(int userId) async {
    if (userId <= 0) return null;

    try {
      final userResponse = await http
          .get(Uri.parse('$_baseUrl/users/$userId'))
          .timeout(const Duration(seconds: 10));

      if (userResponse.statusCode != 200) return null;

      final user = jsonDecode(userResponse.body) as Map<String, dynamic>;
      final solicitudesResponse = await http
          .get(Uri.parse('$_baseUrl/solicitudes/usuario/$userId'))
          .timeout(const Duration(seconds: 10));

      Map<String, dynamic> datos = {};
      if (solicitudesResponse.statusCode == 200) {
        final solicitudes = jsonDecode(solicitudesResponse.body) as List<dynamic>;
        datos = _extractSolicitudData(solicitudes);
      }

      return _buildProfile(user, datos);
    } catch (_) {
      return null;
    }
  }

  static Map<String, dynamic> _extractSolicitudData(List<dynamic> solicitudes) {
    for (final item in solicitudes) {
      final solicitud = item as Map<String, dynamic>;
      if (solicitud['estado'] == 'APROBADA') {
        return _parseDatosJson(solicitud['datosJSON']);
      }
    }

    for (final item in solicitudes) {
      final datos = _parseDatosJson((item as Map<String, dynamic>)['datosJSON']);
      if (datos.isNotEmpty) return datos;
    }

    return {};
  }

  static Map<String, dynamic> _parseDatosJson(dynamic raw) {
    if (raw is! String || raw.isEmpty) return {};
    try {
      final parsed = jsonDecode(raw);
      return parsed is Map<String, dynamic> ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  static CitizenProfile _buildProfile(
    Map<String, dynamic> user,
    Map<String, dynamic> datos,
  ) {
    final nombres = (datos['nombres'] as String?)?.trim() ?? '';
    final apellidos = (datos['apellidos'] as String?)?.trim() ?? '';
    final nombreDesdeSolicitud = [nombres, apellidos]
        .where((part) => part.isNotEmpty)
        .join(' ');

    final wallet = (user['wallet'] as String?)?.trim();
    final didFromDb = (user['did'] as String?)?.trim();

    return CitizenProfile(
      nombreCompleto: nombreDesdeSolicitud.isNotEmpty
          ? nombreDesdeSolicitud
          : (user['nombre'] as String? ?? 'Ciudadano'),
      cedula: (datos['cedula'] as String?)?.trim().isNotEmpty == true
          ? datos['cedula'] as String
          : (user['identificacion'] as String?)?.trim().isNotEmpty == true
          ? user['identificacion'] as String
          : 'No registrada',
      fechaNacimiento: _parseFechaNacimiento(datos['fechaNacimiento']),
      email: user['email'] as String? ?? '',
      wallet: wallet?.isNotEmpty == true ? wallet! : 'No asignada',
      did: didFromDb?.isNotEmpty == true
          ? didFromDb!
          : wallet?.isNotEmpty == true
          ? 'did:besu:${wallet!.toLowerCase()}'
          : 'No asignado',
    );
  }

  static DateTime? _parseFechaNacimiento(dynamic raw) {
    if (raw is! String || raw.trim().isEmpty) return null;

    final value = raw.trim();
    final isoMatch = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(value);
    if (isoMatch != null) {
      return DateTime(
        int.parse(isoMatch.group(1)!),
        int.parse(isoMatch.group(2)!),
        int.parse(isoMatch.group(3)!),
      );
    }

    final slashMatch = RegExp(r'^(\d{2})/(\d{2})/(\d{4})').firstMatch(value);
    if (slashMatch != null) {
      return DateTime(
        int.parse(slashMatch.group(3)!),
        int.parse(slashMatch.group(2)!),
        int.parse(slashMatch.group(1)!),
      );
    }

    return DateTime.tryParse(value);
  }
}
