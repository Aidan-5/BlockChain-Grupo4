import 'package:flutter/material.dart';

import '../services/api_config_service.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

/// Pantalla para configurar la URL del backend desde la app misma.
///
/// El backend corre en la PC del usuario y la app se conecta por IP de red
/// local (WiFi). Cada vez que la PC cambia de red esa IP cambia, así que
/// esta pantalla existe para que el usuario la actualice él mismo en
/// segundos, sin depender de un cambio de código y recompilación.
///
/// Debe ser alcanzable ANTES del login: si la URL guardada está mal, el
/// usuario ni siquiera puede autenticarse.
class ServerConfigScreen extends StatefulWidget {
  const ServerConfigScreen({super.key});

  @override
  State<ServerConfigScreen> createState() => _ServerConfigScreenState();
}

enum _TestState { idle, testing, success, failure }

class _ServerConfigScreenState extends State<ServerConfigScreen> {
  final _urlController = TextEditingController();
  bool _loadingInitial = true;
  bool _saving = false;
  _TestState _testState = _TestState.idle;

  @override
  void initState() {
    super.initState();
    _loadCurrentUrl();
  }

  Future<void> _loadCurrentUrl() async {
    final current = await ApiConfigService.getBaseUrl();
    if (!mounted) return;
    setState(() {
      _urlController.text = current;
      _loadingInitial = false;
    });
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa una URL para probar la conexión')),
      );
      return;
    }

    setState(() => _testState = _TestState.testing);
    final ok = await ApiConfigService.testConnection(url);
    if (!mounted) return;
    setState(() => _testState = ok ? _TestState.success : _TestState.failure);
  }

  Future<void> _save() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('La URL del servidor no puede estar vacía')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ApiConfigService.setBaseUrl(url);
      final saved = await ApiConfigService.getBaseUrl();
      if (!mounted) return;
      _urlController.text = saved;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('URL del servidor guardada')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo guardar: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configurar servidor')),
      body: SafeArea(
        child: _loadingInitial
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const Text(
                    'Dirección del backend',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMain,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'La app se conecta al servidor por la IP de red local del '
                    'PC donde corre el backend. Si cambiaste de WiFi (casa, '
                    'universidad, oficina) esa IP cambió y necesitas '
                    'actualizarla aquí.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 13.5, height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextField(
                          controller: _urlController,
                          keyboardType: TextInputType.url,
                          autocorrect: false,
                          onChanged: (_) {
                            if (_testState != _TestState.idle) {
                              setState(() => _testState = _TestState.idle);
                            }
                          },
                          decoration: const InputDecoration(
                            labelText: 'URL del servidor',
                            hintText: 'http://192.168.1.10:3000',
                            prefixIcon: Icon(
                              Icons.dns_outlined,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_testState == _TestState.success)
                          _StatusBanner(
                            icon: Icons.check_circle_outline,
                            color: const Color(0xFF16A34A),
                            message: 'Conectado al servidor',
                          )
                        else if (_testState == _TestState.failure)
                          const _StatusBanner(
                            icon: Icons.error_outline,
                            color: AppColors.error,
                            message:
                                'No se pudo conectar — revisa que el backend '
                                'esté corriendo y que el celular esté en la '
                                'misma red WiFi que el servidor.',
                          ),
                        if (_testState == _TestState.success ||
                            _testState == _TestState.failure)
                          const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _testState == _TestState.testing
                                    ? null
                                    : _testConnection,
                                icon: _testState == _TestState.testing
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(Icons.wifi_find_outlined),
                                label: const Text('Probar conexión'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _saving ? null : _save,
                                icon: _saving
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Icon(Icons.save_outlined),
                                label: const Text('Guardar'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    '¿Cómo obtengo la IP correcta?',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMain,
                    ),
                  ),
                  const SizedBox(height: 8),
                  GlassCard(
                    child: const Text(
                      'En la PC donde corre el backend, abre "cmd" y escribe '
                      '"ipconfig". Busca "Dirección IPv4" del adaptador WiFi '
                      '(no el de Ethernet si no lo usas). Esa es la IP que va '
                      'aquí, seguida de ":3000" — por ejemplo '
                      '"http://192.168.1.10:3000". El celular y la PC deben '
                      'estar conectados a la misma red WiFi.',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 13.5, height: 1.5),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.color,
    required this.message,
  });

  final IconData icon;
  final Color color;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontSize: 13.5, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
