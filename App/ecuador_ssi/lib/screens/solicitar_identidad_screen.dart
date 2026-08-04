import 'dart:math';

import 'package:flutter/material.dart';

import '../models/session.dart';
import '../models/solicitud.dart';
import '../services/api_exception.dart';
import '../services/solicitudes_api.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Formulario de solicitud de identidad oficial — espejo exacto de
/// Frontend/src/pages/CitizenRequest.tsx: la cédula se genera en el
/// cliente y el tipo de credencial siempre es "Cédula de Identidad"
/// (el backend no permite elegir institución para este flujo, solo
/// un Admin puede aprobar la solicitud desde el panel web).
class SolicitarIdentidadScreen extends StatefulWidget {
  const SolicitarIdentidadScreen({super.key, this.solicitudesApi});

  final SolicitudesApi? solicitudesApi;

  @override
  State<SolicitarIdentidadScreen> createState() =>
      _SolicitarIdentidadScreenState();
}

class _SolicitarIdentidadScreenState extends State<SolicitarIdentidadScreen> {
  late final SolicitudesApi _api = widget.solicitudesApi ?? SolicitudesApi();
  final _formKey = GlobalKey<FormState>();
  final _nombresController = TextEditingController();
  final _apellidosController = TextEditingController();
  final _edadController = TextEditingController();
  final _lugarNacimientoController = TextEditingController();
  DateTime? _fechaNacimiento;
  String _sexo = 'Hombre';
  bool _loading = false;
  String? _error;
  Solicitud? _created;
  String? _cedulaGenerada;

  @override
  void dispose() {
    _nombresController.dispose();
    _apellidosController.dispose();
    _edadController.dispose();
    _lugarNacimientoController.dispose();
    super.dispose();
  }

  String _generarCedula() {
    final random = Random();
    return List.generate(10, (_) => random.nextInt(10)).join();
  }

  Future<void> _pickFechaNacimiento() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(1900),
      lastDate: now,
    );
    if (picked != null) setState(() => _fechaNacimiento = picked);
  }

  Future<void> _submit() async {
    final formValid = _formKey.currentState!.validate();
    if (!formValid || _fechaNacimiento == null) {
      setState(() {
        if (_fechaNacimiento == null) _error = 'Selecciona tu fecha de nacimiento';
      });
      return;
    }

    final usuario = AuthSession.instance.user!;
    final cedula = _generarCedula();

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final solicitud = await _api.create(
        usuarioId: usuario.id,
        tipoCredencial: 'Cédula de Identidad',
        datos: {
          'nombres': _nombresController.text.trim(),
          'apellidos': _apellidosController.text.trim(),
          'edad': _edadController.text.trim(),
          'fechaNacimiento': _formatDate(_fechaNacimiento!),
          'sexo': _sexo,
          'lugarNacimiento': _lugarNacimientoController.text.trim(),
          'cedula': cedula,
        },
      );
      setState(() {
        _created = solicitud;
        _cedulaGenerada = cedula;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'No se pudo enviar la solicitud');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  static String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Solicitar identidad')),
      body: SafeArea(
        child: _created != null
            ? _buildSuccess(context, _created!, _cedulaGenerada!)
            : _buildForm(),
      ),
    );
  }

  Widget _buildSuccess(BuildContext context, Solicitud solicitud, String cedula) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.check_circle_outline,
                color: AppColors.primary,
                size: 32,
              ),
              const SizedBox(height: 12),
              const Text(
                '¡Solicitud enviada exitosamente!',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Tu número de cédula asignado',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              Text(
                cedula,
                style: const TextStyle(
                  fontSize: 18,
                  letterSpacing: 2,
                  fontFamily: 'monospace',
                  color: AppColors.textMain,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Hash de seguimiento',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
              Text(
                solicitud.hashTemporal ?? '—',
                style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
              ),
              const SizedBox(height: 16),
              const Text(
                'Tu clave privada aparecerá en tu Billetera cuando un '
                'administrador apruebe la solicitud.',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Volver a mi billetera'),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Completa este formulario. Cuando un administrador apruebe tu '
            'solicitud, tu credencial aparecerá en tu billetera.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
          const SizedBox(height: 20),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                _error!,
                style: const TextStyle(color: AppColors.error),
              ),
            ),
          TextFormField(
            controller: _nombresController,
            decoration: const InputDecoration(labelText: 'Nombres'),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _apellidosController,
            decoration: const InputDecoration(labelText: 'Apellidos'),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _edadController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Edad'),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null,
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: _pickFechaNacimiento,
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Fecha de nacimiento'),
              child: Text(
                _fechaNacimiento == null
                    ? 'Selecciona una fecha'
                    : _formatDate(_fechaNacimiento!),
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
            onChanged: (value) => setState(() => _sexo = value ?? _sexo),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _lugarNacimientoController,
            decoration: const InputDecoration(labelText: 'Lugar de nacimiento'),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Requerido' : null,
          ),
          const SizedBox(height: 28),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Enviar solicitud'),
          ),
        ],
      ),
    );
  }
}
