import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Datos del usuario autenticado, tal como quedan persistidos en el
/// almacenamiento seguro del dispositivo tras un login exitoso.
class SessionUser {
  const SessionUser({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
  });

  final int id;
  final String nombre;
  final String email;
  final String rol;
}

/// Envoltorio sobre `flutter_secure_storage` para persistir la sesión del
/// usuario (JWT + datos básicos) entre aperturas de la app.
///
/// Sigue el mismo estilo estático que [AuthService]/[ProfileService]: no hay
/// estado propio de instancia más allá del almacenamiento subyacente, así
/// que no hace falta instanciar la clase.
class SessionService {
  SessionService._();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const _keyToken = 'access_token';
  static const _keyUserId = 'user_id';
  static const _keyUserNombre = 'user_nombre';
  static const _keyUserEmail = 'user_email';
  static const _keyUserRol = 'user_rol';

  /// Guarda el token de acceso y los datos del usuario tras un login exitoso.
  static Future<void> saveSession({
    required String token,
    required int userId,
    required String userNombre,
    required String userEmail,
    required String userRol,
  }) async {
    await Future.wait([
      _storage.write(key: _keyToken, value: token),
      _storage.write(key: _keyUserId, value: userId.toString()),
      _storage.write(key: _keyUserNombre, value: userNombre),
      _storage.write(key: _keyUserEmail, value: userEmail),
      _storage.write(key: _keyUserRol, value: userRol),
    ]);
  }

  /// El JWT guardado, o `null` si no hay sesión activa.
  static Future<String?> getToken() => _storage.read(key: _keyToken);

  /// Los datos del usuario guardados, o `null` si no hay sesión activa.
  static Future<SessionUser?> getUser() async {
    final token = await getToken();
    if (token == null || token.isEmpty) return null;

    final idRaw = await _storage.read(key: _keyUserId);
    final nombre = await _storage.read(key: _keyUserNombre);
    final email = await _storage.read(key: _keyUserEmail);
    final rol = await _storage.read(key: _keyUserRol);

    return SessionUser(
      id: int.tryParse(idRaw ?? '') ?? 0,
      nombre: nombre ?? 'Ciudadano',
      email: email ?? '',
      rol: rol ?? 'CIUDADANO',
    );
  }

  /// `true` si hay una sesión guardada (token presente).
  static Future<bool> hasSession() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Borra la sesión guardada (logout).
  static Future<void> clearSession() async {
    await _storage.deleteAll();
  }
}
