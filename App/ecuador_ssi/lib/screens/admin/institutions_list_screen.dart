import 'package:flutter/material.dart';

import '../../services/institutions_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import 'create_institution_screen.dart';
import 'institution_detail_screen.dart';

/// Pestaña "Instituciones" del panel ADMIN: lista todas las instituciones
/// (activas e inactivas) tal como lo hace `AdminDashboard.tsx` en la web.
class InstitutionsListScreen extends StatefulWidget {
  const InstitutionsListScreen({super.key});

  @override
  State<InstitutionsListScreen> createState() =>
      _InstitutionsListScreenState();
}

class _InstitutionsListScreenState extends State<InstitutionsListScreen> {
  late Future<List<Map<String, dynamic>>> _institutionsFuture;

  @override
  void initState() {
    super.initState();
    _institutionsFuture = InstitutionsService.fetchInstitutions();
  }

  void _refresh() {
    setState(() {
      _institutionsFuture = InstitutionsService.fetchInstitutions();
    });
  }

  Future<void> _openCreate() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const CreateInstitutionScreen()),
    );
    if (created == true) _refresh();
  }

  Future<void> _openDetail(Map<String, dynamic> institucion) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => InstitutionDetailScreen(institucion: institucion),
      ),
    );
    if (changed == true) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Instituciones'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Nueva institución',
            onPressed: _openCreate,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCreate,
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _refresh(),
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _institutionsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              );
            }

            final instituciones = snapshot.data ?? [];
            if (instituciones.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(32),
                children: const [
                  SizedBox(height: 60),
                  Icon(
                    Icons.account_balance_outlined,
                    size: 48,
                    color: AppColors.textMuted,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No hay instituciones registradas todavía.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                ],
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: instituciones.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final institucion = instituciones[index];
                return _InstitutionCard(
                  institucion: institucion,
                  onTap: () => _openDetail(institucion),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _InstitutionCard extends StatelessWidget {
  const _InstitutionCard({required this.institucion, required this.onTap});

  final Map<String, dynamic> institucion;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final activo = institucion['activo'] != false;
    final nombre = institucion['nombre'] as String? ?? 'Sin nombre';
    final tipo = institucion['tipo'] as String? ?? '—';
    final usuarios = institucion['usuariosRegistrados'] is int
        ? institucion['usuariosRegistrados'] as int
        : 0;

    return GlassCard(
      onTap: onTap,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        nombre,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMain,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _StatusBadge(activo: activo),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Tipo: $tipo',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.people_outline,
                      size: 14,
                      color: AppColors.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$usuarios ciudadanos registrados',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textMuted),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.activo});

  final bool activo;

  @override
  Widget build(BuildContext context) {
    final color = activo ? const Color(0xFF16A34A) : AppColors.error;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        activo ? 'Activa' : 'Suspendida',
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
