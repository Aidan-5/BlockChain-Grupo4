import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/// Servicio centralizado para la URL base del backend.
///
/// Antes, cada servicio (`AuthService`, `ProfileService`, etc.) tenía su
/// propia constante `_baseUrl` hardcodeada con la IP de red local del PC
/// donde corre el backend. Cada vez que el usuario cambiaba de red (WiFi de
/// casa, WiFi de una institución) esa IP cambiaba y rompía la app hasta que
/// alguien editaba el código y recompilaba.
///
/// Ahora la URL se guarda en `flutter_secure_storage` (mismo patrón que
/// [SessionService]/[ScanHistoryService]) y el usuario puede actualizarla
/// desde `ServerConfigScreen` sin depender de un cambio de código.
class ApiConfigService {
  ApiConfigService._();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const _keyBaseUrl = 'api_base_url';

  /// IP de red local conocida de la PC del usuario al momento de introducir
  /// esta configuración. Solo se usa como valor inicial la primera vez que
  /// se abre la app (antes de que el usuario guarde una URL propia) — el
  /// punto de esta clase es justamente que ya no haga falta hardcodear la
  /// IP en ningún otro archivo.
  static const _defaultBaseUrl = 'http://172.16.64.61:3000';

  /// Devuelve la URL base guardada, o [_defaultBaseUrl] si el usuario todavía
  /// no configuró ninguna.
  static Future<String> getBaseUrl() async {
    final saved = await _storage.read(key: _keyBaseUrl);
    if (saved == null || saved.trim().isEmpty) return _defaultBaseUrl;
    return saved.trim();
  }

  /// Guarda la URL base, tras una validación mínima: no vacía, sin espacios,
  /// sin `/` final, y con esquema `http://` si el usuario no escribió
  /// ninguno.
  static Future<void> setBaseUrl(String url) async {
    final normalized = _normalize(url);
    if (normalized.isEmpty) {
      throw ArgumentError('La URL del servidor no puede estar vacía.');
    }
    await _storage.write(key: _keyBaseUrl, value: normalized);
  }

  static String _normalize(String url) {
    var value = url.trim();
    if (value.isEmpty) return '';

    // Sin espacios internos (ej. pegado accidental con saltos de línea).
    value = value.replaceAll(RegExp(r'\s+'), '');
    if (value.isEmpty) return '';

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'http://$value';
    }

    // Sin `/` final para que la concatenación `$_baseUrl/ruta` en cada
    // servicio no termine con `//ruta`.
    while (value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }

    return value;
  }

  /// Prueba si hay conexión con el backend en [url] (o con la URL guardada
  /// si no se pasa ninguna).
  ///
  /// Devuelve `true` ante CUALQUIER respuesta HTTP del servidor (200, 401,
  /// 404, etc.) — eso confirma que la app SÍ pudo alcanzar el servidor,
  /// aunque la ruta específica falle o requiera autenticación. Devuelve
  /// `false` solo ante timeout o error de red (host inalcanzable, DNS,
  /// conexión rechazada), que es lo que realmente indica "no se pudo
  /// conectar".
  static Future<bool> testConnection([String? url]) async {
    final base = url != null && url.trim().isNotEmpty
        ? _normalize(url)
        : await getBaseUrl();
    if (base.isEmpty) return false;

    try {
      // `GET /` es la ruta raíz pública de Nest (AppController.getHello),
      // no requiere auth.
      await http.get(Uri.parse(base)).timeout(const Duration(seconds: 5));
      return true;
    } catch (_) {
      return false;
    }
  }
}
