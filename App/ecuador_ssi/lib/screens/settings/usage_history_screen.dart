import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

class _HistoryEntry {
  const _HistoryEntry({
    required this.icon,
    required this.title,
    required this.timestamp,
  });

  final IconData icon;
  final String title;
  final DateTime timestamp;
}

class UsageHistoryScreen extends StatelessWidget {
  const UsageHistoryScreen({super.key});

  static final List<_HistoryEntry> _entries = [
    _HistoryEntry(
      icon: Icons.qr_code_rounded,
      title: 'Compartiste tu identidad (Cédula de Identidad)',
      timestamp: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    _HistoryEntry(
      icon: Icons.qr_code_scanner_outlined,
      title: 'Escaneaste una credencial',
      timestamp: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
    ),
    _HistoryEntry(
      icon: Icons.workspace_premium_outlined,
      title: 'Se añadió la credencial "Título profesional"',
      timestamp: DateTime.now().subtract(const Duration(days: 2)),
    ),
    _HistoryEntry(
      icon: Icons.fingerprint,
      title: 'Inicio de sesión con huella digital',
      timestamp: DateTime.now().subtract(const Duration(days: 3, hours: 5)),
    ),
    _HistoryEntry(
      icon: Icons.backup_outlined,
      title: 'Copia de seguridad realizada',
      timestamp: DateTime.now().subtract(const Duration(days: 12)),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Historial de uso')),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: _entries.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final entry = _entries[index];
            return GlassCard(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      entry.icon,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMain,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatRelative(entry.timestamp),
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  static String _formatRelative(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inHours < 1) return 'Hace ${diff.inMinutes} min';
    if (diff.inDays < 1) return 'Hace ${diff.inHours} h';
    return 'Hace ${diff.inDays} días';
  }
}
