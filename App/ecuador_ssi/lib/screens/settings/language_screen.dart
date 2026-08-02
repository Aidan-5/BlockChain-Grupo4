import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

/// Selector de idioma. Por ahora la app solo está disponible en español;
/// las demás opciones quedan listadas pero deshabilitadas ("Próximamente")
/// en vez de ocultarse.
class LanguageScreen extends StatelessWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Idioma')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  const ListTile(
                    leading: Icon(Icons.check_circle, color: AppColors.primary),
                    title: Text('Español'),
                    subtitle: Text('Idioma actual'),
                  ),
                  const Divider(height: 1, color: AppColors.glassBorder),
                  _DisabledLanguageTile(label: 'English'),
                  const Divider(height: 1, color: AppColors.glassBorder),
                  _DisabledLanguageTile(label: 'Kichwa'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Ecuador SSI está disponible solo en español por ahora. '
              'Pronto añadiremos más idiomas.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _DisabledLanguageTile extends StatelessWidget {
  const _DisabledLanguageTile({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      enabled: false,
      leading: const Icon(Icons.radio_button_unchecked, color: AppColors.textMuted),
      title: Text(label),
      trailing: const Text(
        'Próximamente',
        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
      ),
    );
  }
}
