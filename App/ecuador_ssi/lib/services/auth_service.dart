import 'dart:convert';
import 'package:http/http.dart' as http;

import 'api_config_service.dart';
import 'session_service.dart';

class AuthService {
  /// Inicia sesión con email y contraseña.
  /// Devuelve el objeto de usuario si tiene éxito, null en caso de error.
  /// En éxito, además persiste la sesión (token + datos del usuario) vía
  /// [SessionService] para que la app no vuelva a pedir login mientras el
  /// token siga guardado.
  static Future<Map<String, dynamic>?> login({
    required String email,
    required String password,
  }) async {
    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;

        // La app móvil es exclusiva para CIUDADANO/ADMIN. Las cuentas
        // INSTITUCION gestionan credenciales desde la plataforma web, así
        // que ni siquiera persistimos la sesión en ese caso.
        final user = data['user'] as Map<String, dynamic>?;
        if (user?['rol'] == 'INSTITUCION') {
          return {
            'error':
                'Este rol no tiene acceso desde la app móvil. Usa la plataforma web.',
          };
        }

        await _persistSession(data);
        return data; // contiene access_token y user { id, nombre, email, rol }
      } else {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return {
          'error': data['message'] ?? 'Credenciales inválidas',
        };
      }
    } catch (e) {
      return {'error': 'No se pudo conectar al servidor. Verifica tu conexión.'};
    }
  }

  /// Guarda el token y los datos del usuario devueltos por `/auth/login`.
  /// Si la respuesta no trae la forma esperada, no revienta el login: la
  /// pantalla igual navega, solo que la sesión no quedará persistida.
  static Future<void> _persistSession(Map<String, dynamic> data) async {
    final token = data['access_token'] as String?;
    final user = data['user'] as Map<String, dynamic>?;
    if (token == null || user == null) return;

    await SessionService.saveSession(
      token: token,
      userId: user['id'] is int ? user['id'] as int : 0,
      userNombre: user['nombre'] as String? ?? 'Ciudadano',
      userEmail: user['email'] as String? ?? '',
      userRol: user['rol'] as String? ?? 'CIUDADANO',
    );
  }
}
