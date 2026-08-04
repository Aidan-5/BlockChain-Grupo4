import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/session.dart';
import 'api_exception.dart';
import 'http_client_provider.dart';

/// Espejo de Backend/src/auth (AuthController/AuthService).
class AuthApi {
  AuthApi({http.Client? client}) : _client = client ?? HttpClientProvider.factory();

  final http.Client _client;

  Future<({String token, AuthUser user})> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$apiBaseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final body = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw ApiException(body['message'] as String? ?? 'Credenciales inválidas');
    }

    return (
      token: body['access_token'] as String,
      user: AuthUser.fromJson(body['user'] as Map<String, dynamic>),
    );
  }

  Future<String> register({
    required String nombre,
    required String email,
    required String password,
    String? identificacion,
    String? codigoSecreto,
  }) async {
    final response = await _client.post(
      Uri.parse('$apiBaseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'nombre': nombre,
        'email': email,
        'password': password,
        if (identificacion != null && identificacion.isNotEmpty)
          'identificacion': identificacion,
        if (codigoSecreto != null && codigoSecreto.isNotEmpty)
          'codigoSecreto': codigoSecreto,
      }),
    );

    final body = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw ApiException(body['message'] as String? ?? 'Error al registrar');
    }

    return body['rol'] as String? ?? 'CIUDADANO';
  }

  Map<String, dynamic> _decode(http.Response response) {
    if (response.body.isEmpty) return {};
    try {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }
}
