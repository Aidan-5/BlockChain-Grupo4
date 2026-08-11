import 'package:flutter/material.dart';

import '../services/session_service.dart';
import 'admin/admin_home_shell.dart';
import 'home/home_shell.dart';

/// Punto único de decisión de a qué pantalla principal navegar tras un
/// login/desbloqueo exitoso, según el rol del usuario autenticado.
///
/// Antes de esto, `protect_wallet_screen.dart` y `unlock_screen.dart`
/// navegaban siempre a [HomeShell] sin mirar el rol, lo cual está mal para
/// una cuenta ADMIN (no tiene billetera ni nada que escanear). Ambos puntos
/// de entrada ahora construyen el widget correcto llamando a esta función
/// dentro del mismo `MaterialPageRoute`/`pushAndRemoveUntil` que ya tenían.
Widget homeScreenFor(SessionUser user) {
  if (user.rol == 'ADMIN') {
    return AdminHomeShell(sessionUser: user);
  }

  return HomeShell(
    userName: user.nombre,
    userEmail: user.email,
    userRol: user.rol,
    userId: user.id,
  );
}
