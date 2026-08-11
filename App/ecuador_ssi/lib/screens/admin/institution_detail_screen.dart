import 'package:flutter/material.dart';

import '../../services/institutions_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

/// Detalle/edición de una institución: espejo del bloque "Editar
/// Institución" de `AdminDashboard.tsx` en la web — nombre/tipo/wallet,
/// atributos de identidad habilitados, trámites, suspender/reactivar y
/// eliminar.
///
/// Devuelve `true` (via `Navigator.pop`) si algo cambió, para que
/// [InstitutionsListScreen] sepa que debe refrescar su lista.
class InstitutionDetailScreen extends StatefulWidget {
  const InstitutionDetailScreen({super.key, required this.institucion});

  final Map<String, dynamic> institucion;

  @override
  State<InstitutionDetailScreen> createState() =>
      _InstitutionDetailScreenState();
}

class _InstitutionDetailScreenState extends State<InstitutionDetailScreen> {
  late final int _institucionId;
  late final TextEditingController _nombreController;
  late final TextEditingController _tipoController;
  late final TextEditingController _walletController;

  bool _activo = true;
  bool _changed = false;
  bool _saving = false;
  bool _toggling = false;
  bool _deleting = false;
  String? _errorMessage;

  List<Map<String, dynamic>> _catalogo = [];
  bool _loadingCatalogo = true;
  final Set<String> _atributosSeleccionados = {};

  List<Map<String, dynamic>> _tramites = [];
  bool _loadingTramites = true;

  @override
  void initState() {
    super.initState();
    _institucionId = widget.institucion['id'] is int
        ? widget.institucion['id'] as int
        : 0;
    _nombreController = TextEditingController(
      text: widget.institucion['nombre'] as String? ?? '',
    );
    _tipoController = TextEditingController(
      text: widget.institucion['tipo'] as String? ?? '',
    );
    _walletController = TextEditingController(
      text: widget.institucion['wallet'] as String? ?? '',
    );
    _activo = widget.institucion['activo'] != false;

    final atributosRaw = widget.institucion['atributos'];
    if (atributosRaw is List) {
      _atributosSeleccionados.addAll(atributosRaw.whereType<String>());
    }

    _loadCatalogo();
    _loadTramites();
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _tipoController.dispose();
    _walletController.dispose();
    super.dispose();
  }

  Future<void> _loadCatalogo() async {
    final catalogo = await InstitutionsService.fetchAtributosCatalogo();
    if (!mounted) return;
    setState(() {
      _catalogo = catalogo;
      _loadingCatalogo = false;
    });
  }

  Future<void> _loadTramites() async {
    setState(() => _loadingTramites = true);
    final tramites = await InstitutionsService.fetchTramites(_institucionId);
    if (!mounted) return;
    setState(() {
      _tramites = tramites;
      _loadingTramites = false;
    });
  }

  void _pop() => Navigator.of(context).pop(_changed);

