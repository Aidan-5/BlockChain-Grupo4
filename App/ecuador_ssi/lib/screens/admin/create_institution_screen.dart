import 'package:flutter/material.dart';

import '../../services/institutions_service.dart';
import '../../theme/app_theme.dart';

/// Formulario "Nueva Institución": crea la institución Y su cuenta de
/// acceso (rol INSTITUCION) en una sola llamada (`POST /institutions`),
/// espejo del formulario de `AdminDashboard.tsx` en la web. Al guardar con
/// éxito, hace `pop(true)` para que la lista sepa que debe refrescarse.
class CreateInstitutionScreen extends StatefulWidget {
  const CreateInstitutionScreen({super.key});

  @override
  State<CreateInstitutionScreen> createState() =>
      _CreateInstitutionScreenState();
}

class _CreateInstitutionScreenState extends State<CreateInstitutionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nombreController = TextEditingController();
  final _tipoController = TextEditingController();
  final _walletController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _saving = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nombreController.dispose();
    _tipoController.dispose();
    _walletController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _errorMessage = null;
    });

    final result = await InstitutionsService.createInstitution(
      nombre: _nombreController.text.trim(),
      tipo: _tipoController.text.trim(),
      wallet: _walletController.text,
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;
    setState(() => _saving = false);

    if (result.containsKey('error')) {
      setState(() => _errorMessage = result['error'] as String);
      return;
    }

    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nueva Institución')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _nombreController,
                  enabled: !_saving,
                  decoration: const InputDecoration(
                    labelText: 'Nombre de la institución',
                    hintText: 'Ej. Registro Civil',
                    prefixIcon: Icon(Icons.account_balance_outlined),
                  ),
                  validator: (value) => (value == null || value.trim().isEmpty)
                      ? 'Ingresa el nombre de la institución'
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _tipoController,
                  enabled: !_saving,
                  decoration: const InputDecoration(
                    labelText: 'Tipo',
                    hintText: 'Ej. Gubernamental, Educativa...',
                    prefixIcon: Icon(Icons.category_outlined),
                  ),
                  validator: (value) => (value == null || value.trim().isEmpty)
                      ? 'Ingresa el tipo de institución'
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _walletController,
                  enabled: !_saving,
                  decoration: const InputDecoration(
                    labelText: 'Wallet (opcional)',
                    hintText: '0x...',
                    prefixIcon: Icon(Icons.account_balance_wallet_outlined),
                  ),
                ),
                const SizedBox(height: 24),
                const Divider(color: AppColors.glassBorder),
                const SizedBox(height: 8),
                const Text(
                  'Credenciales de acceso para el usuario de la institución '
                  '(rol INSTITUCION):',
                  style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailController,
                  enabled: !_saving,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(
                    labelText: 'Correo electrónico',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Ingresa el correo electrónico';
                    }
                    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value.trim())) {
                      return 'Correo no válido';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  enabled: !_saving,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Ingresa una contraseña';
                    }
                    if (value.length < 6) {
                      return 'Debe tener al menos 6 caracteres';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.error.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: AppColors.error,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: AppColors.error,
                              fontSize: 13.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                SizedBox(
                  height: 54,
                  child: ElevatedButton.icon(
                    onPressed: _saving ? null : _submit,
                    icon: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : const Icon(Icons.check_circle_outline),
                    label: Text(_saving ? 'Creando...' : 'Crear Institución'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
