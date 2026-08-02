import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

/// Preferencias de desbloqueo. Los interruptores solo reflejan estado local
/// en esta primera versión — la validación real de huella/PIN se agrega
/// cuando se conecte `local_auth` / `flutter_secure_storage`.
class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  bool _huellaActiva = true;
  bool _pinActivo = false;

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
                    onChanged: (value) => setState(() => _huellaActiva = value),
                    secondary: const Icon(
                      Icons.fingerprint,
                      color: AppColors.primary,
                    ),
                    title: const Text('Usar huella digital'),
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
