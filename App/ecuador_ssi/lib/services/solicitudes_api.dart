import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/solicitud.dart';
import 'api_exception.dart';
import 'http_client_provider.dart';

/// Espejo de Backend/src/solicitudes (SolicitudesController/Service).
class SolicitudesApi {
  SolicitudesApi({http.Client? client})
    : _client = client ?? HttpClientProvider.factory();

  final http.Client _client;

  Future<List<Solicitud>> findByUsuario(int usuarioId) async {
    final response = await _client.get(
      Uri.parse('$apiBaseUrl/solicitudes/usuario/$usuarioId'),
    );

    if (response.statusCode != 200) {
      throw const ApiException('No se pudo cargar tu billetera');
    }

    final list = jsonDecode(response.body) as List<dynamic>;
    return list
        .map((item) => Solicitud.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Solicitud> create({
    required int usuarioId,
    required String tipoCredencial,
    required Map<String, dynamic> datos,
  }) async {
    final response = await _client.post(
      Uri.parse('$apiBaseUrl/solicitudes'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'usuarioId': usuarioId,
        'tipoCredencial': tipoCredencial,
        'datosJSON': jsonEncode(datos),
      }),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw const ApiException('No se pudo enviar la solicitud');
    }

    return Solicitud.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }
}
