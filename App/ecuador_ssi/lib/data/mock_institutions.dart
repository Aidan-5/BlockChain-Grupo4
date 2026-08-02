import 'package:flutter/material.dart';

import '../models/institucion.dart';

/// Instituciones autorizadas de ejemplo para emitir credenciales.
///
/// En el flujo real correspondería a `GET /institutions` del backend
/// (Backend/src/institutions).
class MockInstitutions {
  MockInstitutions._();

  static const List<Institucion> authorized = [
    Institucion(
      id: 'registro-civil',
      nombre: 'Registro Civil del Ecuador',
      tipo: 'Gubernamental',
      icon: Icons.account_balance_outlined,
    ),
    Institucion(
      id: 'conadis',
      nombre: 'CONADIS',
      tipo: 'Gubernamental · Salud',
      icon: Icons.accessible_outlined,
    ),
    Institucion(
      id: 'senescyt',
      nombre: 'SENESCYT',
      tipo: 'Educación',
      icon: Icons.school_outlined,
    ),
    Institucion(
      id: 'msp',
      nombre: 'Ministerio de Salud Pública',
      tipo: 'Salud',
      icon: Icons.local_hospital_outlined,
    ),
    Institucion(
      id: 'iess',
      nombre: 'IESS',
      tipo: 'Seguridad Social',
      icon: Icons.health_and_safety_outlined,
    ),
    Institucion(
      id: 'policia-nacional',
      nombre: 'Policía Nacional del Ecuador',
      tipo: 'Seguridad',
      icon: Icons.local_police_outlined,
    ),
  ];
}
