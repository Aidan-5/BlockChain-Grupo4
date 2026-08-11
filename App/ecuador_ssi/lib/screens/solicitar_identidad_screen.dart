import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../services/api_config_service.dart';
import '../services/institutions_service.dart';
import '../services/session_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Formulario para que el ciudadano pida que una institución le emita una
/// identidad (Cédula o Carnet de Discapacidad), análogo a
/// `Frontend/src/pages/CitizenRequest.tsx`. La solicitud queda PENDIENTE
/// hasta que la institución la apruebe/rechace desde la plataforma web.
class SolicitarIdentidadScreen extends StatefulWidget {
  const SolicitarIdentidadScreen({super.key, required this.userId});

  final int userId;

  @override
  State<SolicitarIdentidadScreen> createState() =>
      _SolicitarIdentidadScreenState();
}

class _SolicitarIdentidadScreenState extends State<SolicitarIdentidadScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nombresController = TextEditingController();
  final _apellidosController = TextEditingController();

  DateTime? _fechaNacimiento;
  String _sexo = 'Hombre';
  String _tipoCredencial = 'CEDULA';

  bool _loadingData = true;
  bool _loadError = false;
  bool _submitting = false;
  String? _errorMessage;

  List<Map<String, dynamic>> _instituciones = [];
  List<Map<String, dynamic>> _catalogo = [];
  Map<String, dynamic>? _institucionSeleccionada;

  // Controladores/valores de los campos dinámicos (uno por atributo STRING
  // de la institución elegida) y valores Sí/No de los atributos BOOLEAN.
  final Map<String, TextEditingController> _atributoControllers = {};
  final Map<String, String?> _atributoBooleanValues = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _nombresController.dispose();
    _apellidosController.dispose();
    for (final controller in _atributoControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loadingData = true;
      _loadError = false;
    });

    try {
      final results = await Future.wait([
        InstitutionsService.fetchInstitutions(),
        InstitutionsService.fetchAtributosCatalogo(),
      ]);
      if (!mounted) return;

      setState(() {
        _instituciones = results[0];
        _catalogo = results[1];
        _loadingData = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingData = false;
        _loadError = true;
      });
    }
  }

  Map<String, dynamic>? _catalogoEntry(String clave) {
    for (final entry in _catalogo) {
      if (entry['clave'] == clave) return entry;
    }
    return null;
  }

  List<String> get _atributosInstitucionSeleccionada {
    final atributos = _institucionSeleccionada?['atributos'];
    if (atributos is! List) return [];
    return atributos.whereType<String>().toList();
  }

  void _onInstitucionChanged(Map<String, dynamic>? institucion) {
    setState(() {
      _institucionSeleccionada = institucion;
      // Al cambiar de institución se limpian los valores de atributos
      // previos: ya no aplican a la nueva institución seleccionada.
      for (final controller in _atributoControllers.values) {
        controller.dispose();
      }
      _atributoControllers.clear();
      _atributoBooleanValues.clear();
    });
  }

  Future<void> _pickFechaNacimiento() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _fechaNacimiento ?? DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(1900),
      lastDate: now,
      helpText: 'Fecha de nacimiento',
    );
    if (picked != null) {
      setState(() => _fechaNacimiento = picked);
    }
  }

  static String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }

  static String _formatIsoDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  Future<void> _submit() async {
    setState(() => _errorMessage = null);

    final formValid = _formKey.currentState?.validate() ?? false;
    final institucion = _institucionSeleccionada;

    if (institucion == null) {
      setState(() => _errorMessage = 'Selecciona una institución emisora');
      return;
    }
    if (_fechaNacimiento == null) {
      setState(() => _errorMessage = 'Selecciona tu fecha de nacimiento');
      return;
    }
    if (!formValid) return;

    final datos = <String, dynamic>{
      'nombres': _nombresController.text.trim(),
      'apellidos': _apellidosController.text.trim(),
      'fechaNacimiento': _formatIsoDate(_fechaNacimiento!),
      'sexo': _sexo,
    };

    for (final clave in _atributosInstitucionSeleccionada) {
      final meta = _catalogoEntry(clave);
      if (meta == null) continue;
      if (meta['tipo'] == 'BOOLEAN') {
        datos[clave] = _atributoBooleanValues[clave] ?? 'false';
      } else {
        datos[clave] = _atributoControllers[clave]?.text.trim() ?? '';
      }
    }

    setState(() => _submitting = true);

    try {
      final baseUrl = await ApiConfigService.getBaseUrl();
      final token = await SessionService.getToken();
      final response = await http
          .post(
            Uri.parse('$baseUrl/solicitudes'),
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'tipoCredencial': _tipoCredencial,
              'institucionId': institucion['id'],
              'datosJSON': jsonEncode(datos),
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Solicitud enviada. Quedará pendiente hasta que la '
              'institución la apruebe.',
            ),
          ),
        );
        Navigator.of(context).pop(true);
        return;
      }

      String message = 'No se pudo enviar la solicitud. Intenta de nuevo.';
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic> && decoded['message'] != null) {
          final rawMessage = decoded['message'];
          message = rawMessage is List
              ? rawMessage.join('\n')
              : rawMessage.toString();
        }
      } catch (_) {
        // Ignora body no-JSON, se mantiene el mensaje genérico.
      }

      setState(() {
        _submitting = false;
        _errorMessage = message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Solicitar Identidad')),
      body: SafeArea(
        child: _loadingData
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              )
            : _loadError
            ? _LoadError(onRetry: _loadData)
            : _buildForm(context),
      ),
    );
  }

  Widget _buildForm(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Completa tus datos para pedir que una institución emita tu '
            'identidad oficial en la red blockchain. Tu solicitud quedará '
            'pendiente de aprobación.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
          const SizedBox(height: 24),
          if (_errorMessage != null) ...[
            _ErrorBanner(message: _errorMessage!),
            const SizedBox(height: 20),
          ],
          const _SectionTitle('Institución y tipo de identidad'),
          const SizedBox(height: 12),
          if (_instituciones.isEmpty)
            const GlassCard(
              child: Text(
                'No hay instituciones disponibles todavía. Contacta al '
                'administrador para poder enviar tu solicitud.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            )
          else ...[
            DropdownButtonFormField<int>(
              initialValue: _institucionSeleccionada == null
                  ? null
                  : _institucionSeleccionada!['id'] as int,
              decoration: const InputDecoration(labelText: 'Institución'),
              items: _instituciones
                  .map(
                    (institucion) => DropdownMenuItem<int>(
                      value: institucion['id'] as int,
                      child: Text(institucion['nombre'] as String? ?? ''),
                    ),
                  )
                  .toList(),
              onChanged: (id) {
                final institucion = _instituciones.firstWhere(
                  (i) => i['id'] == id,
                );
                _onInstitucionChanged(institucion);
              },
              validator: (_) => _institucionSeleccionada == null
                  ? 'Selecciona una institución'
                  : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _tipoCredencial,
              decoration: const InputDecoration(labelText: 'Tipo de identidad'),
              items: const [
                DropdownMenuItem(
                  value: 'CEDULA',
                  child: Text('Cédula de Identidad (estándar)'),
                ),
                DropdownMenuItem(
                  value: 'DISCAPACIDAD',
                  child: Text('Carnet de Discapacidad'),
                ),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _tipoCredencial = value);
              },
            ),
          ],
          if (_atributosInstitucionSeleccionada.isNotEmpty) ...[
            const SizedBox(height: 28),
            _SectionTitle(
              'Datos requeridos por '
              '${_institucionSeleccionada?['nombre'] ?? 'la institución'}',
            ),
            const SizedBox(height: 12),
            ..._atributosInstitucionSeleccionada.map(_buildAtributoField),
          ],
          const SizedBox(height: 28),
          const _SectionTitle('Información del ciudadano'),
          const SizedBox(height: 12),
          TextFormField(
            controller: _nombresController,
            decoration: const InputDecoration(labelText: 'Nombres'),
            validator: (value) => (value == null || value.trim().isEmpty)
                ? 'Ingresa tus nombres'
                : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _apellidosController,
            decoration: const InputDecoration(labelText: 'Apellidos'),
            validator: (value) => (value == null || value.trim().isEmpty)
                ? 'Ingresa tus apellidos'
                : null,
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: _pickFechaNacimiento,
            borderRadius: BorderRadius.circular(12),
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Fecha de nacimiento',
                suffixIcon: Icon(Icons.calendar_today_outlined),
              ),
              child: Text(
                _fechaNacimiento == null
                    ? 'Selecciona una fecha'
                    : _formatDate(_fechaNacimiento!),
                style: TextStyle(
                  color: _fechaNacimiento == null
                      ? AppColors.textMuted
                      : AppColors.textMain,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _sexo,
            decoration: const InputDecoration(labelText: 'Sexo'),
            items: const [
              DropdownMenuItem(value: 'Hombre', child: Text('Hombre')),
              DropdownMenuItem(value: 'Mujer', child: Text('Mujer')),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _sexo = value);
            },
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: (_submitting || _instituciones.isEmpty) ? null : _submit,
            child: _submitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Enviar Solicitud'),
          ),
        ],
      ),
    );
  }

  Widget _buildAtributoField(String clave) {
    final meta = _catalogoEntry(clave);
    if (meta == null) return const SizedBox.shrink();

    final etiqueta = meta['etiqueta'] as String? ?? clave;
    final esBooleano = meta['tipo'] == 'BOOLEAN';

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: esBooleano
          ? DropdownButtonFormField<String>(
              initialValue: _atributoBooleanValues[clave],
              decoration: InputDecoration(labelText: etiqueta),
              items: const [
                DropdownMenuItem(value: 'true', child: Text('Sí')),
                DropdownMenuItem(value: 'false', child: Text('No')),
              ],
              onChanged: (value) {
                setState(() => _atributoBooleanValues[clave] = value);
              },
              validator: (value) =>
                  (value == null || value.isEmpty) ? 'Selecciona una opción' : null,
            )
          : TextFormField(
              controller: _atributoControllers.putIfAbsent(
                clave,
                () => TextEditingController(),
              ),
              decoration: InputDecoration(labelText: etiqueta),
              validator: (value) => (value == null || value.trim().isEmpty)
                  ? 'Ingresa $etiqueta'
                  : null,
            ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.4)),
      ),
      child: Text(
        message,
        style: const TextStyle(color: AppColors.error, fontSize: 13),
      ),
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.onRetry});

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
              Icons.cloud_off_outlined,
              size: 48,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 16),
            const Text(
              'No se pudo cargar el formulario',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textMain,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Verifica tu conexión e intenta de nuevo.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }
}
