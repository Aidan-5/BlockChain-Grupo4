import 'package:flutter/material.dart';

import '../services/scan_history_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Historial local de códigos QR de identidad escaneados con este
/// dispositivo (ver [ScanHistoryService]).
class ScanHistoryScreen extends StatefulWidget {
  const ScanHistoryScreen({super.key});

  @override
  State<ScanHistoryScreen> createState() => _ScanHistoryScreenState();
}

class _ScanHistoryScreenState extends State<ScanHistoryScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = ScanHistoryService.getHistory();
  }

  void _reload() {
    setState(() => _future = ScanHistoryService.getHistory());
  }

  Future<void> _confirmClear() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Limpiar historial'),
        content: const Text(
          '¿Seguro que quieres borrar todo el historial de escaneos de '
          'este dispositivo? Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text(
              'Limpiar',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await ScanHistoryService.clearHistory();
    _reload();
  }

  static String _truncate(String value, {int maxLength = 36}) {
    if (value.length <= maxLength) return value;
    return '${value.substring(0, maxLength)}…';
  }

  static String _formatTimestamp(String? raw) {
    final parsed = raw == null ? null : DateTime.tryParse(raw);
    if (parsed == null) return '';
    final day = parsed.day.toString().padLeft(2, '0');
    final month = parsed.month.toString().padLeft(2, '0');
    final hour = parsed.hour.toString().padLeft(2, '0');
    final minute = parsed.minute.toString().padLeft(2, '0');
    return '$day/$month/${parsed.year} · $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial de escaneos'),
        actions: [
          IconButton(
            onPressed: _confirmClear,
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Limpiar historial',
          ),
        ],
      ),
      body: SafeArea(
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              );
            }

            final entries = snapshot.data ?? [];

            if (entries.isEmpty) {
              return const _EmptyScanHistory();
            }

            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: entries.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final entry = entries[index];
                final valor = entry['valor'] as String? ?? '';
                return GlassCard(
                  child: Row(
                    children: [
                      const Icon(
                        Icons.qr_code_rounded,
                        color: AppColors.primary,
                        size: 22,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _truncate(valor),
                              style: const TextStyle(
                                fontSize: 13,
                                fontFamily: 'monospace',
                                color: AppColors.textMain,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatTimestamp(entry['timestamp'] as String?),
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
            );
          },
        ),
      ),
    );
  }
}

class _EmptyScanHistory extends StatelessWidget {
  const _EmptyScanHistory();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.qr_code_scanner_outlined,
              size: 48,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 16),
            const Text(
              'Sin escaneos todavía',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textMain,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Los códigos QR de identidad que escanees aparecerán en '
              'este historial local del dispositivo.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}
