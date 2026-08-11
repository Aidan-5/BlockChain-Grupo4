import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../models/citizen_profile.dart';
import '../models/wallet_document.dart';
import '../services/institutions_service.dart';
import '../services/profile_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Claves de `Solicitud.datosJSON` que ya se muestran en otra parte del
/// detalle (o no son un atributo propio de una institución) y no deben
/// repetirse en "Datos registrados".
const _clavesDatosPersonales = {
  'nombres',
  'apellidos',
  'cedula',
  'sexo',
  'edad',
  'lugarNacimiento',
  'fechaNacimiento',
  'provinciaCodigo',
  'provinciaNombre',
  'parroquia',
};

/// Detalle de un documento/credencial. Desde aquí el ciudadano comparte su
/// identidad generando un QR con divulgación selectiva, y puede revisar los
/// atributos registrados junto con los trámites que ofrece la institución
/// emisora.
class DocumentDetailScreen extends StatefulWidget {
  const DocumentDetailScreen({
    super.key,
    required this.document,
    this.userId = 0,
  });

  final WalletDocument document;
  final int userId;

  @override
  State<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends State<DocumentDetailScreen> {
  List<Map<String, dynamic>> _catalogo = [];
  List<Map<String, dynamic>> _tramites = [];
  bool _loadingExtras = true;

  @override
  void initState() {
    super.initState();
    _loadExtras();
  }

  Future<void> _loadExtras() async {
    final institucionId = widget.document.institucionId;

    final results = await Future.wait([
      InstitutionsService.fetchAtributosCatalogo(),
      (institucionId != null && institucionId > 0)
          ? InstitutionsService.fetchTramites(institucionId)
          : Future.value(<Map<String, dynamic>>[]),
    ]);

    if (!mounted) return;
    setState(() {
      _catalogo = results[0];
      _tramites = results[1];
      _loadingExtras = false;
    });
  }

  /// Atributos de identidad propios de la institución (excluye los datos
  /// personales básicos), traducidos a `{etiqueta: valor}` usando el
  /// catálogo de atributos.
  List<MapEntry<String, String>> get _atributosExtra {
    final datos = widget.document.datosJSON;
    if (datos == null) return [];

    final entries = <MapEntry<String, String>>[];
    for (final item in datos.entries) {
      if (_clavesDatosPersonales.contains(item.key)) continue;

      Map<String, dynamic>? meta;
      for (final candidato in _catalogo) {
        if (candidato['clave'] == item.key) {
          meta = candidato;
          break;
        }
      }
      if (meta == null) continue;

      final etiqueta = meta['etiqueta'] as String? ?? item.key;
      String valor;
      if (meta['tipo'] == 'BOOLEAN') {
        valor = (item.value == true || item.value == 'true') ? 'Sí' : 'No';
      } else {
        valor = item.value?.toString() ?? '';
      }
      entries.add(MapEntry(etiqueta, valor));
    }
    return entries;
  }

  Future<void> _showQrSheet(BuildContext context) async {
    final document = widget.document;
    final profile = widget.userId > 0
        ? await ProfileService.fetchProfile(widget.userId)
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
    final document = widget.document;
    final atributosExtra = _atributosExtra;

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
            if (_loadingExtras) ...[
              const SizedBox(height: 20),
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(12),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              ),
            ] else ...[
              if (atributosExtra.isNotEmpty) ...[
                const SizedBox(height: 20),
                _AtributosCard(atributos: atributosExtra),
              ],
              if (_tramites.isNotEmpty) ...[
                const SizedBox(height: 20),
                _TramitesCard(tramites: _tramites),
              ],
            ],
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

/// Muestra los atributos de identidad propios de la institución que el
/// ciudadano llenó al solicitar esta credencial (ver
/// `_DocumentDetailScreenState._atributosExtra`).
class _AtributosCard extends StatelessWidget {
  const _AtributosCard({required this.atributos});

  final List<MapEntry<String, String>> atributos;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Datos registrados',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textMuted,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 14),
          for (var i = 0; i < atributos.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            _DetailRow(
              label: atributos[i].key,
              value: atributos[i].value,
            ),
          ],
        ],
      ),
    );
  }
}

/// Muestra los trámites activos que ofrece la institución emisora de esta
/// credencial (`GET /institutions/:institucionId/tramites`).
class _TramitesCard extends StatelessWidget {
  const _TramitesCard({required this.tramites});

  final List<Map<String, dynamic>> tramites;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.assignment_outlined,
                size: 16,
                color: AppColors.textMuted,
              ),
              SizedBox(width: 8),
              Text(
                'Trámites disponibles',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          for (var i = 0; i < tramites.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            _TramiteRow(tramite: tramites[i]),
          ],
        ],
      ),
    );
  }
}

class _TramiteRow extends StatelessWidget {
  const _TramiteRow({required this.tramite});

  final Map<String, dynamic> tramite;

  @override
  Widget build(BuildContext context) {
    final nombre = tramite['nombre'] as String? ?? 'Trámite';
    final descripcion = tramite['descripcion'] as String?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          nombre,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textMain,
          ),
        ),
        if (descripcion != null && descripcion.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            descripcion,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ],
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
