import 'package:flutter/material.dart';

import '../../services/session_service.dart';
import '../home/ajustes_tab.dart';
import 'institutions_list_screen.dart';

/// Contenedor principal tras login/desbloqueo para el rol ADMIN. A
/// diferencia de [HomeShell] (billetera/escanear/ajustes, exclusivo de
/// CIUDADANO), un ADMIN no tiene billetera ni nada que escanear — aquí solo
/// gestiona instituciones y sus propios ajustes de cuenta, espejo
/// simplificado de `Frontend/src/pages/AdminDashboard.tsx`.
class AdminHomeShell extends StatefulWidget {
  const AdminHomeShell({super.key, required this.sessionUser});

  final SessionUser sessionUser;

  @override
  State<AdminHomeShell> createState() => _AdminHomeShellState();
}

class _AdminHomeShellState extends State<AdminHomeShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    // AjustesTab fue diseñado para un CIUDADANO (usa `userId` para cargar
    // "Mi perfil" e historial de solicitudes vía ProfileScreen). Un ADMIN no
    // tiene ese perfil de ciudadano, así que se reutiliza el tab (evita
    // duplicar la pantalla de Ajustes solo por esto) pasando `userId: 0`:
    // ProfileScreen ya maneja ese caso con un mensaje en vez de romper (ver
    // `lib/screens/settings/profile_screen.dart`, chequeo `userId <= 0`).
    final tabs = const [InstitutionsListScreen(), AjustesTab(userId: 0)];

    return Scaffold(
      body: SafeArea(child: tabs[_currentIndex]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_outlined),
            activeIcon: Icon(Icons.account_balance),
            label: 'Instituciones',
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
