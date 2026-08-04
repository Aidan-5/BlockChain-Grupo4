class AuthUser {
  const AuthUser({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: json['id'] as int,
    nombre: json['nombre'] as String,
    email: json['email'] as String,
    rol: json['rol'] as String,
  );

  final int id;
  final String nombre;
  final String email;
  final String rol;
}

/// Sesión del usuario autenticado, en memoria durante la vida de la app.
///
/// No persiste entre reinicios (no hay flutter_secure_storage todavía);
/// al reabrir la app hay que iniciar sesión de nuevo, igual que el
/// frontend web pierde su estado en memoria al recargar la pestaña.
class AuthSession {
  AuthSession._();

  static final AuthSession instance = AuthSession._();

  String? token;
  AuthUser? user;

  bool get isAuthenticated => token != null && user != null;

  void set(String token, AuthUser user) {
    this.token = token;
    this.user = user;
  }

  void clear() {
    token = null;
    user = null;
  }
}
