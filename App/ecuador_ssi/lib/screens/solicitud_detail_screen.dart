import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../models/solicitud.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Detalle de una credencial aprobada. El QR codifica `hashTemporal`, que
/// es el mismo valor que Frontend/src/pages/Wallet.tsx muestra como
/// "Clave Privada" — el backend no expone el hash real registrado en
/// blockchain (`Credencial.hashBlockchain`) a través de este endpoint,
/// solo al momento de la aprobación (ver SolicitudesService.approve()).
class SolicitudDetailScreen extends StatelessWidget {
  const SolicitudDetailScreen({super.key, required this.solicitud});

  final Solicitud solicitud;

  bool get _esMayorDeEdad {
    final fecha = solicitud.fechaNacimiento;
    if (fecha == null) return false;
    final parsed = DateTime.tryParse(fecha);
    if (parsed == null) return false;
    final now = DateTime.now();
    var edad = now.year - parsed.year;
    final aunNoCumple =
        now.month < parsed.month ||
        (now.month == parsed.month && now.day < parsed.day);
    if (aunNoCumple) edad--;
    return edad >= 18;
  }

  void _showQrSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
          children: [
            Center(
              child: Text(
                'Compartir ${solicitud.tipoCredencial}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMain,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.glassBorder),
                ),
                child: QrImageView(
                  data: solicitud.hashTemporal ?? solicitud.id.toString(),
                  size: 200,
                  backgroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 20),
            const _PrivacyBadge(),
            const SizedBox(height: 16),
            _DisclosedInfoBox(
              solicitud: solicitud,
              esMayorDeEdad: _esMayorDeEdad,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(solicitud.tipoCredencial)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.badge_outlined,
                          color: AppColors.primary,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              solicitud.tipoCredencial,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textMain,
                              ),
                            ),
                            const Text(
                              'Registro Civil del Ecuador',
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 32, color: AppColors.glassBorder),
                  _DetailRow(label: 'Nombres completos', value: solicitud.nombreCompleto),
                  if (solicitud.cedula != null) ...[
                    const SizedBox(height: 12),
                    _DetailRow(label: 'Cédula asignada', value: solicitud.cedula!),
                  ],
                  if (solicitud.lugarNacimiento != null) ...[
                    const SizedBox(height: 12),
                    _DetailRow(
                      label: 'Lugar de nacimiento',
                      value: solicitud.lugarNacimiento!,
                    ),
                  ],
                  const SizedBox(height: 12),
                  _DetailRow(
                    label: 'Clave privada',
                    value: solicitud.hashTemporal ?? '—',
                    monospace: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showQrSheet(context),
              icon: const Icon(Icons.qr_code_rounded),
              label: const Text('Compartir identidad con QR'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrivacyBadge extends StatelessWidget {
  const _PrivacyBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_outline, size: 16, color: Color(0xFF8A6D00)),
          SizedBox(width: 8),
          Text(
            'Privacidad protegida',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF8A6D00),
            ),
          ),
        ],
      ),
    );
  }
}

class _DisclosedInfoBox extends StatelessWidget {
  const _DisclosedInfoBox({required this.solicitud, required this.esMayorDeEdad});

  final Solicitud solicitud;
  final bool esMayorDeEdad;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Información compartida',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textMuted,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Icon(
                esMayorDeEdad ? Icons.check_circle : Icons.cancel,
                color: esMayorDeEdad ? AppColors.primary : AppColors.error,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                esMayorDeEdad ? 'Mayor de edad' : 'Menor de edad',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _DetailRow(label: 'Nombres completos', value: solicitud.nombreCompleto),
          const SizedBox(height: 12),
          _DetailRow(label: 'Documento', value: solicitud.tipoCredencial),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
    this.monospace = false,
  });

  final String label;
  final String value;
  final bool monospace;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: AppColors.textMain,
            fontSize: 14,
            fontFamily: monospace ? 'monospace' : null,
          ),
        ),
      ],
    );
  }
}
