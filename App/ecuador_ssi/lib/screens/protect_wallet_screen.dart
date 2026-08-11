import 'package:flutter/material.dart';

import '../services/biometric_auth_service.dart';
import '../services/session_service.dart';
import '../theme/app_theme.dart';
import 'home_router.dart';

/// Paso de configuración del segundo factor local (huella/PIN), mostrado
/// justo después de un login exitoso contra el backend. Requiere el
/// [SessionUser] recién autenticado para poder resolver, vía
/// [homeScreenFor], la pantalla principal correcta según su rol.
class ProtectWalletScreen extends StatefulWidget {
  const ProtectWalletScreen({
    super.key,
    required this.sessionUser,
    this.biometricAuth,
  });

  final SessionUser sessionUser;
  final BiometricAuthService? biometricAuth;

  @override
  State<ProtectWalletScreen> createState() => _ProtectWalletScreenState();
}

class _ProtectWalletScreenState extends State<ProtectWalletScreen> {
  late final BiometricAuthService _biometricAuth =
      widget.biometricAuth ?? BiometricAuthService();
  bool _authenticating = false;

  void _goToHome() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => homeScreenFor(widget.sessionUser)),
      (route) => false,
    );
  }

  Future<void> _useFingerprint() async {
    setState(() => _authenticating = true);
    final result = await _biometricAuth.authenticate(
      'Confirma tu huella digital para acceder a tu billetera',
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
                  color: AppColors.accent.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.shield_outlined,
                  size: 56,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 40),
              const Text(
                'Protege tu billetera',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Elige cómo quieres acceder a tu billetera de identidad '
                'o inicia sesión con tu cuenta.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: AppColors.textMuted,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 56),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _authenticating ? null : _useFingerprint,
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
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _goToHome,
                  icon: const Icon(Icons.pin_outlined),
                  label: const Text('Crear PIN'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
