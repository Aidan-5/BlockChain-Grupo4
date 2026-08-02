import '../models/citizen_profile.dart';

/// Perfil de ejemplo para validar el flujo visual antes de conectar el
/// login real (`POST /auth/login`) del backend.
class MockProfile {
  MockProfile._();

  static final CitizenProfile citizen = CitizenProfile(
    nombreCompleto: 'María Fernanda Vásquez Ortega',
    cedula: '1723456789',
    fechaNacimiento: DateTime(1998, 4, 22),
    email: 'maria.vasquez@ejemplo.ec',
    wallet: '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c',
    did: 'did:besu:0x8f2a55949038a9610f50fb23b5883af3b4ecb3c',
  );
}
