import 'package:flutter/material.dart';

import '../models/wallet_document.dart';

/// Datos de ejemplo para validar el flujo visual antes de conectar el
/// backend real (Backend/src/credentials, Backend/src/solicitudes).
class MockWalletData {
  MockWalletData._();

  /// El carnet de discapacidad solo debe listarse si el ciudadano lo tiene
  /// asociado; este flag simula esa condición ("por si existe").
  static const bool citizenHasDisabilityCard = true;

  static List<WalletDocument> initialDocuments() {
    final documents = <WalletDocument>[
      WalletDocument(
        id: 'cedula-0001',
        type: DocumentType.cedula,
        titulo: 'Cédula de Identidad',
        institucion: 'Registro Civil del Ecuador',
        hashBlockchain:
            '7a1c9e3f2b6d4a8e0f5c1b9d7e3a6f2c8b4d0e6f1a9c5b3d7e2f0a4c8b6d1e39',
        emitidaEn: DateTime(2026, 3, 12),
        icon: Icons.badge_outlined,
        color: const Color(0xFF3B82F6),
      ),
    ];

    if (citizenHasDisabilityCard) {
      documents.add(
        WalletDocument(
          id: 'discapacidad-0001',
          type: DocumentType.discapacidad,
          titulo: 'Carnet de Discapacidad',
          institucion: 'CONADIS',
          hashBlockchain:
              '4f0a8c2e6b1d9f3a7c5e0b8d2f6a4c1e9b7d3f0a5c8e2b6d4f1a9c7e3b0d5f21',
          emitidaEn: DateTime(2026, 5, 2),
          icon: Icons.accessible_outlined,
          color: const Color(0xFF10B981),
        ),
      );
    }

    return documents;
  }
}
