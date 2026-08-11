import 'package:flutter/material.dart';

import 'screens/onboarding_screen.dart';
import 'screens/unlock_screen.dart';
import 'services/session_service.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ecuador SSI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const AppEntryPoint(),
    );
  }
}

/// Decide la pantalla inicial según si hay una sesión guardada.
///
/// `MaterialApp.home` no admite un `Future` directamente, así que la
/// resolución async se hace acá con un `FutureBuilder`: mientras se
/// consulta el almacenamiento seguro se muestra un splash simple; ya
/// resuelto, se manda a [UnlockScreen] (sesión existente) o
/// [OnboardingScreen] (primera vez / sesión cerrada).
class AppEntryPoint extends StatelessWidget {
  const AppEntryPoint({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<SessionUser?>(
      future: SessionService.getUser(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final sessionUser = snapshot.data;
        if (sessionUser == null) {
          return const OnboardingScreen();
        }
        return UnlockScreen(sessionUser: sessionUser);
      },
    );
  }
}
