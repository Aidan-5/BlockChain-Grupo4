import '../models/citizen_profile.dart';

/// Perfil de ejemplo para validar el flujo visual antes de conectar el
/// login real (`POST /auth/login`) del backend.
class MockProfile {
  MockProfile._();

  static final CitizenProfile citizen = CitizenProfile(
    nombreCompleto: 'Ciudadano Registrado',
    cedula: 'No registrada',
    fechaNacimiento: null,
    email: '',
    wallet: 'No asignada',
    did: 'No asignado',
  );
}
