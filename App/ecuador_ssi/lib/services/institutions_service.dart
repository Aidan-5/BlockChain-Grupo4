import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config_service.dart';
import 'session_service.dart';

/// Consulta instituciones autorizadas y el catálogo de atributos de
/// identidad (`Backend/src/institutions`) para poblar el formulario de
/// "Solicitar Identidad" y el detalle de una credencial en la Billetera.
class InstitutionsService {
  /// Instituciones visibles para el usuario autenticado. El backend ya
  /// filtra a `activo: true` cuando el rol es CIUDADANO. Cada institución
  /// trae `{id, nombre, tipo, wallet, activo, atributos: string[]}`.
  /// Devuelve una lista vacía si no hay sesión o si ocurre cualquier error
  /// de red/parseo (no revienta la UI).
  static Future<List<Map<String, dynamic>>> fetchInstitutions() async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {if (token != null) 'Authorization': 'Bearer $token'};

      final response = await http
          .get(Uri.parse('$baseUrl/institutions'), headers: headers)
          .timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) return [];

      final decoded = jsonDecode(response.body);
      if (decoded is! List) return [];

      return decoded.whereType<Map<String, dynamic>>().toList();
    } catch (_) {
      return [];
    }
  }

  /// Catálogo fijo de atributos de identidad: `[{clave, etiqueta, tipo}]`,
  /// usado tanto para armar los campos dinámicos del formulario de solicitud
  /// como para traducir claves a etiquetas legibles en el detalle de una
  /// credencial.
  static Future<List<Map<String, dynamic>>> fetchAtributosCatalogo() async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {if (token != null) 'Authorization': 'Bearer $token'};

      final response = await http
          .get(
            Uri.parse('$baseUrl/institutions/atributos-catalogo'),
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

  /// Trámites activos que ofrece la institución `institucionId`.
  static Future<List<Map<String, dynamic>>> fetchTramites(
    int institucionId,
  ) async {
    if (institucionId <= 0) return [];

    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {if (token != null) 'Authorization': 'Bearer $token'};

      final response = await http
          .get(
            Uri.parse('$baseUrl/institutions/$institucionId/tramites'),
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

  /// Crea una institución y, en la misma transacción del backend, su cuenta
  /// de acceso vinculada (rol INSTITUCION). Solo ADMIN puede llamar esto.
  /// Devuelve la institución creada, o `{'error': mensaje}` si algo falla
  /// (red, validación del backend, etc.) para que la UI pueda mostrarlo.
  static Future<Map<String, dynamic>> createInstitution({
    required String nombre,
    required String tipo,
    String? wallet,
    required String email,
    required String password,
  }) async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      final body = {
        'nombre': nombre,
        'tipo': tipo,
        'email': email,
        'password': password,
        if (wallet != null && wallet.trim().isNotEmpty)
          'wallet': wallet.trim(),
      };

      final response = await http
          .post(
            Uri.parse('$baseUrl/institutions'),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      return _parseWriteResponse(response, 'Error al crear la institución');
    } catch (_) {
      return {'error': 'No se pudo conectar al servidor. Verifica tu conexión.'};
    }
  }

  /// Edita una institución existente. `atributos`, cuando se envía,
  /// REEMPLAZA todo el set de atributos habilitados (no es incremental) —
  /// así lo define el backend. `activo: false` suspende (bloquea login) la
  /// cuenta de la institución vinculada.
  static Future<Map<String, dynamic>> updateInstitution(
    int institucionId, {
    String? nombre,
    String? tipo,
    String? wallet,
    bool? activo,
    List<String>? atributos,
  }) async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      final body = {
        'nombre': ?nombre,
        'tipo': ?tipo,
        'wallet': ?wallet,
        'activo': ?activo,
        'atributos': ?atributos,
      };

      final response = await http
          .patch(
            Uri.parse('$baseUrl/institutions/$institucionId'),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      return _parseWriteResponse(response, 'Error al actualizar la institución');
    } catch (_) {
      return {'error': 'No se pudo conectar al servidor. Verifica tu conexión.'};
    }
  }

  /// Elimina la institución y su cuenta de acceso vinculada. Devuelve `true`
  /// si el backend confirmó la eliminación.
  static Future<bool> deleteInstitution(int institucionId) async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {if (token != null) 'Authorization': 'Bearer $token'};

      final response = await http
          .delete(
            Uri.parse('$baseUrl/institutions/$institucionId'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return false;
    }
  }

  /// Crea un trámite para la institución `institucionId`.
  static Future<Map<String, dynamic>> createTramite(
    int institucionId, {
    required String nombre,
    String? descripcion,
  }) async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      final body = {
        'nombre': nombre,
        if (descripcion != null && descripcion.trim().isNotEmpty)
          'descripcion': descripcion.trim(),
      };

      final response = await http
          .post(
            Uri.parse('$baseUrl/institutions/$institucionId/tramites'),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      return _parseWriteResponse(response, 'Error al crear el trámite');
    } catch (_) {
      return {'error': 'No se pudo conectar al servidor. Verifica tu conexión.'};
    }
  }

  /// Edita, activa o desactiva un trámite existente.
  static Future<Map<String, dynamic>> updateTramite(
    int institucionId,
    int tramiteId, {
    String? nombre,
    String? descripcion,
    bool? activo,
  }) async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      final body = {
        'nombre': ?nombre,
        'descripcion': ?descripcion,
        'activo': ?activo,
      };

      final response = await http
          .patch(
            Uri.parse(
              '$baseUrl/institutions/$institucionId/tramites/$tramiteId',
            ),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));

      return _parseWriteResponse(response, 'Error al actualizar el trámite');
    } catch (_) {
      return {'error': 'No se pudo conectar al servidor. Verifica tu conexión.'};
    }
  }

  /// Elimina un trámite. Devuelve `true` si el backend confirmó la
  /// eliminación.
  static Future<bool> deleteTramite(int institucionId, int tramiteId) async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {if (token != null) 'Authorization': 'Bearer $token'};

      final response = await http
          .delete(
            Uri.parse(
              '$baseUrl/institutions/$institucionId/tramites/$tramiteId',
            ),
            headers: headers,
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (_) {
      return false;
    }
  }

  /// Helper común para POST/PATCH: en éxito devuelve el recurso decodificado,
  /// en error intenta leer `message` del cuerpo del backend (Nest suele
  /// devolver `{statusCode, message, error}`) y si no puede, usa
  /// [fallbackMessage].
  static Map<String, dynamic> _parseWriteResponse(
    http.Response response,
    String fallbackMessage,
  ) {
    dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      decoded = null;
    }

    if (response.statusCode == 200 || response.statusCode == 201) {
      return decoded is Map<String, dynamic> ? decoded : {};
    }

    final message = decoded is Map && decoded['message'] != null
        ? decoded['message'].toString()
        : fallbackMessage;
    return {'error': message};
  }
}
