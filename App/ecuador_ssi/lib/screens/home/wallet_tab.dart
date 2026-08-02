import 'package:flutter/material.dart';

import '../../models/wallet_document.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../add_credential_screen.dart';
import '../document_detail_screen.dart';

class WalletTab extends StatelessWidget {
  const WalletTab({
    super.key,
    required this.documents,
    required this.onDocumentAdded,
  });

  final List<WalletDocument> documents;
  final ValueChanged<WalletDocument> onDocumentAdded;

  Future<void> _openAddCredential(BuildContext context) async {
    final created = await Navigator.of(context).push<WalletDocument>(
      MaterialPageRoute(builder: (_) => const AddCredentialScreen()),
    );
    if (created != null) onDocumentAdded(created);
  }

  void _openDetail(BuildContext context, WalletDocument document) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DocumentDetailScreen(document: document),
      ),
    );
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
                IconButton(
                  onPressed: () => _openAddCredential(context),
                  icon: const Icon(Icons.add_circle_outline),
                  color: AppColors.primary,
                  tooltip: 'Añadir credencial',
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
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          sliver: SliverToBoxAdapter(
            child: OutlinedButton.icon(
              onPressed: () => _openAddCredential(context),
              icon: const Icon(Icons.add),
              label: const Text('Añadir credencial'),
            ),
          ),
        ),
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
