import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Historial local (en el dispositivo) de códigos QR de identidad
/// escaneados. Vive por separado de [SessionService] porque no tiene nada
/// que ver con la sesión del usuario, solo es un registro local de uso.
class ScanHistoryService {
  ScanHistoryService._();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const _keyHistory = 'scan_history';
  static const _maxEntries = 50;

  /// Agrega un valor escaneado al historial (más reciente primero) y
  /// trunca a las últimas [_maxEntries] entradas.
  static Future<void> addScan(String valor) async {
    final history = await getHistory();
    history.insert(0, {
      'valor': valor,
      'timestamp': DateTime.now().toIso8601String(),
    });

    final truncated = history.length > _maxEntries
        ? history.sublist(0, _maxEntries)
        : history;

    await _storage.write(key: _keyHistory, value: jsonEncode(truncated));
  }

  /// Devuelve el historial guardado, más reciente primero. Lista vacía si
  /// no hay historial o si el contenido guardado está corrupto.
  static Future<List<Map<String, dynamic>>> getHistory() async {
    try {
      final raw = await _storage.read(key: _keyHistory);
      if (raw == null || raw.isEmpty) return [];

      final decoded = jsonDecode(raw);
      if (decoded is! List) return [];

      return decoded.whereType<Map<String, dynamic>>().toList();
    } catch (_) {
      return [];
    }
  }

  /// Borra todo el historial de escaneos.
  static Future<void> clearHistory() async {
    await _storage.delete(key: _keyHistory);
  }
}
