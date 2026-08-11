import 'package:flutter/material.dart';

import '../../models/wallet_document.dart';
import '../../services/credentials_service.dart';
import '../../theme/app_theme.dart';
import 'ajustes_tab.dart';
import 'escanear_tab.dart';
import 'wallet_tab.dart';

/// Contenedor principal luego del login/desbloqueo, con el menú inferior
/// Billetera / Escanear / Ajustes pedido en el flujo.
class HomeShell extends StatefulWidget {
  const HomeShell({
    super.key,
    this.userName = 'Ciudadano',
    this.userEmail = '',
    this.userRol = 'CIUDADANO',
    this.userId = 0,
  });

  final String userName;
  final String userEmail;
  final String userRol;
  final int userId;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  List<WalletDocument> _documents = [];
  bool _loadingDocuments = true;
  bool _loadError = false;

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    setState(() {
      _loadingDocuments = true;
      _loadError = false;
    });

    try {
      // `fetchCredenciales` ya atrapa errores de red/HTTP y devuelve una
      // lista vacía, pero el mapeo a WalletDocument (fuera del servicio)
      // sí puede lanzar si el backend devuelve una forma inesperada, así
      // que ese caso alimenta el estado de error con reintento.
      final raw = await CredentialsService.fetchCredenciales(widget.userId);
      final documents = raw.map(CredentialsService.toWalletDocument).toList();
      if (!mounted) return;

      setState(() {
        _documents = documents;
        _loadingDocuments = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingDocuments = false;
        _loadError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final walletTab = _loadingDocuments
        ? const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          )
        : _loadError
        ? _WalletLoadError(onRetry: _loadDocuments)
        : WalletTab(documents: _documents, userId: widget.userId);

    final tabs = [walletTab, const EscanearTab(), AjustesTab(userId: widget.userId)];

    return Scaffold(
      body: SafeArea(child: tabs[_currentIndex]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            activeIcon: Icon(Icons.account_balance_wallet),
            label: 'Billetera',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner_outlined),
            activeIcon: Icon(Icons.qr_code_scanner),
            label: 'Escanear',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Ajustes',
          ),
        ],
      ),
    );
  }
}

/// Estado de error simple cuando falla la carga de la Billetera, con opción
/// de reintentar sin salir de la pantalla.
class _WalletLoadError extends StatelessWidget {
  const _WalletLoadError({required this.onRetry});

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
              'No se pudo cargar tu billetera',
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
