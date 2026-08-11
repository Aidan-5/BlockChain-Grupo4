import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config_service.dart';
import 'session_service.dart';

/// Consulta el historial de solicitudes de identidad del ciudadano
/// (`Backend/src/solicitudes`): pedidos de cédula/discapacidad y su estado
/// de aprobación.
class SolicitudesService {
  /// Trae las solicitudes creadas por el usuario `userId`.
  /// Devuelve una lista vacía si no hay sesión, si el userId es inválido o
  /// si ocurre cualquier error de red/parseo (no revienta la UI).
  static Future<List<Map<String, dynamic>>> fetchSolicitudes(
    int userId,
  ) async {
    if (userId <= 0) return [];

    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {if (token != null) 'Authorization': 'Bearer $token'};

      final response = await http
          .get(
            Uri.parse('$baseUrl/solicitudes/usuario/$userId'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) return [];

      final decoded = jsonDecode(response.body);
      if (decoded is! List) return [];

      return decoded.whereType<Map<String, dynamic>>().toList();
    } catch (_) {
      return [];
    }
  }
}