  Future<void> _saveChanges() async {
    setState(() {
      _saving = true;
      _errorMessage = null;
    });

    final result = await InstitutionsService.updateInstitution(
      _institucionId,
      nombre: _nombreController.text.trim(),
      tipo: _tipoController.text.trim(),
      wallet: _walletController.text.trim(),
      atributos: _atributosSeleccionados.toList(),
    );

    if (!mounted) return;
    setState(() => _saving = false);

    if (result.containsKey('error')) {
      setState(() => _errorMessage = result['error'] as String);
      return;
    }

    setState(() => _changed = true);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Cambios guardados correctamente.')),
    );
  }

  Future<void> _toggleActivo() async {
    setState(() => _toggling = true);

    final result = await InstitutionsService.updateInstitution(
      _institucionId,
      activo: !_activo,
    );

    if (!mounted) return;
    setState(() => _toggling = false);

    if (result.containsKey('error')) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result['error'] as String)));
      return;
    }

    setState(() {
      _activo = !_activo;
      _changed = true;
    });
  }

  Future<void> _deleteInstitution() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Eliminar institución'),
        content: Text(
          '¿Eliminar la institución "${_nombreController.text}"? '
          'Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _deleting = true);
    final success = await InstitutionsService.deleteInstitution(
      _institucionId,
    );
    if (!mounted) return;
    setState(() => _deleting = false);

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error al eliminar la institución')),
      );
      return;
    }

    Navigator.of(context).pop(true);
  }

  Future<void> _addTramite() async {
    final created = await showDialog<bool>(
      context: context,
      builder: (_) => _TramiteFormDialog(
        title: 'Nuevo trámite',
        onSubmit: (nombre, descripcion) => InstitutionsService.createTramite(
          _institucionId,
          nombre: nombre,
          descripcion: descripcion,
        ),
      ),
    );
    if (created == true) _loadTramites();
  }

  Future<void> _editTramite(Map<String, dynamic> tramite) async {
    final tramiteId = tramite['id'] as int;
    final edited = await showDialog<bool>(
      context: context,
      builder: (_) => _TramiteFormDialog(
        title: 'Editar trámite',
        initialNombre: tramite['nombre'] as String? ?? '',
        initialDescripcion: tramite['descripcion'] as String? ?? '',
        onSubmit: (nombre, descripcion) => InstitutionsService.updateTramite(
          _institucionId,
          tramiteId,
          nombre: nombre,
          descripcion: descripcion,
        ),
      ),
    );
    if (edited == true) _loadTramites();
  }

  Future<void> _toggleTramiteActivo(Map<String, dynamic> tramite) async {
    final tramiteId = tramite['id'] as int;
    final activo = tramite['activo'] != false;

    final result = await InstitutionsService.updateTramite(
      _institucionId,
      tramiteId,
      activo: !activo,
    );

    if (!mounted) return;
    if (result.containsKey('error')) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result['error'] as String)));
      return;
    }
    _loadTramites();
  }

  Future<void> _deleteTramite(Map<String, dynamic> tramite) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Eliminar trámite'),
        content: Text(
          '¿Eliminar el trámite "${tramite['nombre']}"? '
          'Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final tramiteId = tramite['id'] as int;
    final success = await InstitutionsService.deleteTramite(
      _institucionId,
      tramiteId,
    );
    if (!mounted) return;

    if (!success) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Error al eliminar el trámite')));
      return;
    }
    _loadTramites();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.of(context).pop(_changed);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(_nombreController.text.isEmpty
              ? 'Institución'
              : _nombreController.text),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _pop,
          ),
        ),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _buildFormCard(),
              const SizedBox(height: 16),
              _buildSuspendButton(),
              const SizedBox(height: 24),
              _buildAtributosSection(),
              const SizedBox(height: 24),
              _buildTramitesSection(),
              const SizedBox(height: 24),
              _buildDeleteButton(),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormCard() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Datos de la institución',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textMain,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nombreController,
            enabled: !_saving,
            decoration: const InputDecoration(labelText: 'Nombre'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _tipoController,
            enabled: !_saving,
            decoration: const InputDecoration(labelText: 'Tipo'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _walletController,
            enabled: !_saving,
            decoration: const InputDecoration(
              labelText: 'Wallet (0x...)',
              prefixIcon: Icon(Icons.account_balance_wallet_outlined),
            ),
          ),
          if (_errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              _errorMessage!,
              style: const TextStyle(color: AppColors.error, fontSize: 13),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _saving ? null : _saveChanges,
              icon: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.save_outlined),
              label: Text(_saving ? 'Guardando...' : 'Guardar Cambios'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuspendButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _toggling ? null : _toggleActivo,
        icon: _toggling
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(_activo ? Icons.block_outlined : Icons.check_circle_outline),
        label: Text(
          _toggling
              ? 'Actualizando...'
              : (_activo ? 'Suspender' : 'Reactivar'),
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: _activo ? AppColors.error : const Color(0xFF16A34A),
          side: BorderSide(
            color: (_activo ? AppColors.error : const Color(0xFF16A34A))
                .withValues(alpha: 0.4),
          ),
        ),
      ),
    );
  }

  Widget _buildAtributosSection() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Atributos de Identidad',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textMain,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Selecciona qué datos puede exigir esta institución al validar '
            'una identidad. Se guardan junto con "Guardar Cambios".',
            style: TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
          const SizedBox(height: 12),
          if (_loadingCatalogo)
            const Center(child: CircularProgressIndicator())
          else if (_catalogo.isEmpty)
            const Text(
              'No se pudo cargar el catálogo de atributos.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            )
          else
            Column(
              children: _catalogo.map((attr) {
                final clave = attr['clave'] as String? ?? '';
                final etiqueta = attr['etiqueta'] as String? ?? clave;
                return CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  value: _atributosSeleccionados.contains(clave),
                  title: Text(etiqueta, style: const TextStyle(fontSize: 14)),
                  controlAffinity: ListTileControlAffinity.leading,
                  onChanged: (checked) {
                    setState(() {
                      if (checked == true) {
                        _atributosSeleccionados.add(clave);
                      } else {
                        _atributosSeleccionados.remove(clave);
                      }
                    });
                  },
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildTramitesSection() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Trámites Habilitados',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMain,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle_outline),
                color: AppColors.primary,
                tooltip: 'Agregar trámite',
                onPressed: _addTramite,
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_loadingTramites)
            const Center(child: CircularProgressIndicator())
          else if (_tramites.isEmpty)
            const Text(
              'Esta institución no tiene trámites configurados.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            )
          else
            Column(
              children: _tramites
                  .map((tramite) => _TramiteTile(
                        tramite: tramite,
                        onEdit: () => _editTramite(tramite),
                        onToggle: () => _toggleTramiteActivo(tramite),
                        onDelete: () => _deleteTramite(tramite),
                      ))
                  .toList(),
            ),
        ],
      ),
    );
  }

  Widget _buildDeleteButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _deleting ? null : _deleteInstitution,
        icon: _deleting
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.delete_outline),
        label: Text(_deleting ? 'Eliminando...' : 'Eliminar institución'),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: BorderSide(color: AppColors.error.withValues(alpha: 0.4)),
        ),
      ),
    );
  }
}

