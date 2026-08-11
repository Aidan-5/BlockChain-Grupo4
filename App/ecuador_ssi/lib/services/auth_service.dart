import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  // URL base del backend NestJS
  // En emulador Android, 10.0.2.2 apunta al localhost del PC host
  static const String _baseUrl = 'http://10.0.2.2:3000';

  /// Inicia sesión con email y contraseña.
  /// Devuelve el objeto de usuario si tiene éxito, null en caso de error.
  static Future<Map<String, dynamic>?> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
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
}
