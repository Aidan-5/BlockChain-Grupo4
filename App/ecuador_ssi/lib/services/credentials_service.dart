import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../models/wallet_document.dart';
import '../theme/app_theme.dart';
import 'api_config_service.dart';
import 'session_service.dart';

/// Consulta las credenciales reales del ciudadano (`Backend/src/credentials`)
/// para poblar la Billetera con datos del backend en lugar del mock.
class CredentialsService {
  /// Trae las credenciales emitidas al usuario `userId`.
  /// Devuelve una lista vacía si no hay sesión, si el userId es inválido o
  /// si ocurre cualquier error de red/parseo (no revienta la UI).
  static Future<List<Map<String, dynamic>>> fetchCredenciales(
    int userId,
  ) async {
    if (userId <= 0) return [];

    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final headers = {if (token != null) 'Authorization': 'Bearer $token'};

      final response = await http
          .get(
            Uri.parse('$baseUrl/credentials/usuario/$userId'),
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

  /// Convierte una credencial cruda del backend en un [WalletDocument] para
  /// la UI, infiriendo tipo/ícono/color a partir del `titulo`.
  static WalletDocument toWalletDocument(Map<String, dynamic> raw) {
    final titulo = raw['titulo'] as String? ?? 'Credencial';
    final institucionRaw = raw['institucion'] as Map<String, dynamic>?;
    final institucion =
        institucionRaw?['nombre'] as String? ?? 'Institución emisora';
    final institucionId = institucionRaw?['id'] is int
        ? institucionRaw!['id'] as int
        : null;
    final hashBlockchain = raw['hashBlockchain'] as String? ?? '';
    final emitidaEn =
        DateTime.tryParse(raw['emitidaEn'] as String? ?? '') ?? DateTime.now();
    final datosJSON = _parseDatosJSON(raw);

    final tituloLower = titulo.toLowerCase();
    late final DocumentType type;
    late final IconData icon;
    late final Color color;

    if (tituloLower.contains('cédula') || tituloLower.contains('cedula')) {
      type = DocumentType.cedula;
      icon = Icons.badge_outlined;
      color = const Color(0xFF3B82F6);
    } else if (tituloLower.contains('discapacidad')) {
      type = DocumentType.discapacidad;
      icon = Icons.accessible_outlined;
      color = const Color(0xFF10B981);
    } else {
      type = DocumentType.credencial;
      icon = Icons.workspace_premium_outlined;
      color = AppColors.primary;
    }

    return WalletDocument(
      id: (raw['id'] ?? '').toString(),
      type: type,
      titulo: titulo,
      institucion: institucion,
      hashBlockchain: hashBlockchain,
      emitidaEn: emitidaEn,
      icon: icon,
      color: color,
      institucionId: institucionId,
      datosJSON: datosJSON,
    );
  }

  /// Parsea `Solicitud.datosJSON` (los atributos de identidad que el
  /// ciudadano llenó al pedir esta credencial) desde la credencial cruda del
  /// backend. Devuelve null si la credencial no tiene solicitud asociada, si
  /// `datosJSON` está vacío, o si el string no es un JSON de objeto válido.
  static Map<String, dynamic>? _parseDatosJSON(Map<String, dynamic> raw) {
    final solicitud = raw['solicitud'] as Map<String, dynamic>?;
    final datosJSON = solicitud?['datosJSON'] as String?;
    if (datosJSON == null || datosJSON.isEmpty) return null;

    try {
      final decoded = jsonDecode(datosJSON);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) {
      return null;
    }
  }
}
