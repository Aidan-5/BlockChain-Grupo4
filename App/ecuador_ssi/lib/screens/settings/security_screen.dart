import 'package:flutter/material.dart';

import '../../services/biometric_auth_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

/// Preferencias de desbloqueo. El interruptor de huella dispara un reto real
/// contra `local_auth`; el de PIN sigue siendo solo estado local hasta que
/// se agregue almacenamiento persistente para el PIN.
class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key, this.biometricAuth});

  final BiometricAuthService? biometricAuth;

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  late final BiometricAuthService _biometricAuth =
      widget.biometricAuth ?? BiometricAuthService();

  bool _huellaActiva = false;
  bool _pinActivo = false;
  bool _biometricSupported = true;
  bool _checkingBiometric = false;

  @override
  void initState() {
    super.initState();
    _biometricAuth.isAvailable().then((available) {
      if (!mounted) return;
      setState(() => _biometricSupported = available);
    });
  }

  Future<void> _toggleHuella(bool value) async {
    if (!value) {
      setState(() => _huellaActiva = false);
      return;
    }

    setState(() => _checkingBiometric = true);
    final result = await _biometricAuth.authenticate(
      'Confirma tu huella digital para activar el desbloqueo',
    );
    if (!mounted) return;
    setState(() {
      _checkingBiometric = false;
      _huellaActiva = result.success;
    });

    if (!result.success && result.message != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.message!)));
    }
  }

  Future<void> _changePin() async {
    final controller = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cambiar PIN'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          maxLength: 6,
          obscureText: true,
          decoration: const InputDecoration(hintText: 'Nuevo PIN de 4 a 6 dígitos'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() => _pinActivo = true);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('PIN actualizado')),
              );
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Autenticación')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Elige cómo quieres desbloquear tu billetera de identidad.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 20),
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    value: _huellaActiva,
                    onChanged: _biometricSupported && !_checkingBiometric
                        ? _toggleHuella
                        : null,
                    secondary: _checkingBiometric
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(
                            Icons.fingerprint,
                            color: AppColors.primary,
                          ),
                    title: const Text('Usar huella digital'),
                    subtitle: _biometricSupported
                        ? null
                        : const Text('No disponible en este dispositivo'),
                  ),
                  const Divider(height: 1, color: AppColors.glassBorder),
                  SwitchListTile(
                    value: _pinActivo,
                    onChanged: (value) => setState(() => _pinActivo = value),
                    secondary: const Icon(
                      Icons.pin_outlined,
                      color: AppColors.primary,
                    ),
                    title: const Text('Usar PIN'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: _changePin,
              icon: const Icon(Icons.lock_reset_outlined),
              label: const Text('Cambiar PIN'),
            ),
          ],
        ),
      ),
    );
  }
}
