import 'package:flutter/material.dart';

import '../../models/session.dart';
import '../../models/solicitud.dart';
import '../../services/solicitudes_api.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../solicitar_identidad_screen.dart';
import '../solicitud_detail_screen.dart';

/// Espejo de Frontend/src/pages/Wallet.tsx: separa las solicitudes
/// aprobadas (credenciales activas) de las pendientes (en revisión),
/// consumiendo `GET /solicitudes/usuario/:id`.
class WalletTab extends StatefulWidget {
  const WalletTab({super.key, this.solicitudesApi});

  final SolicitudesApi? solicitudesApi;

  @override
  State<WalletTab> createState() => _WalletTabState();
}

class _WalletTabState extends State<WalletTab> {
  late final SolicitudesApi _api = widget.solicitudesApi ?? SolicitudesApi();
  late Future<List<Solicitud>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Solicitud>> _load() {
    final usuario = AuthSession.instance.user!;
    return _api.findByUsuario(usuario.id);
  }

  Future<void> _refresh() async {
    final future = _load();
    setState(() => _future = future);
    await future;
  }

  Future<void> _openSolicitarIdentidad() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const SolicitarIdentidadScreen()),
    );
    if (created == true) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final usuario = AuthSession.instance.user!;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<Solicitud>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return _ErrorState(onRetry: _refresh);
          }

          final solicitudes = snapshot.data ?? [];
          final aprobadas = solicitudes
              .where((s) => s.estado == EstadoSolicitud.aprobada)
              .toList();
          final pendientes = solicitudes
              .where((s) => s.estado == EstadoSolicitud.pendiente)
              .toList();

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Mi Billetera',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMain,
                    ),
                  ),
                  IconButton(
                    onPressed: _openSolicitarIdentidad,
                    icon: const Icon(Icons.add_circle_outline),
                    color: AppColors.primary,
                    tooltip: 'Solicitar identidad',
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Bienvenido, ${usuario.nombre}. Esta billetera es solo tuya.',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 20),
              if (aprobadas.isNotEmpty) ...[
                const _SectionTitle(
                  icon: Icons.vpn_key_outlined,
                  label: 'Credenciales Activas',
                  color: AppColors.accent,
                ),
                const SizedBox(height: 12),
                ...aprobadas.map(
                  (s) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _CredencialAprobadaCard(
                      solicitud: s,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => SolicitudDetailScreen(solicitud: s),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (pendientes.isNotEmpty) ...[
                const _SectionTitle(
                  label: 'Solicitudes en Revisión',
                  color: AppColors.textMuted,
                ),
                const SizedBox(height: 12),
                ...pendientes.map(
                  (s) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _SolicitudPendienteRow(solicitud: s),
                  ),
                ),
              ],
              if (solicitudes.isEmpty) _EmptyState(onSolicitar: _openSolicitarIdentidad),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _openSolicitarIdentidad,
                icon: const Icon(Icons.add),
                label: const Text('Solicitar identidad'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({this.icon, required this.label, required this.color});

  final IconData? icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 6),
        ],
        Text(
          label,
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: color),
        ),
      ],
    );
  }
}

class _CredencialAprobadaCard extends StatelessWidget {
  const _CredencialAprobadaCard({required this.solicitud, required this.onTap});

  final Solicitud solicitud;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.badge_outlined, color: AppColors.accent, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    solicitud.tipoCredencial,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.accent,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'APROBADA',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.accent,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(solicitud.nombreCompleto, style: const TextStyle(color: AppColors.textMain)),
          if (solicitud.cedula != null)
            Text(
              'Cédula ${solicitud.cedula}',
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 12,
                fontFamily: 'monospace',
              ),
            ),
          const SizedBox(height: 8),
          const Row(
            children: [
              Icon(Icons.qr_code_rounded, size: 16, color: AppColors.textMuted),
              SizedBox(width: 6),
              Text(
                'Toca para compartir con QR',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SolicitudPendienteRow extends StatelessWidget {
  const _SolicitudPendienteRow({required this.solicitud});

  final Solicitud solicitud;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(solicitud.tipoCredencial, style: const TextStyle(color: AppColors.textMain)),
                const SizedBox(height: 4),
                Text(
                  'Hash: ${(solicitud.hashTemporal ?? '').substring(0, (solicitud.hashTemporal ?? '').length.clamp(0, 20))}...',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'En revisión',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFFB45309),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onSolicitar});

  final VoidCallback onSolicitar;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        children: [
          const Icon(Icons.info_outline, size: 40, color: AppColors.textMuted),
          const SizedBox(height: 12),
          const Text(
            'Tu billetera está vacía',
            style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textMain),
          ),
          const SizedBox(height: 4),
          const Text(
            'Solicita tu identidad oficial para empezar.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 40, color: AppColors.textMuted),
            const SizedBox(height: 12),
            const Text(
              'No se pudo cargar tu billetera',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ),
      ),
    );
  }
}
