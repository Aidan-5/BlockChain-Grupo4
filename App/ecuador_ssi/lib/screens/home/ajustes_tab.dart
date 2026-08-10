import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../onboarding_screen.dart';
import '../settings/backup_screen.dart';
import '../settings/help_screen.dart';
import '../settings/language_screen.dart';
import '../settings/profile_screen.dart';
import '../settings/security_screen.dart';
import '../settings/usage_history_screen.dart';

class AjustesTab extends StatelessWidget {
  const AjustesTab({super.key, required this.userId});

  final int userId;

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  void _logout(BuildContext context) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const OnboardingScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Ajustes',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppColors.textMain,
          ),
        ),
        const SizedBox(height: 20),
        GlassCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _SettingsTile(
                icon: Icons.person_outline,
                label: 'Mi perfil',
                onTap: () => _open(context, ProfileScreen(userId: userId)),
              ),
              const _TileDivider(),
              _SettingsTile(
                icon: Icons.fingerprint,
                label: 'Autenticación (PIN/Huella)',
                onTap: () => _open(context, const SecurityScreen()),
              ),
              const _TileDivider(),
              _SettingsTile(
                icon: Icons.backup_outlined,
                label: 'Copia de seguridad',
                onTap: () => _open(context, const BackupScreen()),
              ),
              const _TileDivider(),
              _SettingsTile(
                icon: Icons.history,
                label: 'Historial de uso',
                onTap: () => _open(context, const UsageHistoryScreen()),
              ),
              const _TileDivider(),
              _SettingsTile(
                icon: Icons.language_outlined,
                label: 'Idioma',
                trailingText: 'Español',
                onTap: () => _open(context, const LanguageScreen()),
              ),
              const _TileDivider(),
              _SettingsTile(
                icon: Icons.help_outline,
                label: 'Ayuda y soporte',
                onTap: () => _open(context, const HelpScreen()),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        GlassCard(
          padding: EdgeInsets.zero,
          child: _SettingsTile(
            icon: Icons.logout,
            label: 'Cerrar sesión',
            color: AppColors.error,
            onTap: () => _logout(context),
          ),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = AppColors.textMain,
    this.trailingText,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;
  final String? trailingText;

  @override
  Widget build(BuildContext context) {
    final isDestructive = color == AppColors.error;

    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: color),
      title: Text(label, style: TextStyle(color: color)),
      trailing: isDestructive
          ? null
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (trailingText != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Text(
                      trailingText!,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 13,
                      ),
                    ),
                  ),
                const Icon(Icons.chevron_right, color: AppColors.textMuted),
              ],
            ),
    );
  }
}

class _TileDivider extends StatelessWidget {
  const _TileDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, color: AppColors.glassBorder);
  }
}
