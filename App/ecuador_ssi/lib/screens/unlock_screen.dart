import 'package:flutter/material.dart';

import '../services/biometric_auth_service.dart';
import '../services/session_service.dart';
import '../theme/app_theme.dart';
import 'home_router.dart';

/// Pantalla de desbloqueo rápido mostrada cuando la app se reabre y ya hay
/// una sesión guardada (evita pasar de nuevo por Onboarding/Login).
///
/// Nota de alcance: hoy no existe una preferencia persistida de "¿el
/// usuario activó huella/PIN?" (`security_screen.dart` solo mantiene ese
/// estado en memoria, ver comentario en ese archivo). Por eso el
/// desbloqueo biométrico aquí es "best effort": si el dispositivo lo
/// soporta se ofrece como atajo, pero siempre hay una salida para
/// continuar sin él — la sesión ya fue validada por el backend al hacer
/// login, así que no bloqueamos el acceso a la billetera por esto.
class UnlockScreen extends StatefulWidget {
  const UnlockScreen({
    super.key,
    required this.sessionUser,
    this.biometricAuth,
  });

  final SessionUser sessionUser;
  final BiometricAuthService? biometricAuth;

  @override
  State<UnlockScreen> createState() => _UnlockScreenState();
}

class _UnlockScreenState extends State<UnlockScreen> {
  late final BiometricAuthService _biometricAuth =
      widget.biometricAuth ?? BiometricAuthService();

  bool _authenticating = false;
  bool _checkingAvailability = true;
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    _biometricAuth.isAvailable().then((available) {
      if (!mounted) return;
      setState(() {
        _biometricAvailable = available;
        _checkingAvailability = false;
      });
    });
  }

  void _goToHome() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => homeScreenFor(widget.sessionUser)),
      (route) => false,
    );
  }

  Future<void> _unlockWithFingerprint() async {
    setState(() => _authenticating = true);
    final result = await _biometricAuth.authenticate(
      'Confirma tu huella digital para desbloquear tu billetera',
    );
    if (!mounted) return;
    setState(() => _authenticating = false);

    if (result.success) {
      _goToHome();
    } else if (result.message != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.message!)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.lock_outline_rounded,
                  size: 52,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Hola de nuevo, ${widget.sessionUser.nombre}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Desbloquea tu billetera para continuar.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: AppColors.textMuted),
              ),
              const SizedBox(height: 40),
              if (_biometricAvailable)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _authenticating ? null : _unlockWithFingerprint,
                    icon: _authenticating
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.fingerprint),
                    label: const Text('Usar huella digital'),
                  ),
                ),
              if (_biometricAvailable) const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _checkingAvailability ? null : _goToHome,
                  child: const Text('Continuar'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
