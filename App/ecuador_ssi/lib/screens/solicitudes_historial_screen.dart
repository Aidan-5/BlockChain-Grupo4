import 'package:flutter/material.dart';

import '../services/solicitudes_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Historial de solicitudes de identidad (cédula/discapacidad) hechas por el
/// ciudadano, con su estado de aprobación (`Backend/src/solicitudes`).
class SolicitudesHistorialScreen extends StatefulWidget {
  const SolicitudesHistorialScreen({super.key, required this.userId});

  final int userId;

  @override
  State<SolicitudesHistorialScreen> createState() =>
      _SolicitudesHistorialScreenState();
}

class _SolicitudesHistorialScreenState
    extends State<SolicitudesHistorialScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = SolicitudesService.fetchSolicitudes(widget.userId);
  }

  void _reload() {
    setState(() => _future = SolicitudesService.fetchSolicitudes(widget.userId));
  }

  static const _colorAprobada = Color(0xFF10B981);
  static const _colorPendiente = Color(0xFFD97706);

  static String _formatDate(dynamic raw) {
    final parsed = raw is String ? DateTime.tryParse(raw) : null;
    if (parsed == null) return '--/--/----';
    final day = parsed.day.toString().padLeft(2, '0');
    final month = parsed.month.toString().padLeft(2, '0');
    return '$day/$month/${parsed.year}';
  }

  static String _tipoLabel(String? tipo) {
    switch (tipo) {
      case 'CEDULA':
        return 'Cédula de Identidad';
      case 'DISCAPACIDAD':
        return 'Carnet de Discapacidad';
      default:
        return tipo ?? 'Solicitud';
    }
  }

  static String _estadoLabel(String? estado) {
    switch (estado) {
      case 'APROBADA':
        return 'Aprobada';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'RECHAZADA':
        return 'Rechazada';
      default:
        return estado ?? 'Desconocido';
    }
  }

  static Color _estadoColor(String? estado) {
    switch (estado) {
      case 'APROBADA':
        return _colorAprobada;
      case 'PENDIENTE':
        return _colorPendiente;
      case 'RECHAZADA':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Historial de solicitudes')),
      body: SafeArea(
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              );
            }

            final solicitudes = snapshot.data ?? [];

            if (solicitudes.isEmpty) {
              return _EmptyState(onRetry: _reload);
            }

            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: solicitudes.length,
                separatorBuilder: (_, _) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final solicitud = solicitudes[index];
                  final estado = solicitud['estado'] as String?;
                  final institucion =
                      (solicitud['institucion']
                              as Map<String, dynamic>?)?['nombre']
                          as String? ??
                      'Institución no disponible';

                  return GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                _tipoLabel(
                                  solicitud['tipoCredencial'] as String?,
                                ),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textMain,
                                ),
                              ),
                            ),
                            _EstadoPill(
                              label: _estadoLabel(estado),
                              color: _estadoColor(estado),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          institucion,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Solicitada el ${_formatDate(solicitud['createdAt'])}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

class _EstadoPill extends StatelessWidget {
  const _EstadoPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.inbox_outlined,
              size: 48,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 16),
            const Text(
              'No tienes solicitudes registradas',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textMain,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Cuando pidas una cédula o carnet de discapacidad desde la '
              'plataforma web, el estado aparecerá aquí.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Actualizar'),
            ),
          ],
        ),
      ),
    );
  }
}
