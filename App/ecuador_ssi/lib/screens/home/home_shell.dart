import 'package:flutter/material.dart';

import '../../data/mock_wallet_data.dart';
import '../../models/wallet_document.dart';
import 'ajustes_tab.dart';
import 'escanear_tab.dart';
import 'wallet_tab.dart';

/// Contenedor principal luego del login/desbloqueo, con el menú inferior
/// Billetera / Escanear / Ajustes pedido en el flujo.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;
  late final List<WalletDocument> _documents = MockWalletData.initialDocuments();

  void _addDocument(WalletDocument document) {
    setState(() => _documents.add(document));
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      WalletTab(documents: _documents, onDocumentAdded: _addDocument),
      const EscanearTab(),
      const AjustesTab(),
    ];

    return Scaffold(
      // Se construye solo la pestaña activa (en vez de IndexedStack) para
      // que EscanearTab no inicialice la cámara hasta que el usuario la
      // abra explícitamente.
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
