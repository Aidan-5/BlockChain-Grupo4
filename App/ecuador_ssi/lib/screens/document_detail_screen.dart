import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../models/citizen_profile.dart';
import '../models/wallet_document.dart';
import '../services/profile_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Detalle de un documento/credencial. Desde aquí el ciudadano comparte su
/// identidad generando un QR con divulgación selectiva.
class DocumentDetailScreen extends StatelessWidget {
  const DocumentDetailScreen({
    super.key,
    required this.document,
    this.userId = 0,
  });

  final WalletDocument document;
  final int userId;

  Future<void> _showQrSheet(BuildContext context) async {
    final profile = userId > 0
        ? await ProfileService.fetchProfile(userId)
        : null;

    if (!context.mounted) return;

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
                'Compartir ${document.titulo}',
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
                  data: document.hashBlockchain,
                  size: 200,
                  backgroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 20),
            const _PrivacyBadge(),
            const SizedBox(height: 16),
            _DisclosedInfoBox(document: document, profile: profile),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(document.titulo)),
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
                          color: document.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          document.icon,
                          color: document.color,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              document.titulo,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textMain,
                              ),
                            ),
                            Text(
                              document.institucion,
                              style: const TextStyle(
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
                  _DetailRow(
                    label: 'Emitida el',
                    value: _formatDate(document.emitidaEn),
                  ),
                  const SizedBox(height: 12),
                  _DetailRow(
                    label: 'Hash en blockchain',
                    value: document.hashBlockchain,
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

  static String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }
}

/// Indica que el QR solo revela lo mínimo necesario para verificar la
/// identidad, no todos los datos del ciudadano.
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
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.lock_outline, size: 16, color: Color(0xFF8A6D00)),
          const SizedBox(width: 8),
          Text(
            'Privacidad protegida',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF8A6D00),
            ),
          ),
        ],
      ),
    );
  }
}

/// Caja con la información mínima que se divulga al escanear el QR:
/// mayoría de edad (no la fecha de nacimiento exacta), nombre completo y
/// los datos propios de la credencial.
class _DisclosedInfoBox extends StatelessWidget {
  const _DisclosedInfoBox({required this.document, required this.profile});

  final WalletDocument document;
  final CitizenProfile? profile;

  @override
  Widget build(BuildContext context) {
    final esMayorDeEdad = profile?.esMayorDeEdad ?? true;
    final nombreCompleto = profile?.nombreCompleto ?? 'Ciudadano Registrado';

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
          _DetailRow(label: 'Nombres completos', value: nombreCompleto),
          const SizedBox(height: 12),
          _DetailRow(label: 'Documento', value: document.titulo),
          const SizedBox(height: 12),
          _DetailRow(label: 'Institución emisora', value: document.institucion),
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