class _TramiteTile extends StatelessWidget {
  const _TramiteTile({
    required this.tramite,
    required this.onEdit,
    required this.onToggle,
    required this.onDelete,
  });

  final Map<String, dynamic> tramite;
  final VoidCallback onEdit;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final nombre = tramite['nombre'] as String? ?? 'Sin nombre';
    final descripcion = tramite['descripcion'] as String?;
    final activo = tramite['activo'] != false;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  nombre,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMain,
                  ),
                ),
              ),
              _StatusChip(activo: activo),
            ],
          ),
          if (descripcion != null && descripcion.trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              descripcion,
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            children: [
              TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Editar'),
              ),
              TextButton.icon(
                onPressed: onToggle,
                icon: Icon(
                  activo ? Icons.block_outlined : Icons.check_circle_outline,
                  size: 16,
                ),
                label: Text(activo ? 'Desactivar' : 'Activar'),
              ),
              TextButton.icon(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Eliminar'),
                style: TextButton.styleFrom(foregroundColor: AppColors.error),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.activo});

  final bool activo;

  @override
  Widget build(BuildContext context) {
    final color = activo ? const Color(0xFF16A34A) : AppColors.textMuted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        activo ? 'Activo' : 'Inactivo',
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}

/// Diálogo compartido para crear/editar un trámite (nombre + descripción
/// opcional). `onSubmit` recibe los valores y hace la llamada HTTP
/// (create o update, según quién construya el diálogo); el diálogo se
/// cierra con `true` en éxito para que el caller refresque la lista.
class _TramiteFormDialog extends StatefulWidget {
  const _TramiteFormDialog({
    required this.title,
    required this.onSubmit,
    this.initialNombre = '',
    this.initialDescripcion = '',
  });

  final String title;
  final String initialNombre;
  final String initialDescripcion;
  final Future<Map<String, dynamic>> Function(String nombre, String descripcion)
      onSubmit;

  @override
  State<_TramiteFormDialog> createState() => _TramiteFormDialogState();
}

class _TramiteFormDialogState extends State<_TramiteFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombreController;
  late final TextEditingController _descripcionController;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _nombreController = TextEditingController(text: widget.initialNombre);
    _descripcionController =
        TextEditingController(text: widget.initialDescripcion);
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _descripcionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _error = null;
    });

    final result = await widget.onSubmit(
      _nombreController.text.trim(),
      _descripcionController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _saving = false);

    if (result.containsKey('error')) {
      setState(() => _error = result['error'] as String);
      return;
    }

    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _nombreController,
              enabled: !_saving,
              decoration: const InputDecoration(labelText: 'Nombre del trámite'),
              validator: (value) => (value == null || value.trim().isEmpty)
                  ? 'Ingresa el nombre del trámite'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descripcionController,
              enabled: !_saving,
              decoration: const InputDecoration(
                labelText: 'Descripción (opcional)',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: const TextStyle(color: AppColors.error, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(false),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _saving ? null : _submit,
          child: _saving
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Guardar'),
        ),
      ],
    );
  }
}
