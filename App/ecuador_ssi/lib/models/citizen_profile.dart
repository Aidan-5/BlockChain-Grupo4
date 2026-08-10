/// Perfil del ciudadano dueño de la billetera, análogo al modelo `Usuario`
/// de Backend/prisma/schema.prisma.
class CitizenProfile {
  const CitizenProfile({
    required this.nombreCompleto,
    required this.cedula,
    this.fechaNacimiento,
    required this.email,
    required this.wallet,
    required this.did,
  });

  final String nombreCompleto;
  final String cedula;
  final DateTime? fechaNacimiento;
  final String email;
  final String wallet;
  final String did;

  bool get esMayorDeEdad {
    final nacimiento = fechaNacimiento;
    if (nacimiento == null) return false;

    final now = DateTime.now();
    var edad = now.year - nacimiento.year;
    final aunNoCumpleEsteAnio =
        now.month < nacimiento.month ||
        (now.month == nacimiento.month && now.day < nacimiento.day);
    if (aunNoCumpleEsteAnio) edad--;
    return edad >= 18;
  }
}
