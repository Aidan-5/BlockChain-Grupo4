import 'package:flutter/material.dart';

import '../../models/wallet_document.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../document_detail_screen.dart';
import '../solicitar_identidad_screen.dart';
import '../solicitudes_historial_screen.dart';

class WalletTab extends StatelessWidget {
  const WalletTab({super.key, required this.documents, this.userId = 0});

  final List<WalletDocument> documents;
  final int userId;

  void _openDetail(BuildContext context, WalletDocument document) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DocumentDetailScreen(document: document, userId: userId),
      ),
    );
  }

  void _openSolicitudesHistorial(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SolicitudesHistorialScreen(userId: userId),
      ),
    );
  }

  Future<void> _openSolicitarIdentidad(BuildContext context) async {
    final success = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => SolicitarIdentidadScreen(userId: userId),
      ),
    );
    if (success == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Solicitud enviada. Revisa su estado en el historial de '
            'solicitudes.',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
          sliver: SliverToBoxAdapter(
            child: Row(
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
                Row(
                  children: [
                    IconButton(
                      onPressed: () => _openSolicitarIdentidad(context),
                      icon: const Icon(Icons.assignment_ind_outlined),
                      color: AppColors.textMuted,
                      tooltip: 'Solicitar identidad',
                    ),
                    IconButton(
                      onPressed: () => _openSolicitudesHistorial(context),
                      icon: const Icon(Icons.history_outlined),
                      color: AppColors.textMuted,
                      tooltip: 'Historial de solicitudes',
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
          sliver: SliverToBoxAdapter(
            child: Text(
              'Toca cualquier documento para compartir tu identidad '
              'mediante un código QR.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          ),
        ),
        if (documents.isEmpty)
          const SliverPadding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverToBoxAdapter(child: _EmptyWallet()),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList.separated(
              itemCount: documents.length,
              separatorBuilder: (_, _) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final document = documents[index];
                return _DocumentCard(
                  document: document,
                  onTap: () => _openDetail(context, document),
                );
              },
            ),
          ),
        const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
      ],
    );
  }
}

class _DocumentCard extends StatelessWidget {
  const _DocumentCard({required this.document, required this.onTap});

  final WalletDocument document;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: document.color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(document.icon, color: document.color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.titulo,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMain,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  document.institucion,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.qr_code_rounded,
            color: AppColors.textMuted,
            size: 22,
          ),
        ],
      ),
    );
  }
}

/// Estado vacío cuando el ciudadano todavía no tiene credenciales emitidas.
class _EmptyWallet extends StatelessWidget {
  const _EmptyWallet();

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        children: [
          const Icon(
            Icons.folder_off_outlined,
            size: 40,
            color: AppColors.textMuted,
          ),
          const SizedBox(height: 12),
          const Text(
            'Todavía no tienes credenciales',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textMain,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Cuando una institución emita una credencial a tu nombre, '
            'aparecerá aquí.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
