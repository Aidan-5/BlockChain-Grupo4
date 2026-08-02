import 'dart:math';

import 'package:flutter/material.dart';

import '../data/mock_institutions.dart';
import '../models/institucion.dart';
import '../models/wallet_document.dart';
import '../theme/app_theme.dart';

/// Formulario para añadir una nueva credencial a la billetera.
///
/// Esta primera versión trabaja solo con datos locales: la institución se
/// elige de una lista de instituciones autorizadas de ejemplo
/// (MockInstitutions) y se genera un hash de ejemplo en vez de llamar a
/// `POST /credentials` del backend.
class AddCredentialScreen extends StatefulWidget {
  const AddCredentialScreen({super.key});

  @override
  State<AddCredentialScreen> createState() => _AddCredentialScreenState();
}

class _AddCredentialScreenState extends State<AddCredentialScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tituloController = TextEditingController();
  Institucion? _institucionSeleccionada;
  bool _showInstitutionError = false;

  @override
  void dispose() {
    _tituloController.dispose();
    super.dispose();
  }

  void _submit() {
    final formValid = _formKey.currentState!.validate();
    final institucion = _institucionSeleccionada;

    setState(() => _showInstitutionError = institucion == null);

    if (!formValid || institucion == null) return;

    final document = WalletDocument(
      id: 'credencial-${DateTime.now().millisecondsSinceEpoch}',
      type: DocumentType.credencial,
      titulo: _tituloController.text.trim(),
      institucion: institucion.nombre,
      hashBlockchain: _generateMockHash(),
      emitidaEn: DateTime.now(),
      icon: Icons.workspace_premium_outlined,
      color: AppColors.primary,
    );

    Navigator.of(context).pop(document);
  }

  String _generateMockHash() {
    const chars = 'abcdef0123456789';
    final random = Random();
    return List.generate(
      64,
      (_) => chars[random.nextInt(chars.length)],
    ).join();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Añadir credencial')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text(
                'Registra una nueva credencial en tu billetera de '
                'identidad.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _tituloController,
                decoration: const InputDecoration(
                  labelText: 'Título de la credencial',
                  hintText: 'Ej. Título profesional',
                ),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? 'Ingresa un título'
                    : null,
              ),
              const SizedBox(height: 28),
              const Text(
                'Institución emisora',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Solo instituciones autorizadas pueden emitir credenciales '
                'verificables.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 16),
              ...MockInstitutions.authorized.map(
                (institucion) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _InstitutionTile(
                    institucion: institucion,
                    selected: _institucionSeleccionada?.id == institucion.id,
                    onTap: () => setState(() {
                      _institucionSeleccionada = institucion;
                      _showInstitutionError = false;
                    }),
                  ),
                ),
              ),
              if (_showInstitutionError)
                const Padding(
                  padding: EdgeInsets.only(top: 4, left: 4),
                  child: Text(
                    'Selecciona una institución emisora',
                    style: TextStyle(color: AppColors.error, fontSize: 12),
                  ),
                ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _submit,
                child: const Text('Guardar credencial'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InstitutionTile extends StatelessWidget {
  const _InstitutionTile({
    required this.institucion,
    required this.selected,
    required this.onTap,
  });

  final Institucion institucion;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: selected
            ? AppColors.primary.withValues(alpha: 0.06)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: selected ? AppColors.primary : AppColors.glassBorder,
          width: selected ? 1.5 : 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    institucion.icon,
                    color: AppColors.primary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        institucion.nombre,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMain,
                        ),
                      ),
                      Text(
                        institucion.tipo,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  selected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: selected ? AppColors.primary : AppColors.textMuted,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
